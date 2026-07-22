-- Migration script for SIAKAD / E-BUM Pondok Pesantren Bahrul Ulum Muliasari
-- Created: 2026-07-21
-- Description: Adds dynamic setting keys for PDF Kop & Signatures (Kepala Madrasah, NIP, Kota Terbit, Alamat & Telp).

USE `siakad_bahrul_ulum`;

INSERT INTO `settings` (`key`, `value`) VALUES
('nama_pondok', 'Pondok Pesantren Bahrul Ulum Muliasari'),
('alamat_pondok', 'Jl. Tanjung Api-api Km.42 Muliasari, Kecamatan Tanjung Lago, Kabupaten Banyuasin - Sumatera Selatan'),
('no_telp', '081234567890'),
('email_pondok', 'info@bahrulum.sch.id'),
('logo_pondok', 'logo.png'),
('kepala_madrasah', 'ROHMAN, S.Pd.I, M.Si'),
('nip_kepala', '038201207150004'),
('kota_terbit', 'Tanjung Lago')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
