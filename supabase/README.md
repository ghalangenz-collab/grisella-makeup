# Panduan Database Supabase - GRISELLA MAKEUP

Aplikasi ini menggunakan PostgreSQL di Supabase (Region: **Singapore / ap-southeast-1**).

---

## 🚀 Cara Menjalankan Migrasi & Seed Data

### Cara 1: Lewat Supabase Dashboard (Paling Mudah)
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat/buka project Anda.
2. Masuk ke menu **SQL Editor** di sidebar kiri.
3. Klik **New Query**.
4. Salin seluruh isi file:
   - [`supabase/migrations/20261030000000_grisella_init.sql`](./migrations/20261030000000_grisella_init.sql)
5. Klik **Run** (Ctrl + Enter) sampai pesan *Success*.
6. Buka query baru, salin isi file:
   - [`supabase/seed.sql`](./seed.sql)
7. Klik **Run** untuk mengisi data awal layanan, jam kerja, pengaturan, dan template pesan.

---

## 👤 Pembuatan Akun Admin (MUA)
Agar MUA bisa login ke dashboard admin (`/admin`):
1. Masuk ke menu **Authentication** -> **Users** di Supabase Dashboard.
2. Klik tombol **Add User** -> **Create User**.
3. Masukkan:
   - **Email**: email MUA (misal: `admin@grisellamakeup.com`)
   - **Password**: password yang kuat
   - Centang **Auto Confirm User?** agar langsung aktif tanpa klik verifikasi email.
4. Klik **Create User**.
5. Gunakan email & password tersebut untuk login di halaman `/admin/login`.

---

## 🔑 Kredensial Environment (.env)
Buka menu **Project Settings** -> **API** di Supabase Dashboard, salin kunci berikut ke file `.env.local` di root project:

```env
# URL Project Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co

# Kunci Anon (Aman untuk Browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh......

# Kunci Service Role (RAHASIA - Hanya untuk Server / Edge Function)
SUPABASE_SERVICE_ROLE_KEY=eyJh......
```
