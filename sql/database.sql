-- SQL Schema for SIAKAD Pondok Pesantren Bahrul Ulum
-- Created: 2026-07-19
-- Database: siakad_bahrul_ulum

CREATE DATABASE IF NOT EXISTS `siakad_bahrul_ulum` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `siakad_bahrul_ulum`;

-- --------------------------------------------------------
-- 1. Table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('superadmin', 'admin', 'walisantri', 'alumni') NOT NULL DEFAULT 'walisantri',
  `status_aktif` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial users (Passwords are hashed 'admin123' -> $2y$10$eF1S1gS27vB3DqgqW2rZ.eeD9oF0BWhH7L6W2W9yMhF/UeM5xVqE6)
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `status_aktif`) VALUES
(1, 'superadmin', 'superadmin@bahrulum.sch.id', '$2y$10$eF1S1gS27vB3DqgqW2rZ.eeD9oF0BWhH7L6W2W9yMhF/UeM5xVqE6', 'superadmin', 1),
(2, 'admin', 'admin@bahrulum.sch.id', '$2y$10$eF1S1gS27vB3DqgqW2rZ.eeD9oF0BWhH7L6W2W9yMhF/UeM5xVqE6', 'admin', 1),
(3, 'wali_ahmad', 'wali.ahmad@gmail.com', '$2y$10$eF1S1gS27vB3DqgqW2rZ.eeD9oF0BWhH7L6W2W9yMhF/UeM5xVqE6', 'walisantri', 1),
(4, 'alumni_fatima', 'fatima@gmail.com', '$2y$10$eF1S1gS27vB3DqgqW2rZ.eeD9oF0BWhH7L6W2W9yMhF/UeM5xVqE6', 'alumni', 1);

-- --------------------------------------------------------
-- 2. Table `tahun_ajaran`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tahun_ajaran` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tahun` VARCHAR(20) NOT NULL, -- e.g. "2025/2026"
  `semester` ENUM('ganjil', 'genap') NOT NULL DEFAULT 'ganjil',
  `status_aktif` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tahun_ajaran` (`id`, `tahun`, `semester`, `status_aktif`) VALUES
(1, '2025/2026', 'ganjil', 1),
(2, '2025/2026', 'genap', 0);

-- --------------------------------------------------------
-- 3. Table `kelas`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kelas` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nama_kelas` VARCHAR(50) NOT NULL,
  `wali_kelas` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `kelas` (`id`, `nama_kelas`, `wali_kelas`) VALUES
(1, 'Kelas VII A (Putra)', 'Ustadz Nur Hidayat'),
(2, 'Kelas VII B (Putri)', 'Ustadzah Siti Aminah'),
(3, 'Kelas VIII A (Putra)', 'Ustadz Ahmad Fauzi'),
(4, 'Kelas VIII B (Putri)', 'Ustadzah Khadijah');

-- --------------------------------------------------------
-- 4. Table `mata_pelajaran`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mata_pelajaran` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nama_mapel` VARCHAR(100) NOT NULL,
  `kode_mapel` VARCHAR(20) NOT NULL UNIQUE,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `mata_pelajaran` (`id`, `nama_mapel`, `kode_mapel`) VALUES
(1, 'Kitab Fathul Qorib', 'MAPEL-001'),
(2, 'Kitab Alfiyah Ibn Malik', 'MAPEL-002'),
(3, 'Bahasa Arab', 'MAPEL-003'),
(4, 'Tahfidzul Qur\'an', 'MAPEL-004'),
(5, 'Fiqih Ibadah', 'MAPEL-005'),
(6, 'Sejarah Kebudayaan Islam', 'MAPEL-006');

-- --------------------------------------------------------
-- 5. Table `santri`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `santri` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `nama_lengkap` VARCHAR(150) NOT NULL,
  `nis` VARCHAR(30) DEFAULT NULL UNIQUE,
  `nisn` VARCHAR(30) DEFAULT NULL UNIQUE,
  `jk` ENUM('L', 'P') NOT NULL,
  `tempat_lahir` VARCHAR(100) NOT NULL,
  `tanggal_lahir` DATE NOT NULL,
  `alamat` TEXT NOT NULL,
  `nama_ayah` VARCHAR(100) NOT NULL,
  `nama_ibu` VARCHAR(100) NOT NULL,
  `hp_ortu` VARCHAR(20) NOT NULL,
  `status_ppdb` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `alasan_penolakan` TEXT DEFAULT NULL,
  `tanggal_daftar` DATE NOT NULL,
  `foto` VARCHAR(255) DEFAULT NULL,
  `kk_file` VARCHAR(255) DEFAULT NULL,
  `akta_file` VARCHAR(255) DEFAULT NULL,
  `ijazah_file` VARCHAR(255) DEFAULT NULL,
  `tahun_ajaran_id` INT UNSIGNED NOT NULL,
  `kelas_id` INT UNSIGNED DEFAULT NULL,
  `status_aktif` ENUM('aktif', 'alumni', 'mutasi', 'keluar') NOT NULL DEFAULT 'aktif',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`),
  FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `santri` (`id`, `user_id`, `nama_lengkap`, `nis`, `nisn`, `jk`, `tempat_lahir`, `tanggal_lahir`, `alamat`, `nama_ayah`, `nama_ibu`, `hp_ortu`, `status_ppdb`, `tanggal_daftar`, `tahun_ajaran_id`, `kelas_id`, `status_aktif`) VALUES
