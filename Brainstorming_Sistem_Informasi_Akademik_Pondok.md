# Brainstorming Aplikasi Sistem Informasi Akademik Pondok Pesantren (SIAP Pondok)

## Gambaran Umum

Sistem Informasi Akademik Pondok merupakan aplikasi berbasis **Web**
yang mengintegrasikan proses **PPDB, akademik, administrasi, pembayaran,
absensi, perizinan hingga portal alumni** dalam satu sistem.

------------------------------------------------------------------------

# Tech Stack

## Frontend

-   Vite + React JS
-   Tailwind CSS
-   React Router DOM
-   Axios
-   React Hook Form
-   React Select (Async Search + Debounce 1 Detik)
-   TanStack Query
-   React Toastify
-   SweetAlert2
-   ApexCharts / Recharts
-   DayJS
-   React PDF Viewer
-   Lucide React

## Backend

-   Lumen (REST API)
-   JWT Authentication
-   Eloquent ORM
-   Validation
-   Laravel Excel
-   DomPDF
-   Simple QR Code

## Database

-   MariaDB / MySQL

------------------------------------------------------------------------

# Role

-   Super Admin
-   Admin
-   Wali Santri

------------------------------------------------------------------------

# Modul

## 1. PPDB Online

### Wali Santri

-   Form pendaftaran santri
-   Upload berkas (KK, Akta, KTP Orang Tua, Pas Foto, Ijazah, dll)
-   Melihat status pendaftaran

### Admin

-   Verifikasi pendaftaran
-   Setuju / Tolak
-   Alasan penolakan
-   Santri otomatis masuk data aktif setelah disetujui

------------------------------------------------------------------------

## 2. Dashboard Admin

Menampilkan: - Jumlah pendaftar - Jumlah santri putra - Jumlah santri
putri - Total uang masuk bulan ini - Total uang keluar bulan ini -
Jumlah santri belum bayar - Grafik PPDB - Grafik pembayaran - Grafik
santri - Grafik pelanggaran

------------------------------------------------------------------------

## 3. Biodata Santri

### Admin

-   Kelola santri aktif
-   Edit data
-   Cetak Buku Induk PDF
-   Export Excel/PDF

### Wali

-   Melihat biodata
-   Mengajukan perubahan biodata

------------------------------------------------------------------------

## 4. Raport

### Admin

-   Master mata pelajaran
-   Import mapel dari Excel
-   Input nilai
-   Input prestasi
-   Cetak raport PDF

### Wali

-   Melihat raport
-   Download PDF

------------------------------------------------------------------------

## 5. Pembayaran (Konfirmasi Manual)

### Admin

-   Master jenis tagihan
-   Generate tagihan rutin
-   Verifikasi bukti transfer
-   Approve / Reject pembayaran
-   Cetak kuitansi
-   Rekap pembayaran

### Wali

-   Melihat tagihan
-   Upload bukti transfer
-   Melihat status:
    -   Belum Bayar
    -   Menunggu Verifikasi
    -   Lunas
    -   Ditolak
-   Download kuitansi setelah disetujui

Flow: Tagihan → Transfer → Upload Bukti → Verifikasi Admin → Lunas

------------------------------------------------------------------------

## 6. Riwayat Kelas

### Admin

-   Kenaikan kelas
-   Tinggal kelas
-   Mutasi

### Wali

-   Melihat riwayat kelas

------------------------------------------------------------------------

## 7. Absensi

### Admin

-   Input hadir, sakit, izin, alpha

### Wali

-   Kalender kehadiran
-   Rekap absensi

------------------------------------------------------------------------

## 8. Pelanggaran & Point

### Admin

-   Master pelanggaran
-   Input pelanggaran
-   Point
-   Sanksi

### Wali

-   Melihat pelanggaran
-   Total point
-   Riwayat sanksi

------------------------------------------------------------------------

## 9. Perizinan

### Wali

-   Pengajuan izin keluar/pulang

### Admin

-   Approve / Reject
-   QR Code keluar & kembali
-   Riwayat perizinan

------------------------------------------------------------------------

## 10. Portal Alumni

### Admin

-   Meluluskan santri
-   Data alumni
-   Monitoring alumni
-   Donasi/Wakaf

### Alumni

-   Update status
-   Donasi

------------------------------------------------------------------------

## 11. Manajemen User

Super Admin dapat mengelola: - Admin - Operator - Hak akses (Role &
Permission)

------------------------------------------------------------------------

## Pengaturan

-   Tahun ajaran
-   Semester aktif
-   Kelas
-   Mata pelajaran
-   Jenis pembayaran
-   Logo pondok
-   Identitas pondok
-   Template raport
-   Template kuitansi
-   Backup database

------------------------------------------------------------------------

# Fitur Tambahan

-   Pengumuman
-   Broadcast WhatsApp (opsional)
-   Audit Log
-   Backup database
-   Import/Export Excel
-   Multi Tahun Ajaran
-   Responsive & PWA
