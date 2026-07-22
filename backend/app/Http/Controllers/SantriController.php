<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Santri;
use App\Models\Kelas;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Str;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

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

    // Search/Select active santri list for dropdowns
    public function selectList(Request $request)
    {
        $search = $request->input('search');
        $query = Santri::with('kelas')->where('status_aktif', 'aktif')->where('status_ppdb', 'approved');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%");
            });
        }

        $santris = $query->orderBy('nama_lengkap', 'asc')->limit(50)->get();

        return response()->json([
            'success' => true,
            'data' => $santris
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
            'jenjang' => 'nullable|in:PONDOK,MTS,MA',
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
        if (!$santri->jenjang) {
            $santri->jenjang = 'PONDOK';
        }

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
            'status_aktif' => 'required|in:aktif,alumni,mutasi,keluar',
            'jenjang' => 'nullable|in:PONDOK,MTS,MA',
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

        // Generate QR Code using chillerlan/php-qrcode
        $qrBase64 = '';
        try {
            if (class_exists(\chillerlan\QRCode\QROptions::class) && class_exists(\chillerlan\QRCode\QRCode::class)) {
                $qrOptions = new \chillerlan\QRCode\QROptions([
                    'outputBase64' => true,
                    'outputType'   => \chillerlan\QRCode\QRCode::OUTPUT_MARKUP_SVG,
                    'eccLevel'     => \chillerlan\QRCode\QRCode::ECC_L,
                ]);
                $qrDataString = "NIS: " . ($santri->nis ?? '-') . " | NISN: " . ($santri->nisn ?? '-') . " | Nama: " . $santri->nama_lengkap . " | MAS BAHRUL ULUM MULIASARI";
                $qrBase64 = (new \chillerlan\QRCode\QRCode($qrOptions))->render($qrDataString);
            }
        } catch (\Throwable $e) {
            $qrBase64 = '';
        }

        // Format dates
        $bulanIndo = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        $tglLahir = date('d', strtotime($santri->tanggal_lahir)) . ' ' .
                    ($bulanIndo[(int)date('m', strtotime($santri->tanggal_lahir))] ?? date('F', strtotime($santri->tanggal_lahir))) . ' ' .
                    date('Y', strtotime($santri->tanggal_lahir));

        $tglDiterimaRaw = $santri->tanggal_diterima ?? $santri->tanggal_daftar ?? date('Y-m-d');
        $tglDiterima = date('d', strtotime($tglDiterimaRaw)) . ' ' .
                       ($bulanIndo[(int)date('m', strtotime($tglDiterimaRaw))] ?? date('F', strtotime($tglDiterimaRaw))) . ' ' .
                       date('Y', strtotime($tglDiterimaRaw));

        $tglCetak = date('d') . ' ' . ($bulanIndo[(int)date('m')] ?? date('F')) . ' ' . date('Y');

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
            $fotoHtml = '<img src="' . $base64 . '" style="width: 100%; height: 100%; object-fit: cover;" />';
        } else {
            $fotoHtml = '<div style="text-align: center; margin-top: 45px; font-size: 11px; color: #555;">Foto<br/>3x4</div>';
        }

        // Kop Header Logo (Kemenag / Bahrul Ulum) & Dynamic Settings
        $settings = \App\Models\Setting::all()->pluck('value', 'key');
        $logoSetting = $settings['logo_pondok'] ?? 'logo.png';
        $alamatPondok = $settings['alamat_pondok'] ?? 'Jl. Tanjung Api-api Km.42 Muliasari, Kecamatan Tanjung Lago, Kabupaten Banyuasin - Sumatera Selatan';
        $noTelp = $settings['no_telp'] ?? '081234567890';
        $kepalaMadrasah = $settings['kepala_madrasah'] ?? 'ROHMAN, S.Pd.I, M.Si';
        $nipKepala = $settings['nip_kepala'] ?? '038201207150004';
        $kotaTerbit = $settings['kota_terbit'] ?? 'Tanjung Lago';

        $logoBase64 = '';
        $possiblePaths = [
            base_path('public/' . $logoSetting),
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

        // School/Madrasah Header title based on jenjang
        $headerMadrasah = "MAS BAHRUL ULUM";
        if ($santri->jenjang === 'MTS') {
            $headerMadrasah = "MTS BAHRUL ULUM";
        } else if ($santri->jenjang === 'PONDOK') {
            $headerMadrasah = "PONPES BAHRUL ULUM";
        }

        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                @page { margin: 25px 35px; }
                body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.35; color: #000; }
                .kop-table { width: 100%; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 2px; border-collapse: collapse; }
                .kop-line-2 { border-bottom: 1px solid #000; margin-bottom: 15px; }
                .header-title { text-align: center; }
                .header-title h3 { margin: 0; font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
                .header-title h2 { margin: 2px 0 0 0; font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
                .header-title p { margin: 2px 0 0 0; font-size: 10pt; font-style: italic; }
                .doc-title { text-align: center; font-size: 14pt; font-weight: bold; margin-top: 15px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
                .detail-table { width: 100%; border-collapse: collapse; font-size: 11pt; }
                .detail-table td { padding: 3px 2px; vertical-align: top; }
                .num-col { width: 28px; text-align: left; }
                .label-col { width: 230px; }
                .sep-col { width: 15px; text-align: center; }
                .sub-num { padding-left: 15px; width: 20px; }
                
                .footer-container { margin-top: 30px; width: 100%; }
                .signature-box { float: right; width: 260px; text-align: center; font-size: 11pt; }
                .bottom-left-box { float: left; width: 300px; margin-top: 10px; }
                .photo-frame { display: inline-block; width: 90px; height: 120px; border: 1px solid #000; vertical-align: bottom; margin-left: 15px; }
                .qr-frame { display: inline-block; width: 100px; height: 100px; vertical-align: bottom; }
                .clear { clear: both; }
            </style>
        </head>
        <body>
            <table class="kop-table">
                <tr>
                    <td style="width: 15%; text-align: center; vertical-align: middle;">
                        ' . ($logoBase64 ? '<img src="' . $logoBase64 . '" style="height: 75px; width: auto;" />' : '') . '
                    </td>
                    <td style="width: 85%; text-align: center; vertical-align: middle;" class="header-title">
                        <h3>KEMENTERIAN AGAMA REPUBLIK INDONESIA</h3>
                        <h2>' . $headerMadrasah . '</h2>
                        <p>' . htmlspecialchars($alamatPondok) . ($noTelp ? ' | Telp: ' . htmlspecialchars($noTelp) : '') . '</p>
                    </td>
                </tr>
            </table>
            <div class="kop-line-2"></div>

            <div class="doc-title">IDENTITAS PESERTA DIDIK</div>

            <table class="detail-table">
                <tr>
                    <td class="num-col">1.</td>
                    <td class="label-col">Nama Peserta Didik</td>
                    <td class="sep-col">:</td>
                    <td>' . strtoupper(htmlspecialchars($santri->nama_lengkap)) . '</td>
                </tr>
                <tr>
                    <td class="num-col">2.</td>
                    <td class="label-col">NIS</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->nis ?? '-') . '</td>
                </tr>
                <tr>
                    <td class="num-col">3.</td>
                    <td class="label-col">NISN</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->nisn ?? '-') . '</td>
                </tr>
                <tr>
                    <td class="num-col">4.</td>
                    <td class="label-col">Tempat Tanggal Lahir</td>
                    <td class="sep-col">:</td>
                    <td>' . strtoupper(htmlspecialchars($santri->tempat_lahir)) . ', ' . $tglLahir . '</td>
                </tr>
                <tr>
                    <td class="num-col">5.</td>
                    <td class="label-col">Jenis Kelamin</td>
                    <td class="sep-col">:</td>
                    <td>' . ($santri->jk === 'L' ? 'Laki-laki' : 'Perempuan') . '</td>
                </tr>
                <tr>
                    <td class="num-col">6.</td>
                    <td class="label-col">Agama</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->agama ?? 'Islam') . '</td>
                </tr>
                <tr>
                    <td class="num-col">7.</td>
                    <td class="label-col">Status dalam Keluarga</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->status_keluarga ?? 'Anak Kandung') . '</td>
                </tr>
                <tr>
                    <td class="num-col">8.</td>
                    <td class="label-col">Anak ke</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->anak_ke ?? '1') . '</td>
                </tr>
                <tr>
                    <td class="num-col">9.</td>
                    <td class="label-col">Alamat Peserta Didik</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->alamat) . '</td>
                </tr>
                <tr>
                    <td class="num-col">10.</td>
                    <td class="label-col">Nomor Telepon Rumah/HP</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->hp_ortu) . '</td>
                </tr>
                <tr>
                    <td class="num-col">11.</td>
                    <td class="label-col">Sekolah Asal</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->sekolah_asal ?? '-') . '</td>
                </tr>
                <tr>
                    <td class="num-col">12.</td>
                    <td colspan="3">Diterima di sekolah ini</td>
                </tr>
                <tr>
                    <td></td>
                    <td class="label-col" style="padding-left: 15px;">a. Di kelas</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->di_kelas_diterima ?? $santri->kelas->nama_kelas ?? '-') . '</td>
                </tr>
                <tr>
                    <td></td>
                    <td class="label-col" style="padding-left: 15px;">b. Pada tanggal</td>
                    <td class="sep-col">:</td>
                    <td>' . $tglDiterima . '</td>
                </tr>
                <tr>
                    <td class="num-col">13.</td>
                    <td colspan="3">Nama Orang Tua</td>
                </tr>
                <tr>
                    <td></td>
                    <td class="label-col" style="padding-left: 15px;">a. Ayah</td>
                    <td class="sep-col">:</td>
                    <td>' . strtoupper(htmlspecialchars($santri->nama_ayah)) . '</td>
                </tr>
                <tr>
                    <td></td>
                    <td class="label-col" style="padding-left: 15px;">b. Ibu</td>
                    <td class="sep-col">:</td>
                    <td>' . strtoupper(htmlspecialchars($santri->nama_ibu)) . '</td>
                </tr>
                <tr>
                    <td class="num-col">14.</td>
                    <td class="label-col">Alamat Orang Tua</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->alamat_ortu ?? $santri->alamat) . '</td>
                </tr>
                <tr>
                    <td class="num-col">15.</td>
                    <td colspan="3">Pekerjaan Orang Tua</td>
                </tr>
                <tr>
                    <td></td>
                    <td class="label-col" style="padding-left: 15px;">a. Ayah</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->pekerjaan_ayah ?? '-') . '</td>
                </tr>
                <tr>
                    <td></td>
                    <td class="label-col" style="padding-left: 15px;">b. Ibu</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->pekerjaan_ibu ?? '-') . '</td>
                </tr>
                <tr>
                    <td class="num-col">16.</td>
                    <td class="label-col">Nama Wali Siswa</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->nama_wali ?? '-') . '</td>
                </tr>
                <tr>
                    <td></td>
                    <td class="label-col" style="padding-left: 15px;">Pekerjaan Wali</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->pekerjaan_wali ?? '-') . '</td>
                </tr>
                <tr>
                    <td></td>
                    <td class="label-col" style="padding-left: 15px;">Alamat Wali Siswa</td>
                    <td class="sep-col">:</td>
                    <td>' . htmlspecialchars($santri->alamat_wali ?? '-') . '</td>
                </tr>
            </table>

            <div class="footer-container">
                <div class="signature-box">
                    ' . htmlspecialchars($kotaTerbit) . ', ' . $tglCetak . '<br/>
                    Kepala Madrasah<br/><br/><br/><br/><br/>
                    <u><strong>' . htmlspecialchars($kepalaMadrasah) . '</strong></u><br/>
                    ' . ($nipKepala ? 'NIP. ' . htmlspecialchars($nipKepala) : '') . '
                </div>

                <div class="bottom-left-box">
                    <div class="qr-frame">
                        ' . ($qrBase64 ? '<img src="' . $qrBase64 . '" style="width: 100px; height: 100px;" />' : '') . '
                    </div>
                    <div class="photo-frame">
                        ' . $fotoHtml . '
                    </div>
                </div>
                <div class="clear"></div>
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
