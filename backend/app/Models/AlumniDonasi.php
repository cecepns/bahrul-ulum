<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlumniDonasi extends Model
{
    protected $table = 'alumni_donasi';

    protected $fillable = [
        'user_id', 'nominal', 'tanggal', 'bukti_transfer', 'status', 'catatan'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
