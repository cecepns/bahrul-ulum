<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Santri;
use App\Models\AlumniDonasi;
use Illuminate\Support\Str;

class AlumniController extends Controller
{
    // List alumni profiles (Admin)
    public function index(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);

        $query = Santri::with(['kelas', 'tahunAjaran'])
            ->where('status_aktif', 'alumni');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%")
                  ->orWhere('alamat', 'like', "%{$search}%");
            });
        }

        $alumni = $query->orderBy('nama_lengkap', 'asc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $alumni->items(),
            'pagination' => [
                'page' => $alumni->currentPage(),
                'limit' => $alumni->perPage(),
                'total' => $alumni->total(),
                'totalPages' => $alumni->lastPage()
            ]
        ]);
    }

    // Submit donation (Alumni)
    public function submitDonasi(Request $request)
    {
        $user = $request->auth;

        $this->validate($request, [
            'nominal' => 'required|numeric|min:0',
            'tanggal' => 'required|date',
            'bukti_transfer' => 'required|file|image|max:2048',
            'catatan' => 'nullable|string'
        ]);

        $uploadPath = base_path('public/uploads-siakad-bahrul-ulum');
        if (!file_exists($uploadPath)) {
            mkdir($uploadPath, 0777, true);
        }

        $file = $request->file('bukti_transfer');
        $filename = Str::random(20) . '.' . $file->getClientOriginalExtension();
        $file->move($uploadPath, $filename);

        $donasi = AlumniDonasi::create([
            'user_id' => $user->id,
            'nominal' => $request->input('nominal'),
            'tanggal' => $request->input('tanggal'),
            'bukti_transfer' => 'uploads-siakad-bahrul-ulum/' . $filename,
            'status' => 'pending',
            'catatan' => $request->input('catatan')
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Donasi berhasil diajukan. Terima kasih atas partisipasi Anda.',
            'data' => $donasi
        ], 201);
    }

    // List donations (Admin & Alumni specific)
    public function indexDonasi(Request $request)
    {
        $user = $request->auth;
        $limit = $request->input('limit', 10);
        $search = $request->input('search');

        $query = AlumniDonasi::with('user');

        if ($user->role === 'alumni') {
            $query->where('user_id', $user->id);
        }

        if ($search && $user->role !== 'alumni') {
            $query->whereHas('user', function($q) use ($search) {
                $q->where('username', 'like', "%{$search}%");
            });
        }

        $donations = $query->orderBy('tanggal', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $donations->items(),
            'pagination' => [
                'page' => $donations->currentPage(),
                'limit' => $donations->perPage(),
                'total' => $donations->total(),
                'totalPages' => $donations->lastPage()
            ]
        ]);
    }

    // Verify donation (Admin approval)
    public function verifikasiDonasi(Request $request, $id)
    {
        $this->validate($request, [
            'status' => 'required|in:approved,rejected'
        ]);

        $donasi = AlumniDonasi::find($id);
        if (!$donasi) {
            return response()->json([
                'success' => false,
                'message' => 'Data donasi tidak ditemukan.'
            ], 404);
        }

        $donasi->status = $request->input('status');
        $donasi->save();

        return response()->json([
            'success' => true,
            'message' => 'Status donasi berhasil diperbarui.',
            'data' => $donasi
        ]);
    }

    // List Alumni accounts (Admin)
    public function listAccounts(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);

        $query = \App\Models\User::where('role', 'alumni');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $alumni = $query->paginate($limit);

        foreach ($alumni->items() as $acc) {
            $acc->santri = Santri::where('user_id', $acc->id)->get(['id', 'nama_lengkap', 'nis']);
        }

        return response()->json([
            'success' => true,
            'data' => $alumni->items(),
            'pagination' => [
                'page' => $alumni->currentPage(),
                'limit' => $alumni->perPage(),
                'total' => $alumni->total(),
                'totalPages' => $alumni->lastPage()
            ]
        ]);
    }

    // Create new Alumni account (Admin)
    public function storeAccount(Request $request)
    {
        $this->validate($request, [
            'username' => 'required|string|max:50|unique:users,username',
            'email' => 'required|email|max:100|unique:users,email',
            'password' => 'required|string|min:6',
            'status_aktif' => 'required|boolean',
            'nis_siswa' => 'nullable|string|max:50'
        ]);

        if ($request->filled('nis_siswa')) {
            $santri = Santri::where('nis', $request->input('nis_siswa'))->first();
            if (!$santri) {
                return response()->json([
                    'success' => false,
                    'message' => 'Santri/Alumni dengan NIS ' . $request->input('nis_siswa') . ' tidak ditemukan.'
                ], 422);
            }
            if ($santri->status_aktif !== 'alumni') {
                return response()->json([
                    'success' => false,
                    'message' => 'Santri dengan NIS tersebut belum diset sebagai alumni oleh admin.'
                ], 422);
            }
            if ($santri->user_id) {
                $linkedUser = \App\Models\User::find($santri->user_id);
                if ($linkedUser && $linkedUser->role === 'alumni') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Alumni dengan NIS tersebut sudah memiliki akun alumni lain.'
                    ], 422);
                }
            }
        }

        $user = \App\Models\User::create([
            'username' => $request->input('username'),
            'email' => $request->input('email'),
            'password' => password_hash($request->input('password'), PASSWORD_BCRYPT),
            'role' => 'alumni',
            'status_aktif' => $request->input('status_aktif')
        ]);

        if ($request->filled('nis_siswa') && isset($santri)) {
            Santri::where('user_id', $user->id)->update(['user_id' => null]);
            $santri->user_id = $user->id;
            $santri->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Akun Alumni berhasil ditambahkan.',
            'data' => $user
        ], 201);
    }

    // Update Alumni account (Admin)
    public function updateAccount(Request $request, $id)
    {
        $user = \App\Models\User::where('id', $id)->where('role', 'alumni')->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Alumni tidak ditemukan.'
            ], 404);
        }

        $this->validate($request, [
            'username' => 'required|string|max:50|unique:users,username,' . $id,
            'email' => 'required|email|max:100|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'status_aktif' => 'required|boolean',
            'nis_siswa' => 'nullable|string|max:50'
        ]);

        if ($request->filled('nis_siswa')) {
            $santri = Santri::where('nis', $request->input('nis_siswa'))->first();
            if (!$santri) {
                return response()->json([
                    'success' => false,
                    'message' => 'Santri/Alumni dengan NIS ' . $request->input('nis_siswa') . ' tidak ditemukan.'
                ], 422);
            }
            if ($santri->status_aktif !== 'alumni') {
                return response()->json([
                    'success' => false,
                    'message' => 'Santri dengan NIS tersebut belum diset sebagai alumni oleh admin.'
                ], 422);
            }
            if ($santri->user_id && $santri->user_id != $id) {
                $linkedUser = \App\Models\User::find($santri->user_id);
                if ($linkedUser && $linkedUser->role === 'alumni') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Alumni dengan NIS tersebut sudah memiliki akun alumni lain.'
                    ], 422);
                }
            }

            Santri::where('user_id', $id)->update(['user_id' => null]);
            $santri->user_id = $id;
            $santri->save();
        } else {
            Santri::where('user_id', $id)->update(['user_id' => null]);
        }

        $user->username = $request->input('username');
        $user->email = $request->input('email');
        $user->status_aktif = $request->input('status_aktif');

        if ($request->input('password')) {
            $user->password = password_hash($request->input('password'), PASSWORD_BCRYPT);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Akun Alumni berhasil diperbarui.',
            'data' => $user
        ]);
    }

    // Delete Alumni account (Admin)
    public function destroyAccount($id)
    {
        $user = \App\Models\User::where('id', $id)->where('role', 'alumni')->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Alumni tidak ditemukan.'
            ], 404);
        }

        Santri::where('user_id', $id)->update(['user_id' => null]);
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun Alumni berhasil dihapus.'
        ]);
    }
}
