<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Santri;
use App\Models\TahunAjaran;
use Illuminate\Support\Str;

class PpdbController extends Controller
{
    // Wali Santri registers a candidate
    public function register(Request $request)
    {
        $this->validate($request, [
            'nama_lengkap' => 'required|string|max:150',
            'jk' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:100',
            'tanggal_lahir' => 'required|date',
            'alamat' => 'required|string',
            'nama_ayah' => 'required|string|max:100',
            'nama_ibu' => 'required|string|max:100',
            'hp_ortu' => 'required|string|max:20',
            // Files are optional on submit, but encouraged
        ]);

        $activeTahunAjaran = TahunAjaran::where('status_aktif', 1)->first();
        if (!$activeTahunAjaran) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran aktif belum dikonfigurasi. Silakan hubungi admin.'
            ], 400);
        }

        $santri = new Santri();
        $santri->fill($request->all());
        $santri->status_ppdb = 'pending';
        $santri->status_aktif = 'aktif';
        $santri->tanggal_daftar = date('Y-m-d');
        $santri->tahun_ajaran_id = $activeTahunAjaran->id;

        // Handle file uploads (KK, Akta, Ijazah, Foto)
        $uploadPath = base_path('public/uploads-siakad-bahrul-ulum');
        if (!file_exists($uploadPath)) {
            mkdir($uploadPath, 0777, true);
        }

        foreach (['foto', 'kk_file', 'akta_file', 'ijazah_file'] as $fileKey) {
            if ($request->hasFile($fileKey)) {
                $file = $request->file($fileKey);
                $filename = Str::random(20) . '.' . $file->getClientOriginalExtension();
                $file->move($uploadPath, $filename);
                $santri->$fileKey = 'uploads-siakad-bahrul-ulum/' . $filename;
            }
        }

        $santri->save();

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran PPDB berhasil diajukan.',
            'data' => $santri
        ], 201);
    }

    // Admin lists PPDB registrations
    public function index(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);
        $status = $request->input('status'); // pending, approved, rejected

        $query = Santri::with('tahunAjaran');

        if ($status) {
            $query->where('status_ppdb', $status);
        } else {
            // By default, list only pending or all registrations
            // We can show all for the PPDB manager
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nama_ayah', 'like', "%{$search}%")
                  ->orWhere('hp_ortu', 'like', "%{$search}%");
            });
        }

        $registrations = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $registrations->items(),
            'pagination' => [
                'page' => $registrations->currentPage(),
                'limit' => $registrations->perPage(),
                'total' => $registrations->total(),
                'totalPages' => $registrations->lastPage()
            ]
        ]);
    }

    // Admin verifies a candidate (approve/reject)
    public function verify(Request $request, $id)
    {
        $this->validate($request, [
            'status' => 'required|in:approved,rejected',
            'alasan_penolakan' => 'required_if:status,rejected|string'
        ]);

        $santri = Santri::find($id);
        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Data pendaftar tidak ditemukan.'
            ], 404);
        }

        $status = $request->input('status');
        $santri->status_ppdb = $status;

        if ($status === 'approved') {
            $santri->alasan_penolakan = null;
            // Generate NIS automatically: Year + JK + random 4 digits if not set
            if (!$santri->nis) {
                $year = date('Y', strtotime($santri->tanggal_daftar));
                $jkCode = ($santri->jk === 'L') ? '1' : '2';
                $lastSantri = Santri::whereNotNull('nis')->orderBy('nis', 'desc')->first();
                $counter = 1;
                if ($lastSantri && substr($lastSantri->nis, 0, 4) === $year) {
                    $counter = ((int)substr($lastSantri->nis, 5)) + 1;
                }
                $santri->nis = $year . $jkCode . str_pad($counter, 4, '0', STR_PAD_LEFT);
            }
        } else {
            $santri->alasan_penolakan = $request->input('alasan_penolakan');
        }

        $santri->save();

        return response()->json([
            'success' => true,
            'message' => 'Verifikasi PPDB berhasil diperbarui.',
            'data' => $santri
        ]);
    }
}
