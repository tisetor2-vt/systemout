create extension if not exists "pgcrypto";

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('admin', 'operator')) default 'operator',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  stock integer not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  image_urls text[] not null default '{}',
  material text,
  sizes text[] default '{}',
  colors text[] default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  visible_in_catalog boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color text,
  size text,
  stock integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_phone text,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_method text not null default 'dinheiro',
  status text not null default 'paid',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null,
  line_total numeric(10,2) not null
);

create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('entrada', 'saida')),
  category text not null,
  description text,
  amount numeric(10,2) not null,
  reference_type text,
  reference_id text,
  occurred_on date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid not null references auth.users(id) on delete cascade,
  opening_amount numeric(10,2) not null default 0,
  closing_amount numeric(10,2),
  notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'Minha Loja',
  logo_url text,
  whatsapp text,
  instagram text,
  facebook text,
  custom_domain text,
  theme text default 'light',
  header_top_text text,
  header_bottom_text text,
  footer_text text,
  delivery_deadline text,
  exchange_policy text,
  contact_text text,
  about_text text,
  links_json jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.store_banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  link_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variations enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.financial_entries enable row level security;
alter table public.store_settings enable row level security;
alter table public.store_banners enable row level security;
alter table public.cash_sessions enable row level security;

drop policy if exists "catalog_read_products" on public.products;
drop policy if exists "catalog_read_categories" on public.categories;
drop policy if exists "catalog_read_variations" on public.product_variations;
drop policy if exists "catalog_read_banners" on public.store_banners;
drop policy if exists "catalog_read_store_settings" on public.store_settings;
drop policy if exists "admin_all_products" on public.products;
drop policy if exists "admin_all_categories" on public.categories;
drop policy if exists "admin_all_variations" on public.product_variations;
drop policy if exists "admin_all_sales" on public.sales;
drop policy if exists "admin_all_sale_items" on public.sale_items;
drop policy if exists "admin_all_financial_entries" on public.financial_entries;
drop policy if exists "admin_all_store_banners" on public.store_banners;
drop policy if exists "admin_read_settings" on public.store_settings;
drop policy if exists "admin_update_settings" on public.store_settings;
drop policy if exists "operator_pdv_sales" on public.sales;
drop policy if exists "operator_pdv_sale_items" on public.sale_items;
drop policy if exists "operator_pdv_finance" on public.financial_entries;
drop policy if exists "operator_cash_sessions" on public.cash_sessions;
drop policy if exists "admin_cash_sessions" on public.cash_sessions;
drop policy if exists "operator_select_products" on public.products;
drop policy if exists "profile_select_own" on public.user_profiles;
drop policy if exists "profile_update_own" on public.user_profiles;
drop policy if exists "profile_insert_own" on public.user_profiles;
drop policy if exists "profile_admin_read_all" on public.user_profiles;
drop function if exists public.create_operator_user(text, text, text, text);

create policy "profile_select_own" on public.user_profiles
for select using (auth.uid() = id);

create policy "profile_update_own" on public.user_profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profile_insert_own" on public.user_profiles
for insert with check (auth.uid() = id);

create policy "profile_admin_read_all" on public.user_profiles
for select using (
  exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.role = 'admin'
  )
);

create policy "catalog_read_products" on public.products
for select using (active = true and visible_in_catalog = true);

create policy "catalog_read_categories" on public.categories
for select using (true);

create policy "catalog_read_variations" on public.product_variations
for select using (true);

create policy "catalog_read_banners" on public.store_banners
for select using (active = true);

create policy "catalog_read_store_settings" on public.store_settings
for select using (true);

create policy "admin_all_products" on public.products
for all using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

create policy "operator_select_products" on public.products
for select using (
  active = true
  and exists (
    select 1
    from public.user_profiles up
    where up.id = auth.uid() and up.role in ('admin', 'operator')
  )
);

create policy "admin_all_categories" on public.categories
for all using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

create policy "admin_all_variations" on public.product_variations
for all using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

create policy "admin_all_sales" on public.sales
for all using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

create policy "admin_all_sale_items" on public.sale_items
for all using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

create policy "admin_all_financial_entries" on public.financial_entries
for all using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

create policy "admin_all_store_banners" on public.store_banners
for all using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

create policy "admin_read_settings" on public.store_settings
for select using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

create policy "admin_update_settings" on public.store_settings
for all using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

create policy "operator_pdv_sales" on public.sales
for insert with check (
  exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin', 'operator'))
);

create policy "operator_pdv_sale_items" on public.sale_items
for insert with check (
  exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin', 'operator'))
);

create policy "operator_pdv_finance" on public.financial_entries
for insert with check (
  exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin', 'operator'))
);

create policy "operator_cash_sessions" on public.cash_sessions
for all using (
  auth.uid() = opened_by
  and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin', 'operator'))
)
with check (
  auth.uid() = opened_by
  and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin', 'operator'))
);

