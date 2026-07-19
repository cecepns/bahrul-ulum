<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Firebase\JWT\JWT;
use App\Models\User;
use App\Models\Santri;
use Exception;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $this->validate($request, [
            'username' => 'required',
            'password' => 'required'
        ]);

        $user = User::where('username', $request->input('username'))
            ->orWhere('email', $request->input('username'))
            ->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Username/Email atau Password salah.'
            ], 401);
        }

        if (!$user->status_aktif) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda dinonaktifkan. Silakan hubungi admin.'
            ], 403);
        }

        try {
            $payload = [
                'iss' => 'siakad-bahrul-ulum',
                'sub' => $user->id,
                'iat' => time(),
                'exp' => time() + (60 * 60 * 24) // 1 day expiration
            ];

            $token = JWT::encode($payload, env('JWT_SECRET'), 'HS256');

            // Include associated santri details if role is walisantri
            $santri = null;
            if ($user->role === 'walisantri') {
                $santri = Santri::where('user_id', $user->id)->first();
            }

            return response()->json([
                'success' => true,
                'message' => 'Login berhasil.',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username,
                        'email' => $user->email,
                        'role' => $user->role,
                        'santri' => $santri
                    ]
                ]
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat token: ' . $e->getMessage()
            ], 500);
        }
    }

    public function profile(Request $request)
    {
        $user = $request->auth;
        $santri = null;

        if ($user->role === 'walisantri') {
            $santri = Santri::where('user_id', $user->id)->with('kelas', 'tahunAjaran')->first();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'santri' => $santri
            ]
        ], 200);
    }

    public function registerWali(Request $request)
    {
        $this->validate($request, [
            'username' => 'required|unique:users,username|min:4',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'nis_santri' => 'required'
        ]);

        // Verify if santri exists
        $santri = Santri::where('nis', $request->input('nis_santri'))->first();
        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Santri dengan NIS tersebut tidak ditemukan.'
            ], 404);
        }

        if ($santri->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Santri tersebut sudah dikaitkan dengan akun wali santri lain.'
            ], 400);
        }

        $user = User::create([
            'username' => $request->input('username'),
            'email' => $request->input('email'),
            'password' => Hash::make($request->input('password')),
            'role' => 'walisantri',
            'status_aktif' => 1
        ]);

        $santri->user_id = $user->id;
        $santri->save();

        return response()->json([
            'success' => true,
            'message' => 'Registrasi Wali Santri berhasil. Silakan login.',
            'data' => $user
        ], 201);
    }

    public function registerAlumni(Request $request)
    {
        $this->validate($request, [
            'username' => 'required|unique:users,username|min:4',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'nis_alumni' => 'required'
        ]);

        // Verify if santri exists and status is alumni
        $santri = Santri::where('nis', $request->input('nis_alumni'))->first();
        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Data santri/alumni dengan NIS tersebut tidak ditemukan.'
            ], 404);
        }

        if ($santri->status_aktif !== 'alumni') {
            return response()->json([
                'success' => false,
                'message' => 'Santri dengan NIS tersebut belum dideklarasikan sebagai alumni oleh admin.'
            ], 400);
        }

        if ($santri->user_id) {
            $linkedUser = User::find($santri->user_id);
            if ($linkedUser && $linkedUser->role === 'alumni') {
                return response()->json([
                    'success' => false,
                    'message' => 'Alumni tersebut sudah dikaitkan dengan akun alumni lain.'
                ], 400);
            }
        }

        $user = User::create([
            'username' => $request->input('username'),
            'email' => $request->input('email'),
            'password' => Hash::make($request->input('password')),
            'role' => 'alumni',
            'status_aktif' => 1
        ]);

        $santri->user_id = $user->id;
        $santri->save();

        return response()->json([
            'success' => true,
            'message' => 'Registrasi Alumni berhasil. Silakan login.',
            'data' => $user
        ], 201);
    }
}
