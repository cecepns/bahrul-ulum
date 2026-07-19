<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TahunAjaran extends Model
{
    protected $table = 'tahun_ajaran';

    protected $fillable = [
        'tahun', 'semester', 'status_aktif'
    ];

    protected $casts = [
        'status_aktif' => 'boolean'
    ];
}
