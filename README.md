# Empayangindah.wisata v8 — Online Database + WhatsApp

Versi ini mengubah v7 dari penyimpanan browser menjadi **Supabase online**.

## Fitur v8
- Akun admin online memakai Supabase Authentication.
- Admin pertama dibuat melalui halaman **Buat Akun Admin**.
- Login admin dapat dilakukan dari perangkat lain.
- Data perjalanan, jadwal, rute, harga, kursi, gambar, dan informasi perusahaan tersimpan di database online.
- Booking pelanggan masuk ke database online.
- Admin dapat melihat booking dan export CSV.
- Setelah pelanggan membuat booking, website otomatis membuka WhatsApp perusahaan dengan detail booking dan total pembayaran.
- Invoice juga memiliki tombol **Bayar / Konfirmasi via WhatsApp**.
- Tidak ada lagi password demo `admin123`.

## Setup satu kali
1. Buat project gratis di Supabase.
2. Buka **SQL Editor** dan jalankan seluruh isi file `supabase-schema.sql`.
3. Di Supabase buka **Project Settings → API**.
4. Salin **Project URL** dan **anon/publishable key**.
5. Buka `assets/config.js` lalu ganti:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. Upload seluruh folder v8 ke Netlify.
7. Buka `/admin.html`.
8. Buat akun admin pertama dengan email dan password Anda sendiri.
9. Jika Supabase meminta verifikasi email, verifikasi email tersebut lalu login kembali. Sistem otomatis mengklaim akun pertama sebagai admin.

## Penting tentang pembayaran
v8 **belum mendeteksi pembayaran bank/QRIS secara otomatis**, karena belum ada payment gateway yang diberikan. Yang dibuat sekarang adalah alur otomatis:
**Booking → data tersimpan online → WhatsApp terbuka otomatis → pelanggan meminta instruksi/kirim bukti pembayaran.**

Jika ingin benar-benar otomatis mendeteksi pembayaran (QRIS/transfer dan status LUNAS), diperlukan integrasi payment gateway seperti Midtrans/Xendit dan webhook. Itu bisa dibuat sebagai v9.


## V8 — Setup Supabase

The ZIP has been preconfigured with the supplied Supabase Project URL and Publishable Key.

### 1. Create database tables
In Supabase Dashboard:
- Open **SQL Editor**
- Create a new query
- Copy/paste the complete contents of `supabase-schema.sql`
- Press **Run**

### 2. Create the first online admin
Open `admin.html` after deploying. Use **Buat Akun Admin** with your own email and password.
If email confirmation is enabled in Supabase, verify the email first, then return to the admin page and log in.

### 3. WhatsApp booking flow
Customer booking is saved to `bookings`, then the site redirects to the company WhatsApp number stored in `company_settings`.
The WhatsApp message includes booking code, customer, route, date, departure time, quantity, total, and pickup point.

### Important
The browser key in `assets/config.js` is a Publishable key. Never replace it with a Supabase Secret/Service Role key.
