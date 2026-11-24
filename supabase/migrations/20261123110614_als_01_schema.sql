-- ALS Devices : schéma de la boutique (tables préfixées als_ pour ne rien mélanger avec les autres sites du projet)

create table public.als_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'employee' check (role in ('owner','employee')),
  name text,
  created_at timestamptz not null default now()
);

create table public.als_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.als_categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  icon text not null default 'phone' check (icon in ('phone','tablet','laptop','watch','accessory')),
  description text,
  position int not null default 0,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.als_brands (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.als_products (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.als_categories(id) on delete restrict,
  brand_id bigint references public.als_brands(id) on delete set null,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  condition text not null default 'new' check (condition in ('new','refurbished')),
  grade text check (grade in ('A','B','C')),
  battery_health smallint check (battery_health between 0 and 100),
  warranty_months smallint not null default 12 check (warranty_months between 0 and 60),
  is_unique boolean not null default false,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  specs jsonb not null default '[]'::jsonb,
  meta_title text,
  meta_description text,
  min_price numeric(12,2) not null default 0,
  total_stock int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index als_products_category_idx on public.als_products (category_id) where is_active;
create index als_products_brand_idx on public.als_products (brand_id);
create index als_products_price_idx on public.als_products (min_price) where is_active;

create table public.als_product_variants (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.als_products(id) on delete cascade,
  sku text not null unique,
  color text,
  color_hex text check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  storage text,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  stock int not null default 0 check (stock >= 0),
  low_stock_threshold int not null default 2 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index als_variants_product_idx on public.als_product_variants (product_id);

-- IMEI / n° de série : table séparée, visible uniquement par l'équipe
create table public.als_variant_private (
  variant_id bigint primary key references public.als_product_variants(id) on delete cascade,
  serial_number text
);

create table public.als_product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.als_products(id) on delete cascade,
  path text not null,
  alt text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index als_images_product_idx on public.als_product_images (product_id, position);

create table public.als_delivery_zones (
  id bigint generated always as identity primary key,
  name text not null,
  fee numeric(12,2) not null default 0 check (fee >= 0),
  delay text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.als_order_seq;

create table public.als_orders (
  id bigint generated always as identity primary key,
  number text not null unique,
  public_token uuid not null unique default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_method text not null check (delivery_method in ('delivery','pickup')),
  delivery_zone_id bigint references public.als_delivery_zones(id) on delete set null,
  delivery_zone_name text,
  address text,
  notes text,
  subtotal numeric(12,2) not null,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  currency text not null default 'XOF',
  payment_method text not null,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','refunded')),
  payment_reference text,
  status text not null default 'new' check (status in ('new','confirmed','shipped','delivered','cancelled')),
  tracking_number text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index als_orders_status_idx on public.als_orders (status, created_at desc);
create index als_orders_created_idx on public.als_orders (created_at desc);
create index als_orders_phone_idx on public.als_orders (customer_phone, created_at desc);
create index als_orders_zone_idx on public.als_orders (delivery_zone_id);

create table public.als_order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.als_orders(id) on delete cascade,
  product_id bigint references public.als_products(id) on delete set null,
  variant_id bigint references public.als_product_variants(id) on delete set null,
  product_name text not null,
  variant_label text,
  sku text not null,
  unit_price numeric(12,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(12,2) not null
);
create index als_items_order_idx on public.als_order_items (order_id);
create index als_items_product_idx on public.als_order_items (product_id);
create index als_items_variant_idx on public.als_order_items (variant_id);

create table public.als_pages (
  id bigint generated always as identity primary key,
  title text not null,
  slug text not null unique,
  body text not null default '',
  meta_description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.als_reviews (
  id bigint generated always as identity primary key,
  author text not null,
  city text,
  rating smallint not null default 5 check (rating between 1 and 5),
  body text not null,
  product_id bigint references public.als_products(id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index als_reviews_product_idx on public.als_reviews (product_id);

-- updated_at automatique
create or replace function public.als_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['als_categories','als_brands','als_products','als_product_variants','als_delivery_zones','als_orders','als_pages','als_settings'] loop
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.als_touch_updated_at()', t);
  end loop;
end $$;

-- Prix mini et stock total recalculés à chaque changement de variante
create or replace function public.als_refresh_product(p_product_id bigint) returns void
language sql set search_path = '' as $$
  update public.als_products p set
    min_price = coalesce((select min(v.price) from public.als_product_variants v where v.product_id = p.id and v.is_active), 0),
    total_stock = coalesce((select sum(v.stock) from public.als_product_variants v where v.product_id = p.id and v.is_active), 0)
  where p.id = p_product_id;
$$;

create or replace function public.als_variants_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE','DELETE') then perform public.als_refresh_product(old.product_id); end if;
  if tg_op in ('INSERT','UPDATE') and (tg_op = 'INSERT' or new.product_id <> old.product_id) then perform public.als_refresh_product(new.product_id); end if;
  return null;
end $$;

create trigger variants_refresh_product after insert or update or delete on public.als_product_variants
for each row execute function public.als_variants_changed();

revoke all on function public.als_refresh_product(bigint) from public, anon, authenticated;
revoke all on function public.als_variants_changed() from public, anon, authenticated;
revoke all on function public.als_touch_updated_at() from public, anon, authenticated;
