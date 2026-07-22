<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Santri extends Model
{
    protected $table = 'santri';

    protected $fillable = [
        'user_id', 'nama_lengkap', 'nis', 'nisn', 'jk', 'tempat_lahir',
        'tanggal_lahir', 'agama', 'status_keluarga', 'anak_ke', 'alamat',
        'sekolah_asal', 'di_kelas_diterima', 'tanggal_diterima',
        'nama_ayah', 'nama_ibu', 'alamat_ortu', 'pekerjaan_ayah', 'pekerjaan_ibu',
        'nama_wali', 'pekerjaan_wali', 'alamat_wali', 'jenjang', 'hp_ortu',
        'status_ppdb', 'alasan_penolakan', 'tanggal_daftar', 'foto',
        'kk_file', 'akta_file', 'ijazah_file', 'tahun_ajaran_id', 'kelas_id', 'status_aktif'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'tahun_ajaran_id');
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }

    public function nilaiRaport()
    {
        return $this->hasMany(NilaiRaport::class, 'santri_id');
    }

    public function prestasi()
    {
        return $this->hasMany(Prestasi::class, 'santri_id');
    }

    public function tagihan()
    {
        return $this->hasMany(Tagihan::class, 'santri_id');
    }

    public function absensi()
    {
        return $this->hasMany(Absensi::class, 'santri_id');
    }

    public function pelanggaran()
    {
        return $this->hasMany(Pelanggaran::class, 'santri_id');
    }

    public function perizinan()
    {
        return $this->hasMany(Perizinan::class, 'santri_id');
    }
}
