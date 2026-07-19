<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Absensi;
use App\Models\Santri;
use App\Models\TahunAjaran;

class AbsensiController extends Controller
{
    // Save daily attendance in bulk (Admin/Operator input)
    public function storeBulk(Request $request)
    {
        $this->validate($request, [
            'tanggal' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.santri_id' => 'required|integer|exists:santri,id',
            'attendances.*.status' => 'required|in:hadir,sakit,izin,alpha',
            'attendances.*.keterangan' => 'nullable|string|max:255'
        ]);

        $activeTA = TahunAjaran::where('status_aktif', 1)->first();
        if (!$activeTA) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran aktif belum dikonfigurasi.'
            ], 400);
        }

        $tanggal = $request->input('tanggal');
        $attendances = $request->input('attendances');

        $savedCount = 0;
        foreach ($attendances as $att) {
            Absensi::updateOrCreate(
                [
                    'santri_id' => $att['santri_id'],
                    'tanggal' => $tanggal
                ],
                [
                    'tahun_ajaran_id' => $activeTA->id,
                    'status' => $att['status'],
                    'keterangan' => $att['keterangan'] ?? null
                ]
            );
            $savedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "Berhasil menyimpan absensi untuk {$savedCount} santri."
        ]);
    }

    // Get attendance for a class on a specific date (Admin view/edit form load)
    public function classAttendance(Request $request)
    {
        $this->validate($request, [
            'kelas_id' => 'required|integer|exists:kelas,id',
            'tanggal' => 'required|date'
        ]);

        $kelasId = $request->input('kelas_id');
        $tanggal = $request->input('tanggal');

        // Fetch students in this class
        $students = Santri::where('kelas_id', $kelasId)
            ->where('status_aktif', 'aktif')
            ->where('status_ppdb', 'approved')
            ->orderBy('nama_lengkap', 'asc')
            ->get();

        $data = [];
        foreach ($students as $student) {
            // Find existing attendance
            $att = Absensi::where('santri_id', $student->id)->where('tanggal', $tanggal)->first();
            $data[] = [
                'santri_id' => $student->id,
                'nama_lengkap' => $student->nama_lengkap,
                'nis' => $student->nis,
                'status' => $att ? $att->status : 'hadir', // default to hadir
                'keterangan' => $att ? $att->keterangan : ''
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // Wali Santri retrieves attendance history for their santri
    public function waliAttendance(Request $request)
    {
        $user = $request->auth;
        $santri = Santri::where('user_id', $user->id)->first();

        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Akun wali santri belum dikaitkan dengan santri.'
            ], 404);
        }

        $activeTA = TahunAjaran::where('status_aktif', 1)->first();
        if (!$activeTA) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran aktif belum dikonfigurasi.'
            ], 400);
        }

        // Attendance lists
        $history = Absensi::where('santri_id', $santri->id)
            ->where('tahun_ajaran_id', $activeTA->id)
            ->orderBy('tanggal', 'desc')
            ->get();

        // Rekap counts
        $rekap = [
            'hadir' => Absensi::where('santri_id', $santri->id)->where('tahun_ajaran_id', $activeTA->id)->where('status', 'hadir')->count(),
            'sakit' => Absensi::where('santri_id', $santri->id)->where('tahun_ajaran_id', $activeTA->id)->where('status', 'sakit')->count(),
            'izin' => Absensi::where('santri_id', $santri->id)->where('tahun_ajaran_id', $activeTA->id)->where('status', 'izin')->count(),
            'alpha' => Absensi::where('santri_id', $santri->id)->where('tahun_ajaran_id', $activeTA->id)->where('status', 'alpha')->count()
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'rekap' => $rekap,
                'history' => $history
            ]
        ]);
    }
}
