<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Setting;
use App\Models\TahunAjaran;
use App\Models\Pengumuman;
use Illuminate\Support\Str;

class SettingController extends Controller
{
    // Fetch all key-value settings
    public function getSettings()
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    // Save key-value settings + handle logo upload
    public function saveSettings(Request $request)
    {
        $inputs = $request->all();

        // Save normal inputs (exclude file fields from default loop)
        foreach ($inputs as $key => $value) {
            if ($key === 'logo_pondok' && $request->hasFile('logo_pondok')) {
                continue; // handled below
            }
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        // Handle logo file upload if present
        if ($request->hasFile('logo_pondok')) {
            $this->validate($request, [
                'logo_pondok' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048'
            ]);

            $file = $request->file('logo_pondok');
            $uploadPath = base_path('public/uploads-siakad-bahrul-ulum');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0777, true);
            }
            $fileName = 'logo_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move($uploadPath, $fileName);
            $logoPath = 'uploads-siakad-bahrul-ulum/' . $fileName;

            Setting::updateOrCreate(
                ['key' => 'logo_pondok'],
                ['value' => $logoPath]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan berhasil disimpan.'
        ]);
    }

    // List Tahun Ajaran
    public function indexTahunAjaran()
    {
        $ta = TahunAjaran::orderBy('tahun', 'desc')->orderBy('semester', 'asc')->get();
        return response()->json([
            'success' => true,
            'data' => $ta
        ]);
    }

    // Create Tahun Ajaran
    public function storeTahunAjaran(Request $request)
    {
        $this->validate($request, [
            'tahun' => 'required|string|max:20',
            'semester' => 'required|in:ganjil,genap'
        ]);

        $ta = TahunAjaran::create([
            'tahun' => $request->input('tahun'),
            'semester' => $request->input('semester'),
            'status_aktif' => 0 // default not active
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tahun ajaran berhasil ditambahkan.',
            'data' => $ta
        ], 201);
    }

    // Activate Tahun Ajaran
    public function activateTahunAjaran($id)
    {
        $ta = TahunAjaran::find($id);
        if (!$ta) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran tidak ditemukan.'
            ], 404);
        }

        // Deactivate all
        TahunAjaran::query()->update(['status_aktif' => 0]);

        // Activate this one
        $ta->status_aktif = 1;
        $ta->save();

        return response()->json([
            'success' => true,
            'message' => 'Tahun ajaran berhasil diaktifkan.',
            'data' => $ta
        ]);
    }

    // CRUD Pengumuman
    public function indexPengumuman(Request $request)
    {
        $limit = $request->input('limit', 10);
        $announcements = Pengumuman::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $announcements->items(),
            'pagination' => [
                'page' => $announcements->currentPage(),
                'limit' => $announcements->perPage(),
                'total' => $announcements->total(),
                'totalPages' => $announcements->lastPage()
            ]
        ]);
    }

    public function activePengumuman()
    {
        $announcements = Pengumuman::where('status_aktif', 1)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $announcements
        ]);
    }

    public function storePengumuman(Request $request)
    {
        $user = $request->auth;

        $this->validate($request, [
            'judul' => 'required|string|max:200',
            'konten' => 'required|string',
            'status_aktif' => 'required|boolean'
        ]);

        $announcement = Pengumuman::create([
            'judul' => $request->input('judul'),
            'konten' => $request->input('konten'),
            'status_aktif' => $request->input('status_aktif'),
            'created_by' => $user->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil diterbitkan.',
            'data' => $announcement
        ], 201);
    }

    public function updatePengumuman(Request $request, $id)
    {
        $announcement = Pengumuman::find($id);
        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan.'
            ], 404);
        }

        $this->validate($request, [
            'judul' => 'required|string|max:200',
            'konten' => 'required|string',
            'status_aktif' => 'required|boolean'
        ]);

        $announcement->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil diperbarui.',
            'data' => $announcement
        ]);
    }

    public function destroyPengumuman($id)
    {
        $announcement = Pengumuman::find($id);
        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan.'
            ], 404);
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dihapus.'
        ]);
    }

}
