-- ============================================================
-- Solar Arena — Supabase Kurulum Şeması
-- Supabase panelinde: SQL Editor > New query > buraya yapıştır > Run
-- (Bir kez çalıştırmanız yeterli.)
-- ============================================================

-- ---------- TABLOLAR ----------
create table if not exists public.categories (
  id text primary key, name text not null, sort int default 0
);

create table if not exists public.products (
  id text primary key, cat text, img text, photo text default '',
  name text not null, specs jsonb default '[]'::jsonb,
  price int default 0, stock int default 0, hit boolean default false, sort int default 0
);

create table if not exists public.slides (
  id text primary key, image text default '', art text,
  title text, subtitle text default '', "btnText" text default '',
  "btnLink" text default 'urunler.html', sort int default 0
);

create table if not exists public.kv (
  k text primary key, v jsonb
);

create table if not exists public.orders (
  id text primary key, customer text, phone text, email text,
  city text, address text, payment text, status text,
  items jsonb default '[]'::jsonb, total int, created bigint
);

create table if not exists public.leads (
  id text primary key, name text, phone text, city text,
  type text, message text, created bigint
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, name text default '', phone text default '', role text default 'user',
  blocked boolean default false, created bigint
);
-- Var olan tabloya (daha önce kurulduysa) eksik kolonları ekle
alter table public.profiles add column if not exists blocked boolean default false;
alter table public.profiles add column if not exists created bigint;

-- ---------- YENİ KULLANICI -> PROFİL ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, phone, role)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'name',''),
          coalesce(new.raw_user_meta_data->>'phone',''), 'user')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- YÖNETİCİ KONTROLÜ ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- YETKİLER (rol bazlı) ----------
grant usage on schema public to anon, authenticated;
grant select on public.products, public.categories, public.slides, public.kv to anon, authenticated;
grant insert on public.orders, public.leads to anon, authenticated;
grant all on public.products, public.categories, public.slides, public.kv, public.orders, public.leads to authenticated;
grant select, update, delete on public.profiles to authenticated;

-- ---------- RLS (satır güvenliği) ----------
alter table public.products   enable row level security;
alter table public.categories enable row level security;
alter table public.slides     enable row level security;
alter table public.kv         enable row level security;
alter table public.orders     enable row level security;
alter table public.leads      enable row level security;
alter table public.profiles   enable row level security;

