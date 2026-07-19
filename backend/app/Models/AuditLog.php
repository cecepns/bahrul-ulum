<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_logs';

    public $timestamps = false; // only created_at exists in DB, handled by DB default

    protected $fillable = [
        'user_id', 'action', 'ip_address', 'user_agent', 'payload'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