(1, 3, 'Ahmad Riza', '20250001', '0123456789', 'L', 'Jombang', '2012-05-15', 'Jl. KH. Wahab Hasbullah No. 10, Tambakberas, Jombang', 'H. Solihin', 'Hj. Fatimah', '081234567890', 'approved', '2025-06-01', 1, 1, 'aktif'),
(2, NULL, 'Zahra Aulia', '20250002', '0123456788', 'P', 'Surabaya', '2012-09-20', 'Jl. Ahmad Yani No. 45, Surabaya', 'Budi Santoso', 'Siti Rahma', '085765432100', 'approved', '2025-06-02', 1, 2, 'aktif'),
(3, 4, 'Fatimah Az-Zahra', '20220015', '0098765432', 'P', 'Kediri', '2008-01-10', 'Jl. Pemuda No. 12, Kediri', 'Hasan Basri', 'Khairunnisa', '089887766554', 'approved', '2022-06-10', 1, 4, 'alumni'),
(4, NULL, 'Muhammad Rizky', NULL, NULL, 'L', 'Malang', '2013-02-18', 'Jl. Ijen No. 15, Malang', 'Rudi Hermawan', 'Dewi Lestari', '082122334455', 'pending', '2026-07-15', 1, NULL, 'aktif');

-- --------------------------------------------------------
-- 6. Table `nilai_raport`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `nilai_raport` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `santri_id` BIGINT UNSIGNED NOT NULL,
  `mapel_id` INT UNSIGNED NOT NULL,
  `tahun_ajaran_id` INT UNSIGNED NOT NULL,
  `nilai_angka` DECIMAL(5,2) NOT NULL,
  `nilai_huruf` VARCHAR(10) NOT NULL,
  `catatan` TEXT DEFAULT NULL,
  `kkm` DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`santri_id`) REFERENCES `santri` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `nilai_raport` (`id`, `santri_id`, `mapel_id`, `tahun_ajaran_id`, `nilai_angka`, `nilai_huruf`, `catatan`, `kkm`) VALUES
(1, 1, 1, 1, 85.00, 'A', 'Sangat baik dalam pemahaman bab fiqih munakahat.', 70.00),
(2, 1, 3, 1, 78.00, 'B', 'Kemampuan berbicara (kalam) cukup bagus, perlu ditingkatkan tata bahasanya.', 70.00),
(3, 2, 4, 1, 92.00, 'A', 'Hafalan tajwid lancar dan tartil.', 70.00);

-- --------------------------------------------------------
-- 7. Table `prestasi`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `prestasi` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `santri_id` BIGINT UNSIGNED NOT NULL,
  `tahun_ajaran_id` INT UNSIGNED NOT NULL,
  `nama_prestasi` VARCHAR(150) NOT NULL,
  `kategori` VARCHAR(50) NOT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`santri_id`) REFERENCES `santri` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `prestasi` (`id`, `santri_id`, `tahun_ajaran_id`, `nama_prestasi`, `kategori`, `keterangan`) VALUES
