<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pelanggaran;
use App\Models\Santri;

class PelanggaranController extends Controller
{
    // List violations (Admin)
    public function index(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);

        $query = Pelanggaran::with('santri.kelas');

        if ($search) {
            $query->whereHas('santri', function($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%");
            })->orWhere('nama_pelanggaran', 'like', "%{$search}%");
        }

        $pelanggarans = $query->orderBy('tanggal', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $pelanggarans->items(),
            'pagination' => [
                'page' => $pelanggarans->currentPage(),
                'limit' => $pelanggarans->perPage(),
                'total' => $pelanggarans->total(),
                'totalPages' => $pelanggarans->lastPage()
            ]
        ]);
    }

    // Wali Santri: see list of violations & points
    public function waliPelanggaran(Request $request)
    {
        $user = $request->auth;
        $santri = Santri::where('user_id', $user->id)->first();

        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Akun wali santri belum dikaitkan dengan santri.'
            ], 404);
        }

        $violations = Pelanggaran::where('santri_id', $santri->id)
            ->orderBy('tanggal', 'desc')
            ->get();

        $totalPoints = Pelanggaran::where('santri_id', $santri->id)->sum('point');

        return response()->json([
            'success' => true,
            'data' => [
                'violations' => $violations,
                'total_points' => (int)$totalPoints
            ]
        ]);
    }

    // Add violation
    public function store(Request $request)
    {
        $this->validate($request, [
            'santri_id' => 'required|integer|exists:santri,id',
            'tanggal' => 'required|date',
            'nama_pelanggaran' => 'required|string|max:150',
            'point' => 'required|integer|min:0',
            'sanksi' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string'
        ]);

        $pelanggaran = Pelanggaran::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Pelanggaran berhasil dicatat.',
            'data' => $pelanggaran
        ], 201);
    }

    // Update violation
    public function update(Request $request, $id)
    {
        $pelanggaran = Pelanggaran::find($id);
        if (!$pelanggaran) {
            return response()->json([
                'success' => false,
                'message' => 'Data pelanggaran tidak ditemukan.'
            ], 404);
        }

        $this->validate($request, [
            'santri_id' => 'required|integer|exists:santri,id',
            'tanggal' => 'required|date',
            'nama_pelanggaran' => 'required|string|max:150',
            'point' => 'required|integer|min:0',
            'sanksi' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string'
        ]);

        $pelanggaran->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Pelanggaran berhasil diperbarui.',
            'data' => $pelanggaran
        ]);
    }

    // Delete violation
    public function destroy($id)
    {
        $pelanggaran = Pelanggaran::find($id);
        if (!$pelanggaran) {
            return response()->json([
                'success' => false,
                'message' => 'Data pelanggaran tidak ditemukan.'
            ], 404);
        }

        $pelanggaran->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pelanggaran berhasil dihapus.'
        ]);
    }
}
