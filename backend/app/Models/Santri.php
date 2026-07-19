<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Santri extends Model
{
    protected $table = 'santri';

    protected $fillable = [
        'user_id', 'nama_lengkap', 'nis', 'nisn', 'jk', 'tempat_lahir',
        'tanggal_lahir', 'alamat', 'nama_ayah', 'nama_ibu', 'hp_ortu',
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
