<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Perizinan;
use App\Models\Santri;
use chillerlan\QRCode\QRCode;

class PerizinanController extends Controller
{
    // List permits (Admin)
    public function index(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);
        $status = $request->input('status');

        $query = Perizinan::with('santri.kelas');

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->whereHas('santri', function($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%");
            });
        }

        $perizinans = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $perizinans->items(),
            'pagination' => [
                'page' => $perizinans->currentPage(),
                'limit' => $perizinans->perPage(),
                'total' => $perizinans->total(),
                'totalPages' => $perizinans->lastPage()
            ]
        ]);
    }

    // Wali Santri's permits history
    public function waliPerizinan(Request $request)
    {
        $user = $request->auth;
        $santri = Santri::where('user_id', $user->id)->first();

        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Akun wali santri belum dikaitkan dengan santri.'
            ], 404);
        }

        $perizinans = Perizinan::where('santri_id', $santri->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $perizinans
        ]);
    }

    // Wali Santri requests permit
    public function submitIzin(Request $request)
    {
        $user = $request->auth;
        $santri = Santri::where('user_id', $user->id)->first();

        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Akun wali santri belum dikaitkan dengan santri.'
            ], 404);
        }

        $this->validate($request, [
            'tanggal_mulai' => 'required|date_format:Y-m-d H:i:s',
            'tanggal_selesai' => 'required|date_format:Y-m-d H:i:s|after:tanggal_mulai',
            'alasan' => 'required|string'
        ]);

        $permit = Perizinan::create([
            'santri_id' => $santri->id,
            'tanggal_mulai' => $request->input('tanggal_mulai'),
            'tanggal_selesai' => $request->input('tanggal_selesai'),
            'alasan' => $request->input('alasan'),
            'status' => 'menunggu',
            'status_kembali' => 'belum'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan perizinan berhasil dikirim. Menunggu verifikasi.',
            'data' => $permit
        ], 201);
    }

    // Admin verifies permit (approve/reject)
    public function verifyIzin(Request $request, $id)
    {
        $this->validate($request, [
            'status' => 'required|in:disetujui,ditolak'
        ]);

        $permit = Perizinan::find($id);
        if (!$permit) {
            return response()->json([
                'success' => false,
                'message' => 'Data perizinan tidak ditemukan.'
            ], 404);
        }

        $status = $request->input('status');
        $permit->status = $status;

        if ($status === 'disetujui') {
            // Generate unique QR codes for departure and return
            $permit->qr_code_keluar = 'QR-OUT-' . $permit->id . '-' . rand(1000, 9999);
            $permit->qr_code_kembali = 'QR-IN-' . $permit->id . '-' . rand(1000, 9999);
        }

        $permit->save();

        return response()->json([
            'success' => true,
            'message' => 'Verifikasi perizinan berhasil disimpan.',
            'data' => $permit
        ]);
    }

    // QR scan exit/return processor (mock or scanner target endpoint)
    public function scanQrCode(Request $request)
    {
        $this->validate($request, [
            'qr_code' => 'required|string'
        ]);

        $qrCode = $request->input('qr_code');

        if (strpos($qrCode, 'QR-OUT-') === 0) {
            $permit = Perizinan::where('qr_code_keluar', $qrCode)->first();
            if (!$permit) {
                return response()->json([
                    'success' => false,
                    'message' => 'QR Code keluar tidak valid atau perizinan tidak ditemukan.'
                ], 404);
            }

            if ($permit->status !== 'disetujui') {
                return response()->json([
                    'success' => false,
                    'message' => 'Status perizinan belum disetujui.'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Scan Berhasil. Santri diizinkan KELUAR pondok.',
                'data' => $permit
            ]);
        } 
        
        if (strpos($qrCode, 'QR-IN-') === 0) {
            $permit = Perizinan::where('qr_code_kembali', $qrCode)->first();
            if (!$permit) {
                return response()->json([
                    'success' => false,
                    'message' => 'QR Code kembali tidak valid atau perizinan tidak ditemukan.'
                ], 404);
            }

            if ($permit->status_kembali === 'kembali') {
                return response()->json([
                    'success' => false,
                    'message' => 'Santri sudah tercatat kembali ke pondok.'
                ], 400);
            }

            $permit->status_kembali = 'kembali';
            $permit->tanggal_kembali = date('Y-m-d H:i:s');
            $permit->save();

            return response()->json([
                'success' => true,
                'message' => 'Scan Berhasil. Santri tercatat KEMBALI ke pondok.',
                'data' => $permit
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Format QR Code tidak dikenal.'
        ], 400);
    }

    // Dynamic QR image generator
    public function getQrImage($id, $type)
    {
        $permit = Perizinan::find($id);
        if (!$permit) {
            return response('Not Found', 404);
        }

        $code = ($type === 'keluar') ? $permit->qr_code_keluar : $permit->qr_code_kembali;

        if (!$code) {
            return response('QR Code belum digenerate.', 400);
        }

        // Generate base64 SVG using chillerlan/php-qrcode
        $qrcode = (new QRCode)->render($code);
        $base64 = preg_replace('#^data:[^;]+;base64,#i', '', $qrcode);
        $data = base64_decode($base64);

        return response($data, 200)
            ->header('Content-Type', 'image/svg+xml');
    }
}
