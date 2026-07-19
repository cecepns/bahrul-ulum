<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Santri;

class WalisantriController extends Controller
{
    // List all Wali Santri
    public function index(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);

        $query = User::where('role', 'walisantri');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $walis = $query->paginate($limit);

        // Map to include their santri list
        $items = collect($walis->items())->map(function($wali) {
            $santris = Santri::where('user_id', $wali->id)->get(['id', 'nama_lengkap', 'nis']);
            $wali->santri = $santris;
            return $wali;
        });

        return response()->json([
            'success' => true,
            'data' => $items,
            'pagination' => [
                'page' => $walis->currentPage(),
                'limit' => $walis->perPage(),
                'total' => $walis->total(),
                'totalPages' => $walis->lastPage()
            ]
        ]);
    }

    // Create a new Wali Santri user
    public function store(Request $request)
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
                    'message' => 'Santri dengan NIS ' . $request->input('nis_siswa') . ' tidak ditemukan.'
                ], 422);
            }
        }

        $wali = User::create([
            'username' => $request->input('username'),
            'email' => $request->input('email'),
            'password' => password_hash($request->input('password'), PASSWORD_BCRYPT),
            'role' => 'walisantri',
            'status_aktif' => $request->input('status_aktif')
        ]);

        if ($request->filled('nis_siswa') && isset($santri)) {
            $santri->user_id = $wali->id;
            $santri->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Wali Santri berhasil ditambahkan.',
            'data' => $wali
        ], 201);
    }

    // Update Wali Santri
    public function update(Request $request, $id)
    {
        $wali = User::where('id', $id)->where('role', 'walisantri')->first();
        if (!$wali) {
            return response()->json([
                'success' => false,
                'message' => 'Wali Santri tidak ditemukan.'
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
                    'message' => 'Santri dengan NIS ' . $request->input('nis_siswa') . ' tidak ditemukan.'
                ], 422);
            }

            // Unlink current linked kids first
            Santri::where('user_id', $id)->update(['user_id' => null]);

            // Link the new one
            $santri->user_id = $id;
            $santri->save();
        } else {
            // Unlink all if empty
            Santri::where('user_id', $id)->update(['user_id' => null]);
        }

        $wali->username = $request->input('username');
        $wali->email = $request->input('email');
        $wali->status_aktif = $request->input('status_aktif');

        if ($request->input('password')) {
            $wali->password = password_hash($request->input('password'), PASSWORD_BCRYPT);
        }

        $wali->save();

        return response()->json([
            'success' => true,
            'message' => 'Wali Santri berhasil diperbarui.',
            'data' => $wali
        ]);
    }

    // Delete Wali Santri
    public function destroy($id)
    {
        $wali = User::where('id', $id)->where('role', 'walisantri')->first();
        if (!$wali) {
            return response()->json([
                'success' => false,
                'message' => 'Wali Santri tidak ditemukan.'
            ], 404);
        }

        // Set linked santri user_id to NULL
        Santri::where('user_id', $id)->update(['user_id' => null]);

        $wali->delete();

        return response()->json([
            'success' => true,
            'message' => 'Wali Santri berhasil dihapus.'
        ]);
    }
}