create policy "admin_cash_sessions" on public.cash_sessions
for all using (
  exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin')
)
with check (
  exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create index if not exists idx_products_active_visible_created on public.products(active, visible_in_catalog, created_at desc);
create index if not exists idx_products_active_name on public.products(active, name);
create index if not exists idx_sales_created_at on public.sales(created_at desc);
create index if not exists idx_financial_entries_occurred_on on public.financial_entries(occurred_on desc);
create index if not exists idx_cash_sessions_opened_by_opened_at on public.cash_sessions(opened_by, opened_at desc);

create or replace function public.finalize_sale_transaction(
  p_customer_name text,
  p_customer_phone text,
  p_subtotal numeric,
  p_discount numeric,
  p_total numeric,
  p_payment_method text,
  p_items jsonb,
  p_occurred_on date,
  p_cash_session_id uuid default null
)
returns table (sale_id uuid, created_at timestamptz)
language plpgsql
security invoker
as $$
declare
  v_sale_id uuid;
  v_created_at timestamptz;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_price numeric(10,2);
  v_name text;
  v_current_stock integer;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if not exists (
    select 1
    from public.user_profiles up
    where up.id = auth.uid() and up.role in ('admin', 'operator')
  ) then
    raise exception 'Sem permissão para concluir vendas';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Itens da venda inválidos';
  end if;

  if p_payment_method = 'dinheiro' and p_cash_session_id is null then
    raise exception 'Abra o caixa antes de vender em dinheiro';
  end if;

  if p_cash_session_id is not null and not exists (
    select 1
    from public.cash_sessions cs
    where cs.id = p_cash_session_id and cs.opened_by = auth.uid() and cs.closed_at is null
  ) then
    raise exception 'Sessão de caixa inválida';
  end if;

  insert into public.sales (
    customer_name,
    customer_phone,
    subtotal,
    discount,
    total,
    payment_method,
    status,
    created_by
  )
  values (
    nullif(p_customer_name, ''),
    nullif(p_customer_phone, ''),
    p_subtotal,
    p_discount,
    p_total,
    p_payment_method,
    'paid',
    auth.uid()
  )
  returning id, sales.created_at into v_sale_id, v_created_at;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := greatest((v_item->>'quantity')::integer, 1);
    v_price := (v_item->>'unit_price')::numeric(10,2);
    v_name := coalesce(v_item->>'product_name', 'Produto');

    select stock into v_current_stock
    from public.products
    where id = v_product_id
    for update;

    if v_current_stock is null then
      raise exception 'Produto não encontrado: %', v_product_id;
    end if;
    if v_current_stock < v_qty then
      raise exception 'Estoque insuficiente para %', v_name;
    end if;

    update public.products
    set stock = v_current_stock - v_qty,
        updated_at = now()
    where id = v_product_id;

    insert into public.sale_items (
      sale_id,
      product_id,
      product_name,
      unit_price,
      quantity,
      line_total
    )
    values (
      v_sale_id,
      v_product_id,
      v_name,
      v_price,
      v_qty,
      v_price * v_qty
    );
  end loop;

  insert into public.financial_entries (
    type,
    category,
    description,
    amount,
    reference_type,
    reference_id,
    occurred_on
  )
  values (
    'entrada',
    'venda',
    format('Venda %s', v_sale_id),
    p_total,
    'sale',
    v_sale_id::text,
    coalesce(p_occurred_on, current_date)
  );

  return query
  select v_sale_id, v_created_at;
end;
$$;

grant execute on function public.finalize_sale_transaction(text, text, numeric, numeric, numeric, text, jsonb, date, uuid) to authenticated;

create or replace function public.create_operator_user(
  p_email text,
  p_password text,
  p_full_name text default null,
  p_role text default 'operator'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_requester_role text;
  v_user_id uuid;
begin
  select role into v_requester_role
  from public.user_profiles
  where id = auth.uid();

  if v_requester_role is distinct from 'admin' then
    raise exception 'Somente administradores podem criar usuários';
  end if;

  if p_email is null or trim(p_email) = '' then
    raise exception 'E-mail inválido';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Senha deve ter ao menos 6 caracteres';
  end if;

  if p_role not in ('admin', 'operator') then
    raise exception 'Papel inválido';
  end if;

  select id into v_user_id
  from auth.users
  where email = lower(trim(p_email))
  limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      lower(trim(p_email)),
      crypt(p_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  end if;

  insert into public.user_profiles (id, full_name, role)
  values (v_user_id, nullif(trim(p_full_name), ''), p_role)
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role;

  return v_user_id;
end;
$$;

revoke all on function public.create_operator_user(text, text, text, text) from public;
grant execute on function public.create_operator_user(text, text, text, text) to authenticated;

insert into storage.buckets (id, name, public)
values ('catalog', 'catalog', true)
on conflict (id) do nothing;

drop policy if exists "public_read_catalog_storage" on storage.objects;
drop policy if exists "admin_insert_catalog_storage" on storage.objects;
drop policy if exists "admin_update_catalog_storage" on storage.objects;

create policy "public_read_catalog_storage" on storage.objects
for select using (bucket_id = 'catalog');

create policy "admin_insert_catalog_storage" on storage.objects
for insert with check (
  bucket_id = 'catalog'
  and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create policy "admin_update_catalog_storage" on storage.objects
for update using (
  bucket_id = 'catalog'
  and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin')
)
with check (
  bucket_id = 'catalog'
  and exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