(1, 1, 1, 'Juara 1 Musabaqah Qira\'atil Kutub (MQK) Kabupaten', 'Keagamaan', 'Membaca Kitab Fathul Qorib tingkat Ula.');

-- --------------------------------------------------------
-- 8. Table `jenis_tagihan`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `jenis_tagihan` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nama_tagihan` VARCHAR(100) NOT NULL,
  `nominal` DECIMAL(15,2) NOT NULL,
  `tipe` ENUM('rutin', 'sekali_bayar') NOT NULL DEFAULT 'rutin',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `jenis_tagihan` (`id`, `nama_tagihan`, `nominal`, `tipe`) VALUES
(1, 'SPP Syahriyah Bulanan', 350000.00, 'rutin'),
(2, 'Uang Gedung / Pembangunan', 1500000.00, 'sekali_bayar'),
(3, 'Biaya Pendaftaran PPDB', 150000.00, 'sekali_bayar');

-- --------------------------------------------------------
-- 9. Table `tagihan`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tagihan` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `santri_id` BIGINT UNSIGNED NOT NULL,
  `jenis_tagihan_id` INT UNSIGNED NOT NULL,
  `tahun_ajaran_id` INT UNSIGNED NOT NULL,
  `status` ENUM('belum_bayar', 'menunggu_verifikasi', 'lunas', 'ditolak') NOT NULL DEFAULT 'belum_bayar',
  `tanggal_tagihan` DATE NOT NULL,
  `tanggal_jatuh_tempo` DATE NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`santri_id`) REFERENCES `santri` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`jenis_tagihan_id`) REFERENCES `jenis_tagihan` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tagihan` (`id`, `santri_id`, `jenis_tagihan_id`, `tahun_ajaran_id`, `status`, `tanggal_tagihan`, `tanggal_jatuh_tempo`) VALUES
(1, 1, 1, 1, 'lunas', '2026-07-01', '2026-07-10'),
(2, 1, 1, 1, 'menunggu_verifikasi', '2026-08-01', '2026-08-10'),
(3, 2, 1, 1, 'belum_bayar', '2026-07-01', '2026-07-10');

-- --------------------------------------------------------
-- 10. Table `pembayaran`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pembayaran` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tagihan_id` BIGINT UNSIGNED NOT NULL,
  `nominal_bayar` DECIMAL(15,2) NOT NULL,
  `tanggal_bayar` DATE NOT NULL,
  `bukti_transfer` VARCHAR(255) NOT NULL,
  `status_verifikasi` ENUM('menunggu', 'disetujui', 'ditolak') NOT NULL DEFAULT 'menunggu',
  `alasan_penolakan` TEXT DEFAULT NULL,
  `catatan_admin` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`tagihan_id`) REFERENCES `tagihan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `pembayaran` (`id`, `tagihan_id`, `nominal_bayar`, `tanggal_bayar`, `bukti_transfer`, `status_verifikasi`, `catatan_admin`) VALUES
(1, 1, 350000.00, '2026-07-03', 'bukti_spp_juli.jpg', 'disetujui', 'Lunas terverifikasi via transfer Bank Mandiri'),
(2, 2, 350000.00, '2026-07-18', 'bukti_spp_agustus.jpg', 'menunggu', NULL);

-- --------------------------------------------------------
-- 11. Table `absensi`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `absensi` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `santri_id` BIGINT UNSIGNED NOT NULL,
  `tahun_ajaran_id` INT UNSIGNED NOT NULL,
  `tanggal` DATE NOT NULL,
  `status` ENUM('hadir', 'sakit', 'izin', 'alpha') NOT NULL DEFAULT 'hadir',
  `keterangan` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`santri_id`) REFERENCES `santri` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `santri_tanggal` (`santri_id`, `tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `absensi` (`id`, `santri_id`, `tahun_ajaran_id`, `tanggal`, `status`, `keterangan`) VALUES
(1, 1, 1, '2026-07-18', 'hadir', 'Masuk kelas tepat waktu'),
(2, 2, 1, '2026-07-18', 'izin', 'Izin pulang untuk acara keluarga');

-- --------------------------------------------------------
-- 12. Table `pelanggaran`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pelanggaran` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `santri_id` BIGINT UNSIGNED NOT NULL,
  `tanggal` DATE NOT NULL,
  `nama_pelanggaran` VARCHAR(150) NOT NULL,
  `point` INT NOT NULL DEFAULT 0,
  `sanksi` VARCHAR(255) DEFAULT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`santri_id`) REFERENCES `santri` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `pelanggaran` (`id`, `santri_id`, `tanggal`, `nama_pelanggaran`, `point`, `sanksi`, `keterangan`) VALUES
