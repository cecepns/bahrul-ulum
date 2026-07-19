<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Perizinan extends Model
{
    protected $table = 'perizinan';

    protected $fillable = [
        'santri_id', 'tanggal_mulai', 'tanggal_selesai', 'alasan', 'status',
        'qr_code_keluar', 'qr_code_kembali', 'status_kembali', 'tanggal_kembali'
    ];

    public function santri()
    {
        return $this->belongsTo(Santri::class, 'santri_id');
    }
}