-- Herkes okur; sadece admin yazar (products, categories, slides, kv)
do $$
declare t text;
begin
  foreach t in array array['products','categories','slides','kv'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select using (true)', t, t);
    execute format('drop policy if exists %I_ins on public.%I', t, t);
    execute format('create policy %I_ins on public.%I for insert with check (public.is_admin())', t, t);
    execute format('drop policy if exists %I_upd on public.%I', t, t);
    execute format('create policy %I_upd on public.%I for update using (public.is_admin()) with check (public.is_admin())', t, t);
    execute format('drop policy if exists %I_del on public.%I', t, t);
    execute format('create policy %I_del on public.%I for delete using (public.is_admin())', t, t);
  end loop;
end $$;

-- Siparişler: herkes ekler; kendi siparişini veya admin görür; admin siler
drop policy if exists orders_ins on public.orders;
create policy orders_ins on public.orders for insert with check (true);
drop policy if exists orders_sel on public.orders;
create policy orders_sel on public.orders for select using (public.is_admin() or email = (auth.jwt()->>'email'));
drop policy if exists orders_del on public.orders;
create policy orders_del on public.orders for delete using (public.is_admin());

-- İletişim talepleri: herkes ekler; sadece admin görür/siler
drop policy if exists leads_ins on public.leads;
create policy leads_ins on public.leads for insert with check (true);
drop policy if exists leads_sel on public.leads;
create policy leads_sel on public.leads for select using (public.is_admin());
drop policy if exists leads_del on public.leads;
create policy leads_del on public.leads for delete using (public.is_admin());

-- Profiller: kişi kendini görür/günceller; admin hepsini görür
drop policy if exists profiles_sel on public.profiles;
create policy profiles_sel on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_upd on public.profiles;
create policy profiles_upd on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
drop policy if exists profiles_del on public.profiles;
create policy profiles_del on public.profiles for delete using (public.is_admin());

-- ============ TOHUM VERİLERİ (varsayılan ürün/kategori/slayt/içerik) ============
insert into public.categories (id,name,sort) values
  ('panel','Güneş Panelleri',0),
  ('inverter','İnvertörler',1),
  ('aku','Aküler',2),
  ('paket','Hazır Paketler',3),
  ('aksesuar','Aksesuarlar',4)
on conflict (id) do nothing;

insert into public.products (id,cat,img,photo,name,specs,price,stock,hit,sort) values
  ('pnl-460','panel','panel','','460W Half-Cut Monokristal Güneş Paneli','["120 hücre · %21,3 verim", "Çerçeve: eloksallı alüminyum, IP68 bağlantı kutusu", "25 yıl performans garantisi"]'::jsonb,4850,25,true,0),
  ('pnl-550','panel','panel','','550W Monokristal Güneş Paneli','["144 hücre · %21,7 verim", "Çift cam (bifacial) teknoloji", "30 yıl performans garantisi"]'::jsonb,5950,18,true,1),
  ('pnl-flx','panel','flex','','285W Esnek Güneş Paneli','["Karavan, tekne ve tiny house için", "Yarı esnek ETFE yüzey", "Sadece 4,8 kg"]'::jsonb,6750,4,false,2),
  ('inv-5g','inverter','inverter','','5 kW On-Grid İnvertör (Monofaze)','["2 MPPT girişi", "Wi-Fi izleme modülü dahil", "5 yıl garanti"]'::jsonb,38500,9,false,3),
  ('inv-6h','inverter','inverter','','6 kW Hibrit İnvertör 48V','["120A MPPT şarj kontrollü", "Şebeke + akü + jeneratör girişi", "Paralellenebilir (9 adede kadar)"]'::jsonb,52900,7,true,4),
  ('inv-3s','inverter','inverter','','3 kW Tam Sinüs İnvertör 24V','["Off-grid kullanım için", "LCD ekran, USB çıkış", "Düşük bekleme tüketimi"]'::jsonb,14750,14,false,5),
  ('aku-lfp','aku','battery','','48V 100Ah LiFePO4 Lityum Akü','["5,12 kWh kapasite", "6.000+ çevrim ömrü", "Dahili BMS, Bluetooth takip"]'::jsonb,58900,6,true,6),
  ('aku-jel','aku','battery','','12V 150Ah Derin Döngü Jel Akü','["Bakım gerektirmez", "Solar sistemler için optimize", "2 yıl garanti"]'::jsonb,9850,22,false,7),
  ('kit-krv','paket','kit','','Karavan Solar Paketi 410W','["410W panel + 30A MPPT regülatör", "Kablolama ve montaj aparatları dahil", "Kurulum şeması ile birlikte"]'::jsonb,32500,3,true,8),
  ('kit-bag','paket','kit','','Bağ Evi Off-Grid Paketi 3 kW','["4 × 460W panel + 3 kW invertör", "12V 150Ah × 2 jel akü", "Telefonla kurulum desteği"]'::jsonb,94500,5,false,9),
  ('aks-mppt','aksesuar','controller','','30A MPPT Şarj Kontrol Cihazı 12/24V','["LCD ekran, otomatik voltaj seçimi", "Aşırı şarj ve kısa devre koruması", "2 yıl garanti"]'::jsonb,4250,16,false,10),
  ('aks-lamba','aksesuar','streetlight','','Solar Sokak / Bahçe Lambası 100W','["Dahili panel ve lityum batarya", "Alacakaranlık sensörü, kumandalı", "IP65 dış mekan koruması"]'::jsonb,3980,12,true,11),
  ('aks-montaj','aksesuar','mount','','Çatı Montaj Konstrüksiyon Seti (10 Panel)','["Eloksallı alüminyum ray ve kelepçeler", "Kiremit ve sac çatıya uygun", "Paslanmaz bağlantı elemanları"]'::jsonb,7500,9,false,12),
  ('aks-kablo','aksesuar','cable','','6mm² Solar Kablo 50m + MC4 Konnektör Seti','["UV dayanımlı çift izolasyon", "2 çift MC4 konnektör dahil", "TSE belgeli"]'::jsonb,2450,30,false,13)
on conflict (id) do nothing;

insert into public.slides (id,image,art,title,subtitle,"btnText","btnLink",sort) values
  ('sl1','','roof','Güneş Enerjisinde Türkiye''nin Her Yerine Gönderim','Panel, invertör, akü ve hazır paketler stoktan — siparişiniz aynı gün kargoda.','Ürünleri İncele','urunler.html',0),
  ('sl2','','field','Yüksek Verimli Monokristal Paneller','%21+ verim, 25 yıla varan garanti. Ev, işyeri ve tarım için uygun çözümler.','Panelleri Gör','urunler.html',1),
  ('sl3','','carport','Karavan ve Bağ Evi Solar Paketleri','Şebekeden bağımsız, kur-kullan hazır sistemler. Montaj kılavuzu ve destek dahil.','Paketleri Gör','urunler.html',2)
on conflict (id) do nothing;

insert into public.kv (k,v) values
  ('site','{"phone": "0850 000 00 00", "email": "info@solararena.store", "address": "Örnek Mah. Enerji Cad. No:1, Ankara", "hours": "Hafta içi 09:00 - 18:00, Cumartesi 10:00 - 15:00", "topNote": "Türkiye''nin her yerine hızlı gönderim", "footerAbout": "Temiz enerjiyle daha aydınlık bir gelecek için 12 yıldır çalışıyoruz.", "footerCopyright": "© 2026 Solar Arena Enerji"}'::jsonb),
  ('settings','{"whatsapp": "908500000000"}'::jsonb)
on conflict (k) do nothing;

-- ============================================================
-- YÖNETİCİ HESABI OLUŞTURMA (kurulumdan sonra)
-- 1) Sitede /giris.html üzerinden kendinize bir hesap açın
--    (veya Supabase > Authentication > Add user).
-- 2) Aşağıdaki komutu KENDİ e-postanızla çalıştırıp o hesabı
--    yönetici yapın:
--
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'sizin@epostaniz.com');
-- ============================================================
