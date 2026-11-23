-- =====================================================================
-- Passer une commande (appelée par le site, sans compte client)
-- Prix et stock relus en base, lignes verrouillées : une pièce unique
-- ne peut pas être vendue deux fois. Erreurs renvoyées en JSON (detail).
-- =====================================================================
create or replace function public.als_place_order(p_items jsonb, p_customer jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  s jsonb := coalesce((select data from public.als_settings where id = 1), '{}'::jsonb);
  v_name text := btrim(coalesce(p_customer->>'customer_name', ''));
  v_phone text := btrim(coalesce(p_customer->>'customer_phone', ''));
  v_email text := nullif(btrim(coalesce(p_customer->>'customer_email', '')), '');
  v_method text := coalesce(p_customer->>'delivery_method', 'delivery');
  v_address text := nullif(btrim(coalesce(p_customer->>'address', '')), '');
  v_notes text := nullif(btrim(coalesce(p_customer->>'notes', '')), '');
  v_pay text := coalesce(p_customer->>'payment_method', '');
  v_source text := left(nullif(lower(btrim(coalesce(p_customer->>'source', ''))), ''), 40);
  v_zone public.als_delivery_zones;
  v_errors jsonb := '{}'::jsonb;
  v_lines jsonb := '[]'::jsonb;
  r record;
  v public.als_product_variants;
  p public.als_products;
  v_sub numeric(12,2) := 0;
  v_fee numeric(12,2) := 0;
  v_order public.als_orders;
begin
  -- Validation des champs
  if length(v_name) < 2 or length(v_name) > 120 then v_errors := v_errors || '{"customer_name":"Indiquez votre nom."}'; end if;
  if v_phone !~ '^[0-9 +().-]{8,20}$' then v_errors := v_errors || '{"customer_phone":"Numéro de téléphone invalide."}'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then v_errors := v_errors || '{"customer_email":"Adresse e-mail invalide."}'; end if;
  if v_method not in ('delivery', 'pickup') or (v_method = 'pickup' and coalesce((s->>'pickup_enabled')::boolean, true) is false) then
    v_errors := v_errors || '{"delivery_method":"Mode de réception invalide."}';
  end if;
  if v_method = 'delivery' then
    select * into v_zone from public.als_delivery_zones where id = nullif(p_customer->>'delivery_zone_id', '')::bigint and is_active;
    if v_zone.id is null then v_errors := v_errors || '{"delivery_zone_id":"Choisissez votre zone de livraison."}'; end if;
    if v_address is null then v_errors := v_errors || '{"address":"Indiquez votre adresse de livraison."}'; end if;
  end if;
  if not exists (select 1 from jsonb_array_elements(coalesce(s->'payment_methods', '[]'::jsonb)) m where m->>'value' = v_pay) then
    v_errors := v_errors || '{"payment_method":"Choisissez un moyen de paiement."}';
  end if;
  if coalesce((p_customer->>'accept_terms')::boolean, false) is false then
    v_errors := v_errors || '{"accept_terms":"Merci d''accepter les conditions générales de vente."}';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    v_errors := v_errors || '{"cart":"Votre panier est vide."}';
  end if;
  if v_errors <> '{}'::jsonb then
    raise exception using errcode = '22023', message = 'Formulaire incomplet', detail = v_errors::text;
  end if;

  -- Anti-abus simple : 5 commandes par numéro et par heure
  if (select count(*) from public.als_orders where customer_phone = v_phone and created_at > now() - interval '1 hour') >= 5 then
    raise exception using errcode = '22023', message = 'Trop de commandes en peu de temps. Contactez-nous sur WhatsApp.', detail = '{"cart":"Trop de commandes en peu de temps. Contactez-nous sur WhatsApp."}';
  end if;

  -- Lignes regroupées par variante, verrouillées dans un ordre fixe
  for r in
    select (i->>'variant_id')::bigint as variant_id, least(sum((i->>'quantity')::int), 20)::int as qty
    from jsonb_array_elements(p_items) i
    where (i->>'variant_id') ~ '^\d+$' and (i->>'quantity') ~ '^\d+$' and (i->>'quantity')::int > 0
    group by 1 order by 1
  loop
    select * into v from public.als_product_variants where id = r.variant_id for update;
    select * into p from public.als_products where id = v.product_id;
    if v.id is null or not v.is_active or not p.is_active or v.stock < r.qty or (p.is_unique and r.qty > 1) then
      raise exception using errcode = '22023', message = 'Stock insuffisant',
        detail = jsonb_build_object('cart', coalesce(p.name, 'Un article') || ' n''est plus disponible dans la quantité demandée. Mettez à jour votre panier.')::text;
    end if;
    v_sub := v_sub + v.price * r.qty;
    v_lines := v_lines || jsonb_build_object('v', v.id, 'p', p.id, 'q', r.qty, 'price', v.price, 'name', p.name, 'sku', v.sku,
      'label', nullif(concat_ws(' · ', v.storage, v.color), ''), 'unique', p.is_unique);
  end loop;

  if jsonb_array_length(v_lines) = 0 then
    raise exception using errcode = '22023', message = 'Panier vide', detail = '{"cart":"Votre panier est vide."}';
  end if;

  if v_method = 'delivery' then v_fee := v_zone.fee; end if;

  insert into public.als_orders (number, customer_name, customer_phone, customer_email, delivery_method, delivery_zone_id,
    delivery_zone_name, address, notes, subtotal, delivery_fee, total, currency, payment_method, source)
  values (
    'ALS-' || to_char(now() at time zone 'Africa/Dakar', 'YYMM') || '-' || lpad(nextval('public.als_order_seq')::text, 4, '0'),
    v_name, v_phone, v_email, v_method, v_zone.id, v_zone.name, case when v_method = 'delivery' then v_address end, v_notes,
    v_sub, v_fee, v_sub + v_fee, coalesce(s->>'currency', 'XOF'), v_pay, v_source)
  returning * into v_order;

  for r in select t.l from jsonb_array_elements(v_lines) as t(l) loop
    insert into public.als_order_items (order_id, product_id, variant_id, product_name, variant_label, sku, unit_price, quantity, line_total)
    values (v_order.id, (r.l->>'p')::bigint, (r.l->>'v')::bigint, r.l->>'name', r.l->>'label', r.l->>'sku',
            (r.l->>'price')::numeric, (r.l->>'q')::int, (r.l->>'price')::numeric * (r.l->>'q')::int);
    update public.als_product_variants
      set stock = stock - (r.l->>'q')::int,
          is_active = case when (r.l->>'unique')::boolean and stock - (r.l->>'q')::int = 0 then false else is_active end
      where id = (r.l->>'v')::bigint;
  end loop;

  return jsonb_build_object('number', v_order.number, 'token', v_order.public_token, 'total', v_order.total, 'currency', v_order.currency);
end $$;

-- Suivi de commande par lien secret (sans compte)
create or replace function public.als_get_order(p_token uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'number', o.number, 'token', o.public_token, 'created_at', o.created_at,
    'customer_name', o.customer_name, 'customer_phone', o.customer_phone, 'customer_email', o.customer_email,
    'delivery_method', o.delivery_method, 'zone', o.delivery_zone_name, 'address', o.address,
    'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee, 'total', o.total, 'currency', o.currency,
    'payment_method', o.payment_method, 'payment_status', o.payment_status, 'status', o.status, 'tracking_number', o.tracking_number,
    'items', coalesce((select jsonb_agg(jsonb_build_object('product_name', i.product_name, 'variant_label', i.variant_label, 'sku', i.sku,
                'quantity', i.quantity, 'unit_price', i.unit_price, 'line_total', i.line_total) order by i.id)
              from public.als_order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.als_orders o where o.public_token = p_token;
$$;

-- Mise à jour d'une commande par l'équipe ; annulation = remise en stock
create or replace function public.als_update_order(p_id bigint, p_status text, p_payment_status text, p_payment_reference text, p_tracking_number text)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.als_orders; it record; v public.als_product_variants;
begin
  if not public.als_is_staff() then raise exception using errcode = '42501', message = 'Accès réservé à l''équipe.'; end if;
  select * into o from public.als_orders where id = p_id for update;
  if o.id is null then raise exception 'Commande introuvable'; end if;

  if p_status = 'cancelled' and o.status <> 'cancelled' then
    for it in select * from public.als_order_items where order_id = o.id and variant_id is not null order by variant_id loop
      update public.als_product_variants set stock = stock + it.quantity, is_active = true where id = it.variant_id;
    end loop;
  elsif o.status = 'cancelled' and p_status <> 'cancelled' then
    for it in select * from public.als_order_items where order_id = o.id and variant_id is not null order by variant_id loop
      select * into v from public.als_product_variants where id = it.variant_id for update;
      if v.stock < it.quantity then
        raise exception using errcode = '22023', message = 'Stock insuffisant pour réactiver la commande (' || it.product_name || ').';
      end if;
      update public.als_product_variants set stock = stock - it.quantity where id = it.variant_id;
    end loop;
  end if;

  update public.als_orders set status = p_status, payment_status = p_payment_status,
    payment_reference = nullif(btrim(coalesce(p_payment_reference, '')), ''),
    tracking_number = nullif(btrim(coalesce(p_tracking_number, '')), '')
  where id = o.id;
end $$;

-- =====================================================================
-- Enregistrer un produit et ses variantes en une seule transaction
-- =====================================================================
create or replace function public.als__save_product(p jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_id bigint; v jsonb; v_vid bigint; keep bigint[] := '{}'; other text;
begin
  if coalesce(nullif(p->>'id', ''), '') <> '' then
    v_id := (p->>'id')::bigint;
    update public.als_products set
      category_id = (p->>'category_id')::bigint, brand_id = nullif(p->>'brand_id', '')::bigint,
      name = p->>'name', slug = p->>'slug', short_description = nullif(p->>'short_description', ''), description = nullif(p->>'description', ''),
      condition = p->>'condition', grade = case when p->>'condition' = 'refurbished' then nullif(p->>'grade', '') end,
      battery_health = nullif(p->>'battery_health', '')::smallint, warranty_months = coalesce(nullif(p->>'warranty_months', '')::smallint, 12),
      is_unique = coalesce((p->>'is_unique')::boolean, false), is_featured = coalesce((p->>'is_featured')::boolean, false),
      is_active = coalesce((p->>'is_active')::boolean, true), specs = coalesce(p->'specs', '[]'::jsonb),
      meta_title = nullif(p->>'meta_title', ''), meta_description = nullif(p->>'meta_description', '')
    where id = v_id;
    if not found then raise exception 'Produit introuvable'; end if;
  else
    insert into public.als_products (category_id, brand_id, name, slug, short_description, description, condition, grade, battery_health,
      warranty_months, is_unique, is_featured, is_active, is_demo, specs, meta_title, meta_description)
    values ((p->>'category_id')::bigint, nullif(p->>'brand_id', '')::bigint, p->>'name', p->>'slug', nullif(p->>'short_description', ''),
      nullif(p->>'description', ''), coalesce(p->>'condition', 'new'), case when p->>'condition' = 'refurbished' then nullif(p->>'grade', '') end,
      nullif(p->>'battery_health', '')::smallint, coalesce(nullif(p->>'warranty_months', '')::smallint, 12),
      coalesce((p->>'is_unique')::boolean, false), coalesce((p->>'is_featured')::boolean, false), coalesce((p->>'is_active')::boolean, true),
      coalesce((p->>'is_demo')::boolean, false), coalesce(p->'specs', '[]'::jsonb), nullif(p->>'meta_title', ''), nullif(p->>'meta_description', ''))
    on conflict (slug) do update set
      category_id = excluded.category_id, brand_id = excluded.brand_id, name = excluded.name, short_description = coalesce(excluded.short_description, public.als_products.short_description),
      condition = excluded.condition, grade = excluded.grade, battery_health = excluded.battery_health, warranty_months = excluded.warranty_months,
      is_unique = excluded.is_unique, is_active = true
    returning id into v_id;
  end if;

  for v in select * from jsonb_array_elements(coalesce(p->'variants', '[]'::jsonb)) loop
    select pr.name into other from public.als_product_variants x join public.als_products pr on pr.id = x.product_id
      where x.sku = v->>'sku' and x.product_id <> v_id and (nullif(v->>'id', '') is null or x.id <> (v->>'id')::bigint);
    if other is not null then
      raise exception using errcode = '22023', message = 'Le SKU ' || (v->>'sku') || ' est déjà utilisé par « ' || other || ' ».';
    end if;

    if nullif(v->>'id', '') is not null then
      update public.als_product_variants set sku = v->>'sku', color = nullif(v->>'color', ''), color_hex = nullif(v->>'color_hex', ''),
        storage = nullif(v->>'storage', ''), price = (v->>'price')::numeric, compare_at_price = nullif(v->>'compare_at_price', '')::numeric,
        stock = coalesce(nullif(v->>'stock', '')::int, 0), low_stock_threshold = coalesce(nullif(v->>'low_stock_threshold', '')::int, 2),
        is_active = coalesce((v->>'is_active')::boolean, true)
      where id = (v->>'id')::bigint and product_id = v_id returning id into v_vid;
    else
      insert into public.als_product_variants (product_id, sku, color, color_hex, storage, price, compare_at_price, stock, low_stock_threshold, is_active)
      values (v_id, v->>'sku', nullif(v->>'color', ''), nullif(v->>'color_hex', ''), nullif(v->>'storage', ''), (v->>'price')::numeric,
        nullif(v->>'compare_at_price', '')::numeric, coalesce(nullif(v->>'stock', '')::int, 0), coalesce(nullif(v->>'low_stock_threshold', '')::int, 2),
        coalesce((v->>'is_active')::boolean, true))
      on conflict (sku) do update set color = excluded.color, color_hex = excluded.color_hex, storage = excluded.storage, price = excluded.price,
        compare_at_price = excluded.compare_at_price, stock = excluded.stock, is_active = excluded.is_active
      returning id into v_vid;
    end if;
    keep := keep || v_vid;

    if v ? 'serial_number' then
      insert into public.als_variant_private (variant_id, serial_number) values (v_vid, nullif(v->>'serial_number', ''))
      on conflict (variant_id) do update set serial_number = excluded.serial_number;
    end if;
  end loop;

  -- Variantes retirées : désactivées si déjà commandées, supprimées sinon
  if coalesce((p->>'replace_variants')::boolean, true) then
    update public.als_product_variants x set is_active = false
      where x.product_id = v_id and x.id <> all(keep) and exists (select 1 from public.als_order_items i where i.variant_id = x.id);
    delete from public.als_product_variants x
      where x.product_id = v_id and x.id <> all(keep) and not exists (select 1 from public.als_order_items i where i.variant_id = x.id);
  end if;

  perform public.als_refresh_product(v_id);
  return v_id;
end $$;
revoke all on function public.als__save_product(jsonb) from public, anon, authenticated;

create or replace function public.als_save_product(p jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
begin
  if not public.als_is_staff() then raise exception using errcode = '42501', message = 'Accès réservé à l''équipe.'; end if;
  return public.als__save_product(p);
end $$;

-- =====================================================================
-- Tableau de bord
-- =====================================================================
create or replace function public.als_dashboard() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare month_start timestamptz := date_trunc('month', now() at time zone 'Africa/Dakar') at time zone 'Africa/Dakar';
begin
  if not public.als_is_staff() then raise exception using errcode = '42501', message = 'Accès réservé à l''équipe.'; end if;
  return jsonb_build_object(
    'kpis', jsonb_build_object(
      'revenue_month', (select coalesce(sum(total), 0) from public.als_orders where status <> 'cancelled' and created_at >= month_start),
      'orders_month', (select count(*) from public.als_orders where status <> 'cancelled' and created_at >= month_start),
      'orders_to_handle', (select count(*) from public.als_orders where status in ('new', 'confirmed')),
      'pending_payments', (select count(*) from public.als_orders where payment_status = 'pending' and status <> 'cancelled' and payment_method in ('wave', 'orange_money')),
      'break_even', coalesce(((select data from public.als_settings where id = 1)->>'break_even_monthly')::numeric, 0)),
    'series', (select jsonb_agg(jsonb_build_object('day', d::date, 'total', coalesce(x.total, 0), 'orders', coalesce(x.n, 0)) order by d)
      from generate_series((now() at time zone 'Africa/Dakar')::date - 29, (now() at time zone 'Africa/Dakar')::date, interval '1 day') d
      left join (select (created_at at time zone 'Africa/Dakar')::date as day, sum(total) total, count(*) n
                 from public.als_orders where status <> 'cancelled' and created_at > now() - interval '31 days' group by 1) x on x.day = d::date),
    'recentOrders', coalesce((select jsonb_agg(o order by o.created_at desc) from (
      select id, number, customer_name, customer_phone, total, status, payment_status, created_at from public.als_orders order by created_at desc limit 8) o), '[]'::jsonb),
    'lowStock', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'label', nullif(concat_ws(' · ', v.storage, v.color), ''), 'sku', v.sku, 'stock', v.stock) order by v.stock)
      from (select * from public.als_product_variants where is_active and stock <= low_stock_threshold order by stock limit 10) v
      join public.als_products p on p.id = v.product_id), '[]'::jsonb),
    'sources', coalesce((select jsonb_object_agg(src, n) from (select coalesce(source, 'direct') src, count(*) n from public.als_orders
      where created_at > now() - interval '30 days' group by 1) s), '{}'::jsonb)
  );
end $$;

-- =====================================================================
-- Équipe
-- =====================================================================
-- Le tout premier compte connecté devient propriétaire (une seule fois)
create or replace function public.als_claim_owner() returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then return false; end if;
  lock table public.als_staff in exclusive mode;
  if exists (select 1 from public.als_staff) then return public.als_is_staff(); end if;
  insert into public.als_staff (user_id, role, name)
    select id, 'owner', coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)) from auth.users where id = (select auth.uid());
  return true;
