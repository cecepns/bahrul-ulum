<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kelas;
use App\Models\Santri;

class KelasController extends Controller
{
    // List classes
    public function index(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);

        $query = Kelas::query();

        if ($search) {
            $query->where('nama_kelas', 'like', "%{$search}%")
                  ->orWhere('wali_kelas', 'like', "%{$search}%");
        }

        $classes = $query->orderBy('nama_kelas', 'asc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $classes->items(),
            'pagination' => [
                'page' => $classes->currentPage(),
                'limit' => $classes->perPage(),
                'total' => $classes->total(),
                'totalPages' => $classes->lastPage()
            ]
        ]);
    }

    // Direct fetch all for dropdown / react-select
    public function selectList(Request $request)
    {
        $search = $request->input('search');
        
        $query = Kelas::query();
        if ($search) {
            $query->where('nama_kelas', 'like', "%{$search}%");
        }

        $classes = $query->orderBy('nama_kelas', 'asc')->limit(50)->get();

        return response()->json([
            'success' => true,
            'data' => $classes
        ]);
    }

    // Show single class details with list of active students in it
    public function show($id)
    {
        $kelas = Kelas::find($id);
        if (!$kelas) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.'
            ], 404);
        }

        $students = Santri::where('kelas_id', $id)
            ->where('status_aktif', 'aktif')
            ->orderBy('nama_lengkap', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'kelas' => $kelas,
                'students' => $students
            ]
        ]);
    }

    // Create class
    public function store(Request $request)
    {
        $this->validate($request, [
            'nama_kelas' => 'required|string|max:50|unique:kelas,nama_kelas',
            'wali_kelas' => 'nullable|string|max:100'
        ]);

        $kelas = Kelas::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dibuat.',
            'data' => $kelas
        ], 201);
    }

    // Update class
    public function update(Request $request, $id)
    {
        $kelas = Kelas::find($id);
        if (!$kelas) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.'
            ], 404);
        }

        $this->validate($request, [
            'nama_kelas' => 'required|string|max:50|unique:kelas,nama_kelas,' . $id,
            'wali_kelas' => 'nullable|string|max:100'
        ]);

        $kelas->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil diperbarui.',
            'data' => $kelas
        ]);
    }

    // Delete class
    public function destroy($id)
    {
        $kelas = Kelas::find($id);
        if (!$kelas) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.'
            ], 404);
        }

        // Dissociate students in this class
        Santri::where('kelas_id', $id)->update(['kelas_id' => null]);
        
        $kelas->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dihapus.'
        ]);
    }

    // Kenaikan Kelas (Batch upgrade students from class A to class B, or mark status)
    public function kenaikanKelas(Request $request)
    {
        $this->validate($request, [
            'student_ids' => 'required|array',
            'student_ids.*' => 'integer|exists:santri,id',
            'target_kelas_id' => 'nullable|integer|exists:kelas,id',
            'tinggal_kelas' => 'required|boolean'
        ]);

        $studentIds = $request->input('student_ids');
        $targetKelasId = $request->input('target_kelas_id');
        $tinggalKelas = $request->input('tinggal_kelas');

        if ($tinggalKelas) {
            // Keep in current class or keep unmodified
            return response()->json([
                'success' => true,
                'message' => 'Proses kenaikan kelas (tinggal kelas) berhasil diproses.'
            ]);
        }

        Santri::whereIn('id', $studentIds)->update([
            'kelas_id' => $targetKelasId
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Batch kenaikan kelas berhasil diproses.'
        ]);
    }

    // Mutasi Santri (Graduation, left pondok, mutated, etc.)
    public function mutasiSantri(Request $request)
    {
        $this->validate($request, [
            'student_id' => 'required|integer|exists:santri,id',
            'status_aktif' => 'required|in:aktif,alumni,mutasi,keluar',
        ]);

        $student = Santri::find($request->input('student_id'));
        $status = $request->input('status_aktif');
        $student->status_aktif = $status;
        
        if ($status !== 'aktif') {
            $student->kelas_id = null; // remove from active class
        }
        
        $student->save();

        return response()->json([
            'success' => true,
            'message' => 'Status mutasi/kelulusan santri berhasil disimpan.',
            'data' => $student
        ]);
    }
}
