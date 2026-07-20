<?php

/** @var \Laravel\Lumen\Routing\Router $router */

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
*/

$router->get('/', function () use ($router) {
    return response()->json([
        'name' => 'SIAKAD Pondok Pesantren Bahrul Ulum API',
        'version' => $router->app->version(),
        'status' => 'Running'
    ]);
});

// Guest Perizinan QR Image loader
$router->get('api/perizinan/{id}/qr-code/{type}', 'PerizinanController@getQrImage');

// API Group
$router->group(['prefix' => 'api'], function () use ($router) {
    
    // Auth Routes
    $router->post('auth/login', 'AuthController@login');
    $router->post('auth/register-wali', 'AuthController@registerWali');
    $router->post('auth/register-alumni', 'AuthController@registerAlumni');
    $router->get('settings/public', 'SettingController@getSettings');

    // Public / Guest PPDB Submission
    $router->post('ppdb/register', 'PpdbController@register');
    
    // Public Pengumuman
    $router->get('pengumuman/active', 'SettingController@activePengumuman');

    // Authenticated Routes (Requires JwtMiddleware)
    $router->group(['middleware' => 'auth'], function () use ($router) {
        
        // Profile
        $router->get('auth/profile', 'AuthController@profile');

        // Dashboard
        $router->get('dashboard', 'DashboardController@index');

        // PPDB (Admin)
        $router->group(['middleware' => 'role:superadmin,admin'], function () use ($router) {
            $router->get('ppdb/list', 'PpdbController@index');
            $router->post('ppdb/verify/{id}', 'PpdbController@verify');
        });

        // Santri
        $router->get('santri', 'SantriController@index');
        $router->get('santri/export/csv', [
            'middleware' => 'role:superadmin,admin',
            'uses' => 'SantriController@exportExcel'
        ]);
        $router->get('santri/{id}', 'SantriController@show');
        $router->get('santri/{id}/buku-induk', 'SantriController@printBukuInduk');
        $router->group(['middleware' => 'role:superadmin,admin'], function () use ($router) {
            $router->post('santri', 'SantriController@store');
            $router->post('santri/{id}', 'SantriController@update'); // POST for multipart file upload compatibility
            $router->delete('santri/{id}', 'SantriController@destroy');
        });

        // Wali Santri Management
        $router->group(['middleware' => 'role:superadmin,admin'], function () use ($router) {
            $router->get('walisantri', 'WalisantriController@index');
            $router->post('walisantri', 'WalisantriController@store');
            $router->put('walisantri/{id}', 'WalisantriController@update');
            $router->delete('walisantri/{id}', 'WalisantriController@destroy');
        });

        // Kelas
        $router->get('kelas', 'KelasController@index');
        $router->get('kelas/select', 'KelasController@selectList');
        $router->get('kelas/{id}', 'KelasController@show');
        $router->group(['middleware' => 'role:superadmin,admin'], function () use ($router) {
            $router->post('kelas', 'KelasController@store');
            $router->put('kelas/{id}', 'KelasController@update');
            $router->delete('kelas/{id}', 'KelasController@destroy');
            $router->post('kelas/action/kenaikan', 'KelasController@kenaikanKelas');
            $router->post('kelas/action/mutasi', 'KelasController@mutasiSantri');
        });

        // Raport & Mapel
        $router->get('mapel', 'RaportController@indexMapel');
        $router->get('mapel/select', 'RaportController@selectMapel');
        $router->get('nilai/santri/{santriId}', 'RaportController@getNilaiSantri');
        $router->get('nilai/raport/{santriId}/print', 'RaportController@printRaport');
        $router->group(['middleware' => 'role:superadmin,admin'], function () use ($router) {
            $router->post('mapel', 'RaportController@storeMapel');
            $router->put('mapel/{id}', 'RaportController@updateMapel');
            $router->delete('mapel/{id}', 'RaportController@destroyMapel');
            $router->post('nilai', 'RaportController@inputNilai');
            $router->post('mapel/import', 'RaportController@importMapel');
        });

        // Tagihan & Pembayaran
        $router->get('tagihan', 'TagihanController@index');
        $router->get('jenis-tagihan', 'TagihanController@indexJenis');
        $router->get('jenis-tagihan/select', 'TagihanController@selectJenis');
        $router->get('tagihan/{id}/kuitansi', 'TagihanController@printKuitansi');
        
        $router->group(['middleware' => 'role:walisantri'], function () use ($router) {
            $router->get('tagihan/wali', 'TagihanController@waliTagihan');
            $router->post('tagihan/{id}/bayar', 'TagihanController@bayarTagihan');
        });

        $router->group(['middleware' => 'role:superadmin,admin'], function () use ($router) {
            $router->post('jenis-tagihan', 'TagihanController@storeJenis');
            $router->put('jenis-tagihan/{id}', 'TagihanController@updateJenis');
            $router->delete('jenis-tagihan/{id}', 'TagihanController@destroyJenis');
            $router->post('tagihan/generate', 'TagihanController@generateTagihan');
            $router->post('tagihan/{id}/verifikasi', 'TagihanController@verifikasiPembayaran');
            $router->put('tagihan/{id}', 'TagihanController@updateTagihan');
            $router->delete('tagihan/{id}', 'TagihanController@destroyTagihan');
        });

        // Absensi
        $router->group(['middleware' => 'role:superadmin,admin'], function () use ($router) {
            $router->post('absensi/bulk', 'AbsensiController@storeBulk');
            $router->get('absensi/class', 'AbsensiController@classAttendance');
        });
        $router->group(['middleware' => 'role:walisantri'], function () use ($router) {
            $router->get('absensi/wali', 'AbsensiController@waliAttendance');
        });

        // Pelanggaran
        $router->get('pelanggaran', 'PelanggaranController@index');
        $router->group(['middleware' => 'role:walisantri'], function () use ($router) {
            $router->get('pelanggaran/wali', 'PelanggaranController@waliPelanggaran');
        });
        $router->group(['middleware' => 'role:superadmin,admin'], function () use ($router) {
            $router->post('pelanggaran', 'PelanggaranController@store');
            $router->put('pelanggaran/{id}', 'PelanggaranController@update');
            $router->delete('pelanggaran/{id}', 'PelanggaranController@destroy');
        });

        // Perizinan
        $router->get('perizinan', 'PerizinanController@index');
        $router->group(['middleware' => 'role:walisantri'], function () use ($router) {
            $router->get('perizinan/wali', 'PerizinanController@waliPerizinan');
            $router->post('perizinan/wali', 'PerizinanController@submitIzin');
        });
        $router->group(['middleware' => 'role:superadmin,admin'], function () use ($router) {
            $router->post('perizinan/{id}/verify', 'PerizinanController@verifyIzin');
            $router->post('perizinan/scan', 'PerizinanController@scanQrCode');
        });

        // Alumni
        $router->get('alumni', 'AlumniController@index');
        $router->get('alumni/donasi', 'AlumniController@indexDonasi');
        $router->group(['middleware' => 'role:alumni'], function () use ($router) {
            $router->post('alumni/donasi', 'AlumniController@submitDonasi');
        });
        $router->group(['middleware' => 'role:superadmin,admin'], function () use ($router) {
            $router->post('alumni/donasi/{id}/verifikasi', 'AlumniController@verifikasiDonasi');
            $router->post('alumni', 'AlumniController@store');
            $router->put('alumni/{id}', 'AlumniController@update');
            $router->delete('alumni/{id}', 'AlumniController@destroy');
            $router->get('alumni/accounts', 'AlumniController@listAccounts');
            $router->post('alumni/accounts', 'AlumniController@storeAccount');
            $router->put('alumni/accounts/{id}', 'AlumniController@updateAccount');
            $router->delete('alumni/accounts/{id}', 'AlumniController@destroyAccount');
        });

        // Pengaturan & Master Data
        $router->get('settings', 'SettingController@getSettings');
        $router->get('tahun-ajaran', 'SettingController@indexTahunAjaran');
        $router->get('pengumuman', 'SettingController@indexPengumuman');

        $router->group(['middleware' => 'role:superadmin,admin'], function () use ($router) {
            $router->post('settings', 'SettingController@saveSettings');
            $router->post('tahun-ajaran', 'SettingController@storeTahunAjaran');
            $router->post('tahun-ajaran/{id}/activate', 'SettingController@activateTahunAjaran');
            $router->post('pengumuman', 'SettingController@storePengumuman');
            $router->put('pengumuman/{id}', 'SettingController@updatePengumuman');
            $router->delete('pengumuman/{id}', 'SettingController@destroyPengumuman');
        });

    });
});