end $$;

create or replace function public.als_staff_list() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.als_is_staff() then raise exception using errcode = '42501', message = 'Accès réservé à l''équipe.'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.user_id, 'name', coalesce(s.name, split_part(u.email, '@', 1)), 'email', u.email, 'role', s.role) order by s.created_at)
    from public.als_staff s join auth.users u on u.id = s.user_id), '[]'::jsonb);
end $$;

create or replace function public.als_add_staff(p_email text, p_role text, p_name text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
  if not public.als_is_owner() then raise exception using errcode = '42501', message = 'Réservé au propriétaire.'; end if;
  if p_role not in ('owner', 'employee') then raise exception 'Rôle invalide'; end if;
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then
    raise exception using errcode = '22023', message = 'Aucun compte avec cet e-mail. Créez-le d''abord dans Supabase › Authentication › Add user.';
  end if;
  insert into public.als_staff (user_id, role, name) values (uid, p_role, nullif(btrim(coalesce(p_name, '')), ''))
  on conflict (user_id) do update set role = excluded.role, name = coalesce(excluded.name, public.als_staff.name);
end $$;

create or replace function public.als_remove_staff(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.als_is_owner() then raise exception using errcode = '42501', message = 'Réservé au propriétaire.'; end if;
  if p_user_id = (select auth.uid()) then raise exception using errcode = '22023', message = 'Vous ne pouvez pas retirer votre propre compte.'; end if;
  delete from public.als_staff where user_id = p_user_id;
end $$;

-- Fonctions accessibles depuis le site
revoke all on function public.als_place_order(jsonb, jsonb), public.als_get_order(uuid) from public;
grant execute on function public.als_place_order(jsonb, jsonb), public.als_get_order(uuid) to anon, authenticated;
revoke all on function public.als_update_order(bigint, text, text, text, text), public.als_save_product(jsonb), public.als_dashboard(),
  public.als_claim_owner(), public.als_staff_list(), public.als_add_staff(text, text, text), public.als_remove_staff(uuid) from public, anon;
grant execute on function public.als_update_order(bigint, text, text, text, text), public.als_save_product(jsonb), public.als_dashboard(),
  public.als_claim_owner(), public.als_staff_list(), public.als_add_staff(text, text, text), public.als_remove_staff(uuid) to authenticated;
