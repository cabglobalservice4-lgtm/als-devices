-- Rôles de l'équipe
create or replace function public.als_is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.als_staff s where s.user_id = (select auth.uid()));
$$;

create or replace function public.als_is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.als_staff s where s.user_id = (select auth.uid()) and s.role = 'owner');
$$;

alter table public.als_staff enable row level security;
alter table public.als_settings enable row level security;
alter table public.als_categories enable row level security;
alter table public.als_brands enable row level security;
alter table public.als_products enable row level security;
alter table public.als_product_variants enable row level security;
alter table public.als_variant_private enable row level security;
alter table public.als_product_images enable row level security;
alter table public.als_delivery_zones enable row level security;
alter table public.als_orders enable row level security;
alter table public.als_order_items enable row level security;
alter table public.als_pages enable row level security;
alter table public.als_reviews enable row level security;

-- Lecture publique du catalogue (ce qui est actif / publié)
create policy "lecture publique" on public.als_settings for select to anon, authenticated using (true);
create policy "lecture publique" on public.als_categories for select to anon, authenticated using (true);
create policy "lecture publique" on public.als_brands for select to anon, authenticated using (true);
create policy "lecture publique" on public.als_products for select to anon, authenticated
  using (is_active or (select public.als_is_staff()));
create policy "lecture publique" on public.als_product_variants for select to anon, authenticated
  using ((is_active and exists (select 1 from public.als_products p where p.id = product_id and p.is_active)) or (select public.als_is_staff()));
create policy "lecture publique" on public.als_product_images for select to anon, authenticated using (true);
create policy "lecture publique" on public.als_delivery_zones for select to anon, authenticated
  using (is_active or (select public.als_is_staff()));
create policy "lecture publique" on public.als_pages for select to anon, authenticated
  using (is_published or (select public.als_is_staff()));
create policy "lecture publique" on public.als_reviews for select to anon, authenticated
  using (is_published or (select public.als_is_staff()));

-- Écriture réservée à l'équipe
create policy "équipe écrit" on public.als_settings for update to authenticated using ((select public.als_is_staff())) with check ((select public.als_is_staff()));
do $$
declare t text;
begin
  foreach t in array array['als_categories','als_brands','als_products','als_product_variants','als_product_images','als_delivery_zones','als_pages','als_reviews'] loop
    execute format('create policy "équipe ajoute" on public.%I for insert to authenticated with check ((select public.als_is_staff()))', t);
    execute format('create policy "équipe modifie" on public.%I for update to authenticated using ((select public.als_is_staff())) with check ((select public.als_is_staff()))', t);
    execute format('create policy "équipe supprime" on public.%I for delete to authenticated using ((select public.als_is_staff()))', t);
  end loop;
end $$;

-- Données sensibles : équipe uniquement
create policy "équipe uniquement" on public.als_variant_private for all to authenticated
  using ((select public.als_is_staff())) with check ((select public.als_is_staff()));
create policy "équipe lit" on public.als_orders for select to authenticated using ((select public.als_is_staff()));
create policy "équipe lit" on public.als_order_items for select to authenticated using ((select public.als_is_staff()));
create policy "équipe lit" on public.als_staff for select to authenticated
  using (user_id = (select auth.uid()) or (select public.als_is_staff()));
-- Commandes : création et modification uniquement via les fonctions (aucun insert direct)

-- Nombre de produits en stock par catégorie (page d'accueil)
create view public.als_category_stats with (security_invoker = true) as
  select c.id, c.name, c.slug, c.icon, c.position,
         (select count(*) from public.als_products p where p.category_id = c.id and p.is_active and p.total_stock > 0) as products_count
  from public.als_categories c;
grant select on public.als_category_stats to anon, authenticated;

-- Photos produits : bucket public en lecture, écriture réservée à l'équipe
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('als-devices', 'als-devices', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "als équipe envoie des photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'als-devices' and (select public.als_is_staff()));
create policy "als équipe modifie des photos" on storage.objects for update to authenticated
  using (bucket_id = 'als-devices' and (select public.als_is_staff()));
create policy "als équipe supprime des photos" on storage.objects for delete to authenticated
  using (bucket_id = 'als-devices' and (select public.als_is_staff()));
