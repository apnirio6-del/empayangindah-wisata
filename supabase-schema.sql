-- EMPAYANGINDAH.WISATA v8
-- Run this entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('Open Trip','Shuttle')),
  name text not null,
  origin text not null,
  destination text not null,
  date text not null,
  departure text not null,
  price numeric not null default 0,
  seats integer not null default 1,
  image text,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists public.company_settings (
  id integer primary key default 1 check (id=1),
  address text not null default '',
  phone text not null default '',
  tiktok text not null default '',
  instagram text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  phone text not null,
  type text not null,
  trip_id uuid references public.trips(id) on delete set null,
  origin text not null,
  destination text not null,
  departure text,
  date date not null,
  qty integer not null check(qty > 0),
  pickup text,
  note text,
  price numeric not null,
  total numeric not null,
  status text not null default 'Menunggu',
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.trips enable row level security;
alter table public.company_settings enable row level security;
alter table public.bookings enable row level security;


create or replace function public.claim_first_admin(p_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists(select 1 from public.admin_users) then return false; end if;
  insert into public.admin_users(user_id,name) values(auth.uid(),coalesce(nullif(trim(p_name),''),'Admin'));
  return true;
end;
$$;
grant execute on function public.claim_first_admin(text) to authenticated;

-- Public visitors can read trips/settings.
create policy "public read trips" on public.trips for select using (true);
create policy "public read company" on public.company_settings for select using (true);
-- Customers can create bookings but cannot read all bookings.
create policy "public create bookings" on public.bookings for insert with check (true);

-- Logged-in admins can manage everything.
create policy "admin read admin_users" on public.admin_users for select using (auth.uid() = user_id);
create policy "admin read trips" on public.trips for select using (auth.uid() in (select user_id from public.admin_users));
create policy "admin insert trips" on public.trips for insert with check (auth.uid() in (select user_id from public.admin_users));
create policy "admin update trips" on public.trips for update using (auth.uid() in (select user_id from public.admin_users));
create policy "admin delete trips" on public.trips for delete using (auth.uid() in (select user_id from public.admin_users));
create policy "admin update company" on public.company_settings for update using (auth.uid() in (select user_id from public.admin_users));
create policy "admin insert company" on public.company_settings for insert with check (auth.uid() in (select user_id from public.admin_users));
create policy "admin read bookings" on public.bookings for select using (auth.uid() in (select user_id from public.admin_users));
create policy "admin update bookings" on public.bookings for update using (auth.uid() in (select user_id from public.admin_users));

insert into public.company_settings(id,address,phone,tiktok,instagram)
values(1,'Lokasi perusahaan belum diatur.','08xxxxxxxxxx','https://www.tiktok.com/','https://www.instagram.com/')
on conflict(id) do nothing;

-- Optional starter trips. They are only inserted when the table is empty.
insert into public.trips(type,name,origin,destination,date,departure,price,seats,image,location)
select * from (values
('Open Trip','Bandung City Trip','Jakarta','Bandung','Setiap Sabtu','06:00',250000,12,'assets/images/bandung.svg','Bandung, Jawa Barat'),
('Open Trip','Pangandaran Escape','Jakarta','Pangandaran','Setiap Minggu','05:30',375000,9,'assets/images/pangandaran.svg','Pangandaran, Jawa Barat'),
('Open Trip','Jogja Weekend','Jakarta','Yogyakarta','Jadwal tertentu','19:00',450000,14,'assets/images/yogyakarta.svg','Yogyakarta'),
('Shuttle','Jakarta - Bandung','Jakarta','Bandung','Setiap hari','06:00',150000,6,'assets/images/bandung.svg','Bandung, Jawa Barat'),
('Shuttle','Bandung - Jakarta','Bandung','Jakarta','Setiap hari','07:00',150000,8,'assets/images/bandung.svg','Jakarta / Bandung'),
('Shuttle','Jakarta - Cirebon','Jakarta','Cirebon','Setiap hari','08:00',200000,10,'assets/images/pangandaran.svg','Cirebon, Jawa Barat')
) as x(type,name,origin,destination,date,departure,price,seats,image,location)
where not exists (select 1 from public.trips);
