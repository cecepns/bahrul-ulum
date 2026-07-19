<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    protected $table = 'kelas';

    protected $fillable = [
        'nama_kelas', 'wali_kelas'
    ];

    public function santri()
    {
        return $this->hasMany(Santri::class, 'kelas_id');
    }
}
