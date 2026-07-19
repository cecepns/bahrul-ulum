<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Santri;
use App\Models\Tagihan;
use App\Models\Pembayaran;
use App\Models\Pelanggaran;
use App\Models\Absensi;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->auth;

        if ($user->role === 'walisantri') {
            return $this->waliDashboard($user);
        }

        if ($user->role === 'alumni') {
            return $this->alumniDashboard($user);
        }

        // Admin and Superadmin Dashboard stats
        $totalSantri = Santri::where('status_aktif', 'aktif')->count();
        $totalPutra = Santri::where('jk', 'L')->where('status_aktif', 'aktif')->count();
        $totalPutri = Santri::where('jk', 'P')->where('status_aktif', 'aktif')->count();
        
        $totalPendaftar = Santri::where('status_ppdb', 'pending')->count();
        
        // Financials current month
        $currentMonth = date('m');
        $currentYear = date('Y');
        
        $totalUangMasuk = DB::table('pembayaran')
            ->where('status_verifikasi', 'disetujui')
            ->whereMonth('tanggal_bayar', $currentMonth)
            ->whereYear('tanggal_bayar', $currentYear)
            ->sum('nominal_bayar');

        $totalUangBelumVerifikasi = DB::table('pembayaran')
            ->where('status_verifikasi', 'menunggu')
            ->sum('nominal_bayar');

        $santriBelumBayar = Tagihan::where('status', 'belum_bayar')->count();

        // Monthly registration chart data (PPDB registration counts per month)
        $ppdbChart = DB::table('santri')
            ->select(DB::raw("DATE_FORMAT(tanggal_daftar, '%M') as month"), DB::raw('count(*) as count'))
            ->groupBy(DB::raw("DATE_FORMAT(tanggal_daftar, '%m')"), DB::raw("DATE_FORMAT(tanggal_daftar, '%M')"))
            ->orderBy(DB::raw("DATE_FORMAT(tanggal_daftar, '%m')"))
            ->get();

        // Payments chart data
        $paymentChart = DB::table('pembayaran')
            ->select(DB::raw("DATE_FORMAT(tanggal_bayar, '%M') as month"), DB::raw('sum(nominal_bayar) as amount'))
            ->where('status_verifikasi', 'disetujui')
            ->groupBy(DB::raw("DATE_FORMAT(tanggal_bayar, '%m')"), DB::raw("DATE_FORMAT(tanggal_bayar, '%M')"))
            ->orderBy(DB::raw("DATE_FORMAT(tanggal_bayar, '%m')"))
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'total_santri' => $totalSantri,
                    'total_putra' => $totalPutra,
                    'total_putri' => $totalPutri,
                    'total_pendaftar' => $totalPendaftar,
                    'uang_masuk_bulan_ini' => (float)$totalUangMasuk,
                    'uang_belum_verifikasi' => (float)$totalUangBelumVerifikasi,
                    'tagihan_belum_bayar' => $santriBelumBayar
                ],
                'charts' => [
                    'ppdb' => $ppdbChart,
                    'payment' => $paymentChart
                ]
            ]
        ]);
    }

    private function waliDashboard($user)
    {
        $santri = Santri::where('user_id', $user->id)->first();

        if (!$santri) {
            return response()->json([
                'success' => true,
                'data' => [
                    'has_santri' => false,
                    'message' => 'Akun belum ditautkan ke data santri.'
                ]
            ]);
        }

        // Stats for specific santri
        $absensiHadir = Absensi::where('santri_id', $santri->id)->where('status', 'hadir')->count();
        $absensiIzin = Absensi::where('santri_id', $santri->id)->where('status', 'izin')->count();
        $absensiSakit = Absensi::where('santri_id', $santri->id)->where('status', 'sakit')->count();
        $absensiAlpha = Absensi::where('santri_id', $santri->id)->where('status', 'alpha')->count();
        
        $totalPelanggaran = Pelanggaran::where('santri_id', $santri->id)->count();
        $totalPoin = Pelanggaran::where('santri_id', $santri->id)->sum('point');
        
        $tagihanBelumBayar = Tagihan::where('santri_id', $santri->id)->whereIn('status', ['belum_bayar', 'ditolak'])->count();

        return response()->json([
            'success' => true,
            'data' => [
                'has_santri' => true,
                'santri' => $santri,
                'stats' => [
                    'absensi' => [
                        'hadir' => $absensiHadir,
                        'izin' => $absensiIzin,
                        'sakit' => $absensiSakit,
                        'alpha' => $absensiAlpha,
                    ],
                    'pelanggaran' => [
                        'total' => $totalPelanggaran,
                        'poin' => (int)$totalPoin,
                    ],
                    'tagihan_belum_bayar' => $tagihanBelumBayar
                ]
            ]
        ]);
    }

    private function alumniDashboard($user)
    {
        $santri = Santri::where('user_id', $user->id)->first();
        
        $totalDonasi = DB::table('alumni_donasi')
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->sum('nominal');

        return response()->json([
            'success' => true,
            'data' => [
                'alumni' => $santri,
                'stats' => [
                    'total_donasi' => (float)$totalDonasi
                ]
            ]
        ]);
    }
}
