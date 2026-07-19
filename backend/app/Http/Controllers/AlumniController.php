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
}