(1, 1, '2026-07-10', 'Terlambat kembali ke pondok setelah izin keluar', 5, 'Teguran lisan & hafalan surah pendek', 'Kembali terlambat 30 menit dari batas waktu perizinan.');

-- --------------------------------------------------------
-- 13. Table `perizinan`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `perizinan` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `santri_id` BIGINT UNSIGNED NOT NULL,
  `tanggal_mulai` DATETIME NOT NULL,
  `tanggal_selesai` DATETIME NOT NULL,
  `alasan` TEXT NOT NULL,
  `status` ENUM('menunggu', 'disetujui', 'ditolak') NOT NULL DEFAULT 'menunggu',
  `qr_code_keluar` VARCHAR(100) DEFAULT NULL,
  `qr_code_kembali` VARCHAR(100) DEFAULT NULL,
  `status_kembali` ENUM('belum', 'kembali') NOT NULL DEFAULT 'belum',
  `tanggal_kembali` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`santri_id`) REFERENCES `santri` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `perizinan` (`id`, `santri_id`, `tanggal_mulai`, `tanggal_selesai`, `alasan`, `status`, `qr_code_keluar`, `qr_code_kembali`, `status_kembali`, `tanggal_kembali`) VALUES
(1, 1, '2026-07-15 08:00:00', '2026-07-17 17:00:00', 'Menghadiri pernikahan kakak kandung', 'disetujui', 'QR-OUT-15072026', 'QR-IN-17072026', 'kembali', '2026-07-17 16:30:00'),
(2, 2, '2026-07-20 09:00:00', '2026-07-22 17:00:00', 'Kontrol kesehatan gigi spesialis', 'menunggu', NULL, NULL, 'belum', NULL);

-- --------------------------------------------------------
-- 14. Table `alumni_donasi`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `alumni_donasi` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `nominal` DECIMAL(15,2) NOT NULL,
  `tanggal` DATE NOT NULL,
  `bukti_transfer` VARCHAR(255) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `catatan` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `alumni_donasi` (`id`, `user_id`, `nominal`, `tanggal`, `bukti_transfer`, `status`, `catatan`) VALUES
(1, 4, 500000.00, '2026-07-15', 'donasi_fatimah.jpg', 'approved', 'Wakaf untuk perluasan masjid pondok.');

-- --------------------------------------------------------
-- 15. Table `pengumuman`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pengumuman` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `judul` VARCHAR(200) NOT NULL,
  `konten` TEXT NOT NULL,
  `status_aktif` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `pengumuman` (`id`, `judul`, `konten`, `status_aktif`, `created_by`) VALUES
(1, 'Libur Akhir Tahun Ajaran Ganjil', 'Diberitahukan kepada seluruh wali santri bahwa libur akhir semester ganjil dimulai tanggal 20 Desember s.d 3 Januari. Santri wajib kembali ke pondok paling lambat 3 Januari sebelum maghrib.', 1, 1);

-- --------------------------------------------------------
-- 16. Table `settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(50) NOT NULL UNIQUE,
  `value` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`key`, `value`) VALUES
('nama_pondok', 'Pondok Pesantren Bahrul Ulum Jombang'),
('alamat_pondok', 'Jl. KH. Wahab Hasbullah, Tambakberas, Jombang, Jawa Timur'),
('no_telp', '0321-861000'),
('email_pondok', 'info@bahrulum.sch.id'),
('logo_pondok', 'logo.png'),
('rekening_spp', 'Bank Syariah Indonesia (BSI) a.n Bahrul Ulum - 7123456789'),
('rekening_pembangunan', 'Bank Mandiri a.n Yayasan Bahrul Ulum - 1420007654321');

-- --------------------------------------------------------
-- 17. Table `audit_logs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `action` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `payload` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `audit_logs` (`user_id`, `action`, `ip_address`, `user_agent`, `payload`) VALUES
(1, 'Login Super Admin', '127.0.0.1', 'Mozilla/5.0', '{"username":"superadmin"}');
