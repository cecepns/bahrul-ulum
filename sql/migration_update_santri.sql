-- Migration script for SIAKAD / E-BUM Pondok Pesantren Bahrul Ulum Muliasari
-- Created: 2026-07-21
-- Description: Adds new columns to `santri` table for complete Buku Induk PDF identity sheet and Jenjang Education (PONDOK, MTS, MA).

USE `siakad_bahrul_ulum`;

ALTER TABLE `santri`
  ADD COLUMN IF NOT EXISTS `agama` VARCHAR(50) DEFAULT 'Islam' AFTER `tanggal_lahir`,
  ADD COLUMN IF NOT EXISTS `status_keluarga` VARCHAR(50) DEFAULT 'Anak Kandung' AFTER `agama`,
  ADD COLUMN IF NOT EXISTS `anak_ke` VARCHAR(10) DEFAULT '1' AFTER `status_keluarga`,
  ADD COLUMN IF NOT EXISTS `sekolah_asal` VARCHAR(150) DEFAULT NULL AFTER `alamat`,
  ADD COLUMN IF NOT EXISTS `di_kelas_diterima` VARCHAR(50) DEFAULT NULL AFTER `sekolah_asal`,
  ADD COLUMN IF NOT EXISTS `tanggal_diterima` DATE DEFAULT NULL AFTER `di_kelas_diterima`,
  ADD COLUMN IF NOT EXISTS `alamat_ortu` TEXT DEFAULT NULL AFTER `nama_ibu`,
  ADD COLUMN IF NOT EXISTS `pekerjaan_ayah` VARCHAR(100) DEFAULT NULL AFTER `alamat_ortu`,
  ADD COLUMN IF NOT EXISTS `pekerjaan_ibu` VARCHAR(100) DEFAULT NULL AFTER `pekerjaan_ayah`,
  ADD COLUMN IF NOT EXISTS `nama_wali` VARCHAR(100) DEFAULT NULL AFTER `pekerjaan_ibu`,
  ADD COLUMN IF NOT EXISTS `pekerjaan_wali` VARCHAR(100) DEFAULT NULL AFTER `nama_wali`,
  ADD COLUMN IF NOT EXISTS `alamat_wali` TEXT DEFAULT NULL AFTER `pekerjaan_wali`,
  ADD COLUMN IF NOT EXISTS `jenjang` ENUM('PONDOK', 'MTS', 'MA') NOT NULL DEFAULT 'PONDOK' AFTER `alamat_wali`;
