<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Santri;
use App\Models\Kelas;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Str;

class SantriController extends Controller
{
    // List active santri
    public function index(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);
        $kelasId = $request->input('kelas_id');
        $jk = $request->input('jk');
        $statusAktif = $request->input('status_aktif', 'aktif');

        $query = Santri::with(['kelas', 'tahunAjaran', 'user'])
            ->where('status_ppdb', 'approved');

        if ($statusAktif) {
            $query->where('status_aktif', $statusAktif);
        }

        if ($kelasId) {
            $query->where('kelas_id', $kelasId);
        }

        if ($jk) {
            $query->where('jk', $jk);
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%")
                  ->orWhere('nisn', 'like', "%{$search}%")
                  ->orWhere('alamat', 'like', "%{$search}%")
                  ->orWhere('hp_ortu', 'like', "%{$search}%");
            });
        }

        $santris = $query->orderBy('nama_lengkap', 'asc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $santris->items(),
            'pagination' => [
                'page' => $santris->currentPage(),
                'limit' => $santris->perPage(),
                'total' => $santris->total(),
                'totalPages' => $santris->lastPage()
            ]
        ]);
    }

    // Get specific santri detail
    public function show($id)
    {
        $santri = Santri::with(['kelas', 'tahunAjaran', 'user'])->find($id);
        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Santri tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $santri
        ]);
    }

    // Create santri (direct by admin)
    public function store(Request $request)
    {
        $this->validate($request, [
            'nama_lengkap' => 'required|string|max:150',
            'nis' => 'required|unique:santri,nis',
            'nisn' => 'nullable|unique:santri,nisn',
            'jk' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:100',
            'tanggal_lahir' => 'required|date',
            'alamat' => 'required|string',
            'nama_ayah' => 'required|string|max:100',
            'nama_ibu' => 'required|string|max:100',
            'hp_ortu' => 'required|string|max:20',
            'tahun_ajaran_id' => 'nullable|integer',
            'kelas_id' => 'nullable|integer',
        ]);

        $activeTA = \App\Models\TahunAjaran::where('status_aktif', 1)->first();
        $taId = $request->input('tahun_ajaran_id');
        if (!$taId) {
            if (!$activeTA) {
                return response()->json(['success' => false, 'message' => 'Tahun ajaran aktif belum dikonfigurasi.'], 400);
            }
            $taId = $activeTA->id;
        }

        $santri = new Santri();
        $santri->fill($request->except('tahun_ajaran_id'));
        $santri->tahun_ajaran_id = $taId;
        $santri->status_ppdb = 'approved';
        $santri->status_aktif = 'aktif';
        $santri->tanggal_daftar = date('Y-m-d');

        // Handle file uploads
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
            'message' => 'Santri berhasil ditambahkan.',
            'data' => $santri
        ], 201);
    }

    // Update santri
    public function update(Request $request, $id)
    {
        $santri = Santri::find($id);
        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Santri tidak ditemukan.'
            ], 404);
        }

        $this->validate($request, [
            'nama_lengkap' => 'required|string|max:150',
            'nis' => 'required|unique:santri,nis,' . $id,
            'nisn' => 'nullable|unique:santri,nisn,' . $id,
            'jk' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:100',
            'tanggal_lahir' => 'required|date',
            'alamat' => 'required|string',
            'nama_ayah' => 'required|string|max:100',
            'nama_ibu' => 'required|string|max:100',
            'hp_ortu' => 'required|string|max:20',
            'kelas_id' => 'nullable|integer',
            'status_aktif' => 'required|in:aktif,alumni,mutasi,keluar'
        ]);

        $santri->fill($request->all());

        // Handle file uploads
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
            'message' => 'Santri berhasil diperbarui.',
            'data' => $santri
        ]);
    }

    // Delete santri
    public function destroy($id)
    {
        $santri = Santri::find($id);
        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Santri tidak ditemukan.'
            ], 404);
        }

        $santri->delete();

        return response()->json([
            'success' => true,
            'message' => 'Santri berhasil dihapus.'
        ]);
    }

    // Cetak Buku Induk PDF using dompdf
    public function printBukuInduk($id)
    {
        $santri = Santri::with(['kelas', 'tahunAjaran'])->find($id);
        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Santri tidak ditemukan.'
            ], 404);
        }

        $settings = \App\Models\Setting::all()->pluck('value', 'key');
        $namaPondok = $settings['nama_pondok'] ?? 'Pondok Pesantren Bahrul Ulum Jombang';
        $alamatPondok = $settings['alamat_pondok'] ?? 'Jl. KH. Wahab Hasbullah, Tambakberas, Jombang, Jawa Timur';
        $noTelp = $settings['no_telp'] ?? '0321-861000';
        $logoPondok = $settings['logo_pondok'] ?? 'logo.png';

        $logoBase64 = '';
        $logoPath = base_path('public/' . $logoPondok);
        if (!file_exists($logoPath)) {
            $logoPath = base_path('public/logo.png');
        }
        if (file_exists($logoPath)) {
            $type = pathinfo($logoPath, PATHINFO_EXTENSION);
            $imgData = file_get_contents($logoPath);
            $logoBase64 = 'data:image/' . $type . ';base64,' . base64_encode($imgData);
        }

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $dompdf = new Dompdf($options);

        $fotoHtml = '';
        if ($santri->foto && file_exists(base_path('public/' . $santri->foto))) {
            $path = base_path('public/' . $santri->foto);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
            $fotoHtml = '<img src="' . $base64 . '" style="width: 120px; height: 150px; border: 1px solid #ccc; object-fit: cover;" />';
        } else {
            $fotoHtml = '<div style="width: 120px; height: 150px; border: 1px solid #ccc; text-align: center; line-height: 150px; color: #999;">FOTO 3X4</div>';
        }

        $html = '
        <html>
        <head>
            <style>
                body { font-family: sans-serif; font-size: 14px; line-height: 1.5; color: #333; }
                .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 25px; text-decoration: underline; text-transform: uppercase; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                td { padding: 6px 4px; vertical-align: top; }
                .label { width: 30%; font-weight: bold; }
                .separator { width: 3%; text-align: center; }
                .value { width: 67%; }
                .section-title { font-weight: bold; font-size: 15px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; color: #1b5e20; }
                .foto-container { float: right; margin-top: 30px; margin-right: 50px; }
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
            
            <div class="title">Buku Induk Santri</div>

            <div class="section-title">A. Keterangan Pribadi Santri</div>
            <table>
                <tr>
                    <td class="label">Nama Lengkap</td>
                    <td class="separator">:</td>
                    <td class="value">' . htmlspecialchars($santri->nama_lengkap) . '</td>
                </tr>
                <tr>
                    <td class="label">Nomor Induk Santri (NIS)</td>
                    <td class="separator">:</td>
                    <td class="value">' . htmlspecialchars($santri->nis ?? '-') . '</td>
                </tr>
                <tr>
                    <td class="label">NISN</td>
                    <td class="separator">:</td>
                    <td class="value">' . htmlspecialchars($santri->nisn ?? '-') . '</td>
                </tr>
                <tr>
                    <td class="label">Jenis Kelamin</td>
                    <td class="separator">:</td>
                    <td class="value">' . ($santri->jk === 'L' ? 'Laki-laki' : 'Perempuan') . '</td>
                </tr>
                <tr>
                    <td class="label">Tempat, Tanggal Lahir</td>
                    <td class="separator">:</td>
                    <td class="value">' . htmlspecialchars($santri->tempat_lahir) . ', ' . date('d F Y', strtotime($santri->tanggal_lahir)) . '</td>
                </tr>
                <tr>
                    <td class="label">Alamat Lengkap</td>
                    <td class="separator">:</td>
                    <td class="value">' . nl2br(htmlspecialchars($santri->alamat)) . '</td>
                </tr>
                <tr>
                    <td class="label">Kelas Saat Ini</td>
                    <td class="separator">:</td>
                    <td class="value">' . htmlspecialchars($santri->kelas->nama_kelas ?? 'Belum Ditentukan') . '</td>
                </tr>
                <tr>
                    <td class="label">Tahun Masuk</td>
                    <td class="separator">:</td>
                    <td class="value">' . htmlspecialchars($santri->tahunAjaran->tahun ?? '-') . '</td>
                </tr>
            </table>

            <div class="section-title">B. Keterangan Orang Tua / Wali</div>
            <table>
                <tr>
                    <td class="label">Nama Ayah Kandung</td>
                    <td class="separator">:</td>
                    <td class="value">' . htmlspecialchars($santri->nama_ayah) . '</td>
                </tr>
                <tr>
                    <td class="label">Nama Ibu Kandung</td>
                    <td class="separator">:</td>
                    <td class="value">' . htmlspecialchars($santri->nama_ibu) . '</td>
                </tr>
                <tr>
                    <td class="label">No. HP Orang Tua</td>
                    <td class="separator">:</td>
                    <td class="value">' . htmlspecialchars($santri->hp_ortu) . '</td>
                </tr>
            </table>

            <div class="foto-container">
                ' . $fotoHtml . '
            </div>
            
            <div style="clear: both; margin-top: 50px;">
                <table style="border: none;">
                    <tr>
                        <td style="width: 60%;"></td>
                        <td style="width: 40%; text-align: center;">
                            Jombang, ' . date('d F Y') . '<br/>
                            Kepala Pengurus Pondok,<br/><br/><br/><br/>
                            <strong>Ustadz H. Akhmad Yazid, M.Pd</strong>
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
            ->header('Content-Disposition', 'inline; filename="Buku_Induk_' . str_replace(' ', '_', $santri->nama_lengkap) . '.pdf"');
    }

    // Export active santri list as CSV
    public function exportExcel(Request $request)
    {
        $santris = Santri::with('kelas')->where('status_ppdb', 'approved')->where('status_aktif', 'aktif')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="data_santri_aktif.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($santris) {
            $file = fopen('php://output', 'w');
            // UTF-8 BOM
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            fputcsv($file, ['No', 'NIS', 'NISN', 'Nama Lengkap', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Alamat', 'Kelas', 'Nama Ayah', 'Nama Ibu', 'No HP Ortus']);

            $no = 1;
            foreach ($santris as $santri) {
                fputcsv($file, [
                    $no++,
                    $santri->nis,
                    $santri->nisn,
                    $santri->nama_lengkap,
                    $santri->jk === 'L' ? 'Laki-laki' : 'Perempuan',
                    $santri->tempat_lahir,
                    $santri->tanggal_lahir,
                    $santri->alamat,
                    $santri->kelas->nama_kelas ?? 'Belum Ditentukan',
                    $santri->nama_ayah,
                    $santri->nama_ibu,
                    $santri->hp_ortu
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
