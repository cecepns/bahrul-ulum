<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JenisTagihan extends Model
{
    protected $table = 'jenis_tagihan';

    protected $fillable = [
        'nama_tagihan', 'nominal', 'tipe'
    ];
}
