<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pembayaran extends Model
{
    protected $table = 'pembayaran';

    protected $fillable = [
        'tagihan_id', 'nominal_bayar', 'tanggal_bayar', 'bukti_transfer', 'status_verifikasi', 'alasan_penolakan', 'catatan_admin'
    ];

    public function tagihan()
    {
        return $this->belongsTo(Tagihan::class, 'tagihan_id');
    }
}
