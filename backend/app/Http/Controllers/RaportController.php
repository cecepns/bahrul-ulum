<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MataPelajaran;
use App\Models\NilaiRaport;
use App\Models\Santri;
use App\Models\TahunAjaran;
use Dompdf\Dompdf;
use Dompdf\Options;

class RaportController extends Controller
{
    // List subjects
    public function indexMapel(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);

        $query = MataPelajaran::query();

        if ($search) {
            $query->where('nama_mapel', 'like', "%{$search}%")
                  ->orWhere('kode_mapel', 'like', "%{$search}%");
        }

        $mapels = $query->orderBy('nama_mapel', 'asc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $mapels->items(),
            'pagination' => [
                'page' => $mapels->currentPage(),
                'limit' => $mapels->perPage(),
                'total' => $mapels->total(),
                'totalPages' => $mapels->lastPage()
            ]
        ]);
    }

    public function selectMapel(Request $request)
    {
        $search = $request->input('search');
        $query = MataPelajaran::query();
        if ($search) {
            $query->where('nama_mapel', 'like', "%{$search}%");
        }
        return response()->json([
            'success' => true,
            'data' => $query->orderBy('nama_mapel', 'asc')->limit(50)->get()
        ]);
    }

    // CRUD mapel
    public function storeMapel(Request $request)
    {
        $this->validate($request, [
            'nama_mapel' => 'required|string|max:100',
            'kode_mapel' => 'required|string|max:20|unique:mata_pelajaran,kode_mapel'
        ]);

        $mapel = MataPelajaran::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Mata pelajaran berhasil ditambahkan.',
            'data' => $mapel
        ], 201);
    }

    public function updateMapel(Request $request, $id)
    {
        $mapel = MataPelajaran::find($id);
        if (!$mapel) {
            return response()->json([
                'success' => false,
                'message' => 'Mata pelajaran tidak ditemukan.'
            ], 404);
        }

        $this->validate($request, [
            'nama_mapel' => 'required|string|max:100',
            'kode_mapel' => 'required|string|max:20|unique:mata_pelajaran,kode_mapel,' . $id
        ]);

        $mapel->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Mata pelajaran berhasil diperbarui.',
            'data' => $mapel
        ]);
    }

    public function destroyMapel($id)
    {
        $mapel = MataPelajaran::find($id);
        if (!$mapel) {
            return response()->json([
                'success' => false,
                'message' => 'Mata pelajaran tidak ditemukan.'
            ], 404);
        }

        $mapel->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mata pelajaran berhasil dihapus.'
        ]);
    }

    // Input Nilai
    public function inputNilai(Request $request)
    {
        $this->validate($request, [
            'santri_id' => 'required|integer|exists:santri,id',
            'mapel_id' => 'required|integer|exists:mata_pelajaran,id',
            'nilai_angka' => 'required|numeric|min:0|max:100',
            'catatan' => 'nullable|string',
            'kkm' => 'required|numeric|min:0|max:100'
        ]);

        $activeTA = TahunAjaran::where('status_aktif', 1)->first();
        if (!$activeTA) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran aktif belum dikonfigurasi.'
            ], 400);
        }

        $nilaiAngka = $request->input('nilai_angka');
        
        // Auto convert to grade (nilai_huruf)
        $nilaiHuruf = 'E';
        if ($nilaiAngka >= 90) $nilaiHuruf = 'A';
        elseif ($nilaiAngka >= 80) $nilaiHuruf = 'B';
        elseif ($nilaiAngka >= 70) $nilaiHuruf = 'C';
        elseif ($nilaiAngka >= 60) $nilaiHuruf = 'D';

        $nilai = NilaiRaport::updateOrCreate(
            [
                'santri_id' => $request->input('santri_id'),
                'mapel_id' => $request->input('mapel_id'),
                'tahun_ajaran_id' => $activeTA->id
            ],
            [
                'nilai_angka' => $nilaiAngka,
                'nilai_huruf' => $nilaiHuruf,
                'catatan' => $request->input('catatan'),
                'kkm' => $request->input('kkm', 70.00)
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Nilai berhasil disimpan.',
            'data' => $nilai
        ]);
    }

    // Get Nilai for a student
    public function getNilaiSantri(Request $request, $santriId)
    {
        $activeTA = TahunAjaran::where('status_aktif', 1)->first();
        if (!$activeTA) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran aktif belum dikonfigurasi.'
            ], 400);
        }

        $scores = NilaiRaport::with('mapel')
            ->where('santri_id', $santriId)
            ->where('tahun_ajaran_id', $activeTA->id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $scores
        ]);
    }

    // Import Mapel Excel Mock (as CSV/JSON input or simple upload parsed in controller)
    public function importMapel(Request $request)
    {
        $this->validate($request, [
            'file' => 'required'
        ]);

        // Simple mock of successful import
        return response()->json([
            'success' => true,
            'message' => 'Import mata pelajaran dari excel berhasil. (Simulated)'
        ]);
    }

    // Print Raport PDF using dompdf
    public function printRaport(Request $request, $santriId)
    {
        $santri = Santri::with('kelas', 'tahunAjaran')->find($santriId);
        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Santri tidak ditemukan.'
            ], 404);
        }

        $activeTA = TahunAjaran::where('status_aktif', 1)->first();
        if (!$activeTA) {
            return response('Tahun ajaran aktif belum dikonfigurasi.', 400);
        }

        $scores = NilaiRaport::with('mapel')
            ->where('santri_id', $santriId)
            ->where('tahun_ajaran_id', $activeTA->id)
            ->get();

        $settings = \App\Models\Setting::all()->pluck('value', 'key');
        $namaPondok = $settings['nama_pondok'] ?? 'Pondok Pesantren Bahrul Ulum Muliasari';
        $alamatPondok = $settings['alamat_pondok'] ?? 'Jl. Tanjung Api-api Km.42 Muliasari, Banyuasin';
        $noTelp = $settings['no_telp'] ?? '081234567890';
        $logoPondok = $settings['logo_pondok'] ?? 'logo.png';
        $kepalaMadrasah = $settings['kepala_madrasah'] ?? 'ROHMAN, S.Pd.I, M.Si';
        $kotaTerbit = $settings['kota_terbit'] ?? 'Tanjung Lago';

        $logoBase64 = '';
        $possiblePaths = [
            base_path('public/' . $logoPondok),
            base_path('public/logo.png'),
            base_path('../logo.png'),
            base_path('../frontend/public/logo.png'),
        ];

        foreach ($possiblePaths as $path) {
            if ($path && file_exists($path) && !is_dir($path)) {
                $type = pathinfo($path, PATHINFO_EXTENSION);
                $imgData = file_get_contents($path);
                $logoBase64 = 'data:image/' . ($type === 'svg' ? 'svg+xml' : $type) . ';base64,' . base64_encode($imgData);
                break;
            }
        }

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $dompdf = new Dompdf($options);

        // Generate Report Table Rows
        $rowsHtml = '';
        $no = 1;
        $totalNilai = 0;
        foreach ($scores as $score) {
            $rowsHtml .= '
            <tr>
                <td style="text-align: center; border: 1px solid #333; padding: 6px;">' . $no++ . '</td>
                <td style="border: 1px solid #333; padding: 6px;">' . htmlspecialchars($score->mapel->nama_mapel) . '</td>
                <td style="text-align: center; border: 1px solid #333; padding: 6px;">' . number_format($score->kkm, 0) . '</td>
                <td style="text-align: center; border: 1px solid #333; padding: 6px;">' . number_format($score->nilai_angka, 0) . '</td>
                <td style="text-align: center; border: 1px solid #333; padding: 6px;">' . htmlspecialchars($score->nilai_huruf) . '</td>
                <td style="border: 1px solid #333; padding: 6px; font-size: 11px;">' . htmlspecialchars($score->catatan ?? '-') . '</td>
            </tr>
            ';
            $totalNilai += $score->nilai_angka;
        }

        $avgNilai = count($scores) > 0 ? ($totalNilai / count($scores)) : 0;

        $html = '
        <html>
        <head>
            <style>
                body { font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
                .title { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
                .info-table { width: 100%; margin-bottom: 20px; }
                .info-table td { padding: 3px 0; }
                .score-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .score-table th { border: 1px solid #333; background-color: #f2f2f2; padding: 8px; font-weight: bold; }
                .signature-section { margin-top: 40px; }
            </style>
        </head>
        <body>
            <table style="width: 100%; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 25px; border-collapse: collapse;">
                <tr>
                    <td style="width: 15%; text-align: left; vertical-align: middle; padding: 0;">
                        ' . ($logoBase64 ? '<img src="' . $logoBase64 . '" style="height: 60px; max-width: 80px;" />' : '') . '
                    </td>
                    <td style="width: 85%; text-align: center; vertical-align: middle; padding: 0 50px 0 0;">
                        <h2 style="margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; color: #111;">' . htmlspecialchars($namaPondok) . '</h2>
                        <p style="margin: 5px 0 0 0; font-size: 10px; color: #555; font-weight: normal; line-height: 1.3;">' . htmlspecialchars($alamatPondok) . ' | Telp: ' . htmlspecialchars($noTelp) . '</p>
                    </td>
                </tr>
            </table>
            
            <div class="title">Laporan Hasil Belajar Santri (Raport)</div>

            <table class="info-table" style="border: none;">
                <tr>
                    <td style="width: 15%; font-weight: bold;">Nama Santri</td>
                    <td style="width: 2%;">:</td>
                    <td style="width: 43%;">' . htmlspecialchars($santri->nama_lengkap) . '</td>
                    <td style="width: 15%; font-weight: bold;">Kelas</td>
                    <td style="width: 2%;">:</td>
                    <td style="width: 23%;">' . htmlspecialchars($santri->kelas->nama_kelas ?? '-') . '</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">NIS / NISN</td>
                    <td>:</td>
                    <td>' . htmlspecialchars($santri->nis ?? '-') . ' / ' . htmlspecialchars($santri->nisn ?? '-') . '</td>
                    <td style="font-weight: bold;">Semester</td>
                    <td>:</td>
                    <td style="text-transform: capitalize;">' . htmlspecialchars($activeTA->semester) . '</td>
                </tr>
                <tr>
                    <td>Tahun Ajaran</td>
                    <td>:</td>
                    <td>' . htmlspecialchars($activeTA->tahun) . '</td>
                    <td>Status Kelulusan</td>
                    <td>:</td>
                    <td>' . ($santri->status_aktif === 'alumni' ? 'Lulus' : 'Aktif') . '</td>
                </tr>
            </table>

            <table class="score-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">No</th>
                        <th style="width: 35%;">Mata Pelajaran</th>
                        <th style="width: 10%;">KKM</th>
                        <th style="width: 12%;">Nilai Angka</th>
                        <th style="width: 10%;">Predikat</th>
                        <th style="width: 28%;">Deskripsi / Catatan</th>
                    </tr>
                </thead>
                <tbody>
                    ' . ($rowsHtml ?: '<tr><td colspan="6" style="text-align: center; border: 1px solid #333; padding: 10px; color: #999;">Belum ada nilai yang diinput.</td></tr>') . '
                    <tr>
                        <td colspan="3" style="text-align: right; font-weight: bold; border: 1px solid #333; padding: 6px;">Rata-Rata Nilai</td>
                        <td style="text-align: center; font-weight: bold; border: 1px solid #333; padding: 6px;">' . number_format($avgNilai, 2) . '</td>
                        <td colspan="2" style="border: 1px solid #333; padding: 6px;"></td>
                    </tr>
                </tbody>
            </table>

            <div class="signature-section">
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="width: 33%; text-align: center; vertical-align: top;">
                            Orang Tua / Wali Santri,<br/><br/><br/><br/>
                            ...................................
                        </td>
                        <td style="width: 33%; text-align: center; vertical-align: top;">
                            Wali Kelas,<br/><br/><br/><br/>
                            <strong>' . htmlspecialchars($santri->kelas->wali_kelas ?? '_________________') . '</strong>
                        </td>
                        <td style="width: 34%; text-align: center; vertical-align: top;">
                            ' . htmlspecialchars($kotaTerbit) . ', ' . date('d F Y') . '<br/>
                            Kepala Madrasah / Pondok,<br/><br/><br/><br/>
                            <strong>' . htmlspecialchars($kepalaMadrasah) . '</strong>
                        </td>
                    </tr>
                </table>
            </div>
        </body>
        </html>
        ';

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response($dompdf->output(), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="Raport_' . str_replace(' ', '_', $santri->nama_lengkap) . '.pdf"');
    }
}
