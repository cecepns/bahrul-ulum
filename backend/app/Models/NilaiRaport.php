<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NilaiRaport extends Model
{
    protected $table = 'nilai_raport';

    protected $fillable = [
        'santri_id', 'mapel_id', 'tahun_ajaran_id', 'nilai_angka', 'nilai_huruf', 'catatan', 'kkm'
    ];

    public function santri()
    {
        return $this->belongsTo(Santri::class, 'santri_id');
    }

    public function mapel()
    {
        return $this->belongsTo(MataPelajaran::class, 'mapel_id');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'tahun_ajaran_id');
    }
}
