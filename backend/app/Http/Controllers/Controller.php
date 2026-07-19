<?php

namespace App\Http\Controllers;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;

class Controller extends BaseController
{
    public function validate(Request $request, array $rules, array $messages = [], array $customAttributes = [])
    {
        $indonesianMessages = [
            'required' => 'Kolom :attribute wajib diisi.',
            'unique' => ':attribute sudah terdaftar / digunakan.',
            'email' => 'Format email :attribute tidak valid.',
            'max' => 'Kolom :attribute maksimal :max karakter.',
            'min' => 'Kolom :attribute minimal :min karakter.',
            'in' => 'Pilihan :attribute tidak valid.',
            'date' => 'Kolom :attribute harus berupa tanggal yang valid.',
            'integer' => 'Kolom :attribute harus berupa angka bulat.',
            'numeric' => 'Kolom :attribute harus berupa angka.',
            'image' => 'Kolom :attribute harus berupa berkas gambar.',
            'mimes' => 'Format berkas :attribute tidak valid (harus :values).',
        ];

        $mergedMessages = array_merge($indonesianMessages, $messages);

        $indonesianAttributes = [
            'username' => 'Nama pengguna (Username)',
            'email' => 'Alamat email',
            'password' => 'Kata sandi (Password)',
            'nama_lengkap' => 'Nama lengkap',
            'nis' => 'NIS (Nomor Induk Santri)',
            'nis_siswa' => 'NIS Siswa / Anak',
            'nisn' => 'NISN',
            'jk' => 'Jenis kelamin',
            'tempat_lahir' => 'Tempat lahir',
            'tanggal_lahir' => 'Tanggal lahir',
            'alamat' => 'Alamat',
            'nama_ayah' => 'Nama ayah',
            'nama_ibu' => 'Nama ibu',
            'hp_ortu' => 'No. HP orang tua',
            'tahun_ajaran_id' => 'Tahun ajaran',
            'kelas_id' => 'Kelas',
            'status_aktif' => 'Status aktif',
            'status' => 'Status',
            'nominal_bayar' => 'Nominal bayar',
            'tanggal_bayar' => 'Tanggal bayar',
            'bukti_transfer' => 'Bukti transfer',
            'nama_tagihan' => 'Nama tagihan',
            'nominal' => 'Nominal',
        ];

        $mergedAttributes = array_merge($indonesianAttributes, $customAttributes);

        $validator = $this->getValidationFactory()->make(
            $request->all(), $rules, $mergedMessages, $mergedAttributes
        );

        if ($validator->fails()) {
            $this->throwValidationException($request, $validator);
        }
    }
}
