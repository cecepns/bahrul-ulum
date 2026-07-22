<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tagihan;
use App\Models\Pembayaran;
use App\Models\JenisTagihan;
use App\Models\Santri;
use App\Models\TahunAjaran;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Str;

class TagihanController extends Controller
{
    // List bills (Admin)
    public function index(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);
        $status = $request->input('status');
        $jenisTagihanId = $request->input('jenis_tagihan_id');

        $query = Tagihan::with(['santri.kelas', 'jenisTagihan', 'tahunAjaran', 'pembayaran']);

        if ($status) {
            $query->where('status', $status);
        }

        if ($jenisTagihanId) {
            $query->where('jenis_tagihan_id', $jenisTagihanId);
        }

        if ($search) {
            $query->whereHas('santri', function($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%");
            });
        }

        $tagihans = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $tagihans->items(),
            'pagination' => [
                'page' => $tagihans->currentPage(),
                'limit' => $tagihans->perPage(),
                'total' => $tagihans->total(),
                'totalPages' => $tagihans->lastPage()
            ]
        ]);
    }

    // List bills for a single Wali Santri's santri
    public function waliTagihan(Request $request)
    {
        $user = $request->auth;
        $santri = Santri::where('user_id', $user->id)->first();

        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Akun wali santri belum dikaitkan dengan santri mana pun.'
            ], 404);
        }

        $tagihans = Tagihan::with(['jenisTagihan', 'tahunAjaran', 'pembayaran'])
            ->where('santri_id', $santri->id)
            ->orderBy('tanggal_tagihan', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tagihans
        ]);
    }

    // List jenis tagihan
    public function indexJenis(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);

        $query = JenisTagihan::query();

        if ($search) {
            $query->where('nama_tagihan', 'like', "%{$search}%");
        }

        $jenis = $query->orderBy('nama_tagihan', 'asc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $jenis->items(),
            'pagination' => [
                'page' => $jenis->currentPage(),
                'limit' => $jenis->perPage(),
                'total' => $jenis->total(),
                'totalPages' => $jenis->lastPage()
            ]
        ]);
    }

    public function selectJenis(Request $request)
    {
        $search = $request->input('search');
        $query = JenisTagihan::query();
        if ($search) {
            $query->where('nama_tagihan', 'like', "%{$search}%");
        }
        return response()->json([
            'success' => true,
            'data' => $query->orderBy('nama_tagihan', 'asc')->limit(50)->get()
        ]);
    }

    // CRUD Jenis Tagihan
    public function storeJenis(Request $request)
    {
        $this->validate($request, [
            'nama_tagihan' => 'required|string|max:100',
            'nominal' => 'required|numeric|min:0',
            'tipe' => 'required|in:rutin,sekali_bayar'
        ]);

        $jenis = JenisTagihan::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Jenis tagihan berhasil ditambahkan.',
            'data' => $jenis
        ], 201);
    }

    public function updateJenis(Request $request, $id)
    {
        $jenis = JenisTagihan::find($id);
        if (!$jenis) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis tagihan tidak ditemukan.'
            ], 404);
        }

        $this->validate($request, [
            'nama_tagihan' => 'required|string|max:100',
            'nominal' => 'required|numeric|min:0',
            'tipe' => 'required|in:rutin,sekali_bayar'
        ]);

        $jenis->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Jenis tagihan berhasil diperbarui.',
            'data' => $jenis
        ]);
    }

    public function destroyJenis($id)
    {
        $jenis = JenisTagihan::find($id);
        if (!$jenis) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis tagihan tidak ditemukan.'
            ], 404);
        }

        $jenis->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jenis tagihan berhasil dihapus.'
        ]);
    }

    // Generate Tagihan Rutin (SPP) / Insidental for (Semua, Per Kelas, Per Siswa)
    public function generateTagihan(Request $request)
    {
        $this->validate($request, [
            'jenis_tagihan_id' => 'required|integer|exists:jenis_tagihan,id',
            'tanggal_tagihan' => 'required|date',
            'tanggal_jatuh_tempo' => 'required|date',
            'target_type' => 'nullable|in:semua,kelas,siswa',
            'kelas_id' => 'required_if:target_type,kelas|nullable|integer',
            'santri_id' => 'required_if:target_type,siswa|nullable|integer',
        ]);

        $activeTA = TahunAjaran::where('status_aktif', 1)->first();
        if (!$activeTA) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran aktif belum dikonfigurasi.'
            ], 400);
        }

        $jenisTagihanId = $request->input('jenis_tagihan_id');
        $tglTagihan = $request->input('tanggal_tagihan');
        $tglJatuhTempo = $request->input('tanggal_jatuh_tempo');
        $targetType = $request->input('target_type', 'semua');

        $query = Santri::where('status_aktif', 'aktif')->where('status_ppdb', 'approved');

        if ($targetType === 'kelas') {
            $query->where('kelas_id', $request->input('kelas_id'));
        } else if ($targetType === 'siswa') {
            $query->where('id', $request->input('santri_id'));
        }

        $santris = $query->get();

        if ($santris->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada santri aktif yang ditemukan untuk target ini.'
            ], 400);
        }

        $count = 0;
        foreach ($santris as $santri) {
            // Check if tagihan already exists for this santri, tagihan type, and date/month
            $exists = Tagihan::where('santri_id', $santri->id)
                ->where('jenis_tagihan_id', $jenisTagihanId)
                ->where('tahun_ajaran_id', $activeTA->id)
                ->whereMonth('tanggal_tagihan', date('m', strtotime($tglTagihan)))
                ->whereYear('tanggal_tagihan', date('Y', strtotime($tglTagihan)))
                ->exists();

            if (!$exists) {
                Tagihan::create([
                    'santri_id' => $santri->id,
                    'jenis_tagihan_id' => $jenisTagihanId,
                    'tahun_ajaran_id' => $activeTA->id,
                    'status' => 'belum_bayar',
                    'tanggal_tagihan' => $tglTagihan,
                    'tanggal_jatuh_tempo' => $tglJatuhTempo
                ]);
                $count++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Tagihan berhasil digenerate untuk {$count} santri."
        ]);
    }

    // Wali Santri uploads payment confirmation
    public function bayarTagihan(Request $request, $id)
    {
        $tagihan = Tagihan::find($id);
        if (!$tagihan) {
            return response()->json([
                'success' => false,
                'message' => 'Tagihan tidak ditemukan.'
            ], 404);
        }

        $this->validate($request, [
            'nominal_bayar' => 'required|numeric|min:0',
            'tanggal_bayar' => 'required|date',
            'bukti_transfer' => 'required|file|image|max:2048' // image, max 2MB
        ]);

        // Upload bukti transfer
        $uploadPath = base_path('public/uploads-siakad-bahrul-ulum');
        if (!file_exists($uploadPath)) {
            mkdir($uploadPath, 0777, true);
        }

        $file = $request->file('bukti_transfer');
        $filename = Str::random(20) . '.' . $file->getClientOriginalExtension();
        $file->move($uploadPath, $filename);

        // Update / create pembayaran record
        $pembayaran = Pembayaran::updateOrCreate(
            ['tagihan_id' => $tagihan->id],
            [
                'nominal_bayar' => $request->input('nominal_bayar'),
                'tanggal_bayar' => $request->input('tanggal_bayar'),
                'bukti_transfer' => 'uploads-siakad-bahrul-ulum/' . $filename,
                'status_verifikasi' => 'menunggu',
                'alasan_penolakan' => null
            ]
        );

        $tagihan->status = 'menunggu_verifikasi';
        $tagihan->save();

        return response()->json([
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diupload. Menunggu verifikasi admin.',
            'data' => $pembayaran
        ]);
    }

    // Admin verifies payment (approve / reject)
    public function verifikasiPembayaran(Request $request, $id)
    {
        $this->validate($request, [
            'status_verifikasi' => 'required|in:disetujui,ditolak',
            'alasan_penolakan' => 'required_if:status_verifikasi,ditolak|string',
            'catatan_admin' => 'nullable|string'
        ]);

        $pembayaran = Pembayaran::where('tagihan_id', $id)->first();
        if (!$pembayaran) {
            return response()->json([
                'success' => false,
                'message' => 'Data pembayaran tidak ditemukan.'
            ], 404);
        }

        $statusVerifikasi = $request->input('status_verifikasi');
        $pembayaran->status_verifikasi = $statusVerifikasi;
        
        if ($statusVerifikasi === 'disetujui') {
            $pembayaran->alasan_penolakan = null;
            $pembayaran->catatan_admin = $request->input('catatan_admin');
            
            $tagihan = Tagihan::find($id);
            $tagihan->status = 'lunas';
            $tagihan->save();
        } else {
            $pembayaran->alasan_penolakan = $request->input('alasan_penolakan');
            
            $tagihan = Tagihan::find($id);
            $tagihan->status = 'ditolak';
            $tagihan->save();
        }

        $pembayaran->save();

        return response()->json([
            'success' => true,
            'message' => 'Verifikasi pembayaran berhasil disimpan.',
            'data' => $pembayaran
        ]);
    }

    // Cetak Kuitansi Pembayaran PDF using dompdf
    public function printKuitansi(Request $request, $id)
    {
        $tagihan = Tagihan::with(['santri.kelas', 'jenisTagihan', 'pembayaran'])->find($id);
        if (!$tagihan || $tagihan->status !== 'lunas') {
            return response('Kuitansi hanya dapat dicetak untuk tagihan yang sudah lunas.', 400);
        }

        $settings = \App\Models\Setting::all()->pluck('value', 'key');
        $namaPondok = $settings['nama_pondok'] ?? 'Pondok Pesantren Bahrul Ulum Muliasari';
        $alamatPondok = $settings['alamat_pondok'] ?? 'Jl. Tanjung Api-api Km.42 Muliasari, Banyuasin';
        $kotaTerbit = $settings['kota_terbit'] ?? 'Tanjung Lago';
        $logoPondok = $settings['logo_pondok'] ?? 'logo.png';

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

        $html = '
        <html>
        <head>
            <style>
                body { font-family: sans-serif; font-size: 13px; line-height: 1.5; color: #333; }
                .kuitansi-border { border: 2px dashed #333; padding: 20px; position: relative; }
                .title { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 15px; text-decoration: underline; text-transform: uppercase; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                td { padding: 4px 0; vertical-align: top; }
                .label { width: 25%; font-weight: bold; }
                .separator { width: 3%; text-align: center; }
                .value { width: 72%; }
                .nominal-box { background-color: #f2f2f2; border: 1px solid #333; padding: 8px 15px; font-size: 15px; font-weight: bold; float: left; margin-top: 10px; }
                .footer { float: right; text-align: center; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="kuitansi-border">
                <table style="width: 100%; border-bottom: 2px double #333; padding-bottom: 8px; margin-bottom: 15px; border-collapse: collapse;">
                    <tr>
                        <td style="width: 15%; text-align: left; vertical-align: middle; padding: 0;">
                            ' . ($logoBase64 ? '<img src="' . $logoBase64 . '" style="height: 50px; max-width: 70px;" />' : '') . '
                        </td>
                        <td style="width: 85%; text-align: center; vertical-align: middle; padding: 0 40px 0 0;">
                            <h2 style="margin: 0; font-size: 13px; font-weight: bold; text-transform: uppercase; color: #111;">' . htmlspecialchars($namaPondok) . '</h2>
                            <p style="margin: 3px 0 0 0; font-size: 9px; color: #555; font-weight: normal; line-height: 1.2;">' . htmlspecialchars($alamatPondok) . ' | Telp: ' . htmlspecialchars($noTelp) . '</p>
                        </td>
                    </tr>
                </table>

                <div class="title">Kuitansi Pembayaran Resmi</div>

                <table>
                    <tr>
                        <td class="label">No. Kuitansi</td>
                        <td class="separator">:</td>
                        <td class="value"><strong>KUI-' . str_pad($tagihan->id, 6, '0', STR_PAD_LEFT) . '</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Telah Terima Dari</td>
                        <td class="separator">:</td>
                        <td class="value">' . htmlspecialchars($tagihan->santri->nama_lengkap) . ' (Kelas: ' . htmlspecialchars($tagihan->santri->kelas->nama_kelas ?? '-') . ')</td>
                    </tr>
                    <tr>
                        <td class="label">Untuk Pembayaran</td>
                        <td class="separator">:</td>
                        <td class="value">' . htmlspecialchars($tagihan->jenisTagihan->nama_tagihan) . '</td>
                    </tr>
                    <tr>
                        <td class="label">Tanggal Bayar</td>
                        <td class="separator">:</td>
                        <td class="value">' . date('d F Y', strtotime($tagihan->pembayaran->tanggal_bayar)) . '</td>
                    </tr>
                    <tr>
                        <td class="label">Catatan</td>
                        <td class="separator">:</td>
                        <td class="value">' . htmlspecialchars($tagihan->pembayaran->catatan_admin ?? 'Lunas Terverifikasi') . '</td>
                    </tr>
                </table>

                <div style="clear: both; overflow: hidden;">
                    <div class="nominal-box">
                        Rp ' . number_format($tagihan->pembayaran->nominal_bayar, 0, ',', '.') . ',-
                    </div>
                    
                    <div class="footer">
                        ' . htmlspecialchars($kotaTerbit) . ', ' . date('d F Y') . '<br/>
                        Bendahara Pondok,<br/><br/><br/><br/>
                        (......................................)
                    </div>
                </div>
            </div>
        </body>
        </html>
        ';

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A5', 'landscape'); // Landscape A5 fits kuitansi perfectly
        $dompdf->render();

        return response($dompdf->output(), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="Kuitansi_' . $tagihan->id . '.pdf"');
    }

    // Update individual Tagihan
    public function updateTagihan(Request $request, $id)
    {
        $tagihan = Tagihan::find($id);
        if (!$tagihan) {
            return response()->json(['success' => false, 'message' => 'Tagihan tidak ditemukan.'], 404);
        }

        $this->validate($request, [
            'status' => 'required|in:belum_bayar,menunggu_verifikasi,lunas,ditolak',
            'tanggal_tagihan' => 'required|date',
            'tanggal_jatuh_tempo' => 'required|date'
        ]);

        $tagihan->update($request->only(['status', 'tanggal_tagihan', 'tanggal_jatuh_tempo']));

        return response()->json([
            'success' => true,
            'message' => 'Tagihan berhasil diperbarui.',
            'data' => $tagihan
        ]);
    }

    // Delete individual Tagihan
    public function destroyTagihan($id)
    {
        $tagihan = Tagihan::find($id);
        if (!$tagihan) {
            return response()->json(['success' => false, 'message' => 'Tagihan tidak ditemukan.'], 404);
        }

        $tagihan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tagihan berhasil dihapus.'
        ]);
    }
}
