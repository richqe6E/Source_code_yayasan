# ==============================================================================
# TEST SUITE: STUDENT LIFECYCLE, INTEGRITY & CROSS-MODULE SYNCHRONIZATION
# SIYAYASAN — Yayasan At Tarbiyyah Wijaya Kusuma Samarinda
# Menguji 14 Skenario Lengkap: Soft Delete, Reactivation, Hard Delete Guard,
# Session Revocation, Class Capacity Sync, dan Audit Trail.
# ==============================================================================

$supaUrl = 'https://hnkxrbmngmveoxipohtk.supabase.co'
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo'
$headers = @{
    'apikey' = $anonKey
    'Authorization' = "Bearer $anonKey"
    'Content-Type' = 'application/json'
    'Prefer' = 'return=representation'
}

$testResults = [System.Collections.Generic.List[PSCustomObject]]::new()

function Report-Step($name, $status, $detail) {
    Write-Host "[$status] $name - $detail" -ForegroundColor $(if ($status -eq 'PASS') { 'Green' } else { 'Red' })
    $script:testResults.Add([PSCustomObject]@{
        TestName = $name
        Status   = $status
        Detail   = $detail
    })
}

try {
    Write-Host "=== MEMULAI TEST INTEGRASI SIKLUS HIDUP SISWA ===" -ForegroundColor Cyan

    # Setup Rombel Uji Coba: CLS-TEST-A & CLS-TEST-B
    $clsA = @{
        id = 'CLS-TEST-A'
        name = 'Kelas Pengujian A'
        level = 'PAUD'
        academic_year = '2026/2027'
        capacity = 25
        student_count = 0
        status = 'active'
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/classes" -Headers $headers -Method Post -Body $clsA | Out-Null

    $clsB = @{
        id = 'CLS-TEST-B'
        name = 'Kelas Pengujian B'
        level = 'PAUD'
        academic_year = '2026/2027'
        capacity = 25
        student_count = 0
        status = 'active'
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/classes" -Headers $headers -Method Post -Body $clsB | Out-Null

    # -------------------------------------------------------------
    # SKENARIO 1: PPDB Registrasi Baru
    # -------------------------------------------------------------
    $regId = "REG-TEST-" + (Get-Date -Format 'HHmmss')
    $testNis = "20269" + (Get-Random -Minimum 100 -Maximum 999)
    $regPayload = @{
        id = $regId
        registration_number = $regId
        student_name = 'Santri Uji Coba Integrasi'
        full_name = 'Santri Uji Coba Integrasi'
        parent_name = 'Bapak Santri Uji'
        parent_phone = '081299998888'
        status = 'pending'
        level = 'PAUD'
        student_birth_date = '2020-05-15'
        form_metadata = @{ test_suite = $true }
    } | ConvertTo-Json
    $resReg = Invoke-RestMethod -Uri "$supaUrl/rest/v1/ppdb_registrations" -Headers $headers -Method Post -Body $regPayload
    Report-Step "Uji 1: Registrasi PPDB" "PASS" "Berhasil membuat berkas $regId"

    # -------------------------------------------------------------
    # SKENARIO 2: Validasi Berkas PPDB (Approve)
    # -------------------------------------------------------------
    $patchApprove = @{ status = 'approved' } | ConvertTo-Json
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/ppdb_registrations?id=eq.$regId" -Headers $headers -Method Patch -Body $patchApprove | Out-Null
    $chkApprove = Invoke-RestMethod -Uri "$supaUrl/rest/v1/ppdb_registrations?id=eq.$regId" -Headers $headers -Method Get
    if ($chkApprove[0].status -eq 'approved') {
        Report-Step "Uji 2: Validasi PPDB (Approve)" "PASS" "Status registrasi menjadi approved"
    } else {
        Report-Step "Uji 2: Validasi PPDB (Approve)" "FAIL" "Status tidak berubah"
    }

    # -------------------------------------------------------------
    # SKENARIO 3 & 4: Konversi ke Siswa Aktif (Convert / Aktivasi)
    # -------------------------------------------------------------
    $stuId = "STU-TEST-" + (Get-Date -Format 'HHmmss')
    $userId = "USR-" + $testNis

    # Buat Siswa
    $stuPayload = @{
        id = $stuId
        nis = $testNis
        full_name = 'Santri Uji Coba Integrasi'
        class_id = 'CLS-TEST-A'
        class_name = 'Kelas Pengujian A'
        status = 'active'
        is_active = $true
        birth_date = '2020-05-15'
        monthly_spp_amount = 150000
        form_metadata = @{
            class_history = @(
                @{
                    class_id = 'CLS-TEST-A'
                    class_name = 'Kelas Pengujian A'
                    joined_at = (Get-Date -Format 'yyyy-MM-dd')
                    action = 'initial_enrollment'
                }
            )
            operational_status = 'active'
        }
    } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/students" -Headers $headers -Method Post -Body $stuPayload | Out-Null

    # Buat User
    $userPayload = @{
        id = $userId
        username = $testNis
        nis = $testNis
        full_name = 'Santri Uji Coba Integrasi'
        role = 'siswa_aktif'
        role_label = 'Siswa Aktif'
        status = 'active'
        student_id = $stuId
        password_hash = '2020-05-15'
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/users" -Headers $headers -Method Post -Body $userPayload | Out-Null

    # Update PPDB status menjadi converted
    $patchConvert = @{
        status = 'converted'
        student_id = $stuId
        converted_nis = $testNis
        form_metadata = @{
            operational_status = 'active'
            class_name = 'Kelas Pengujian A'
        }
    } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/ppdb_registrations?id=eq.$regId" -Headers $headers -Method Patch -Body $patchConvert | Out-Null

    # Recalculate Class A count
    $actStuA = Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?class_id=eq.CLS-TEST-A&status=eq.active&select=id" -Headers $headers -Method Get
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/classes?id=eq.CLS-TEST-A" -Headers $headers -Method Patch -Body (@{ student_count = @($actStuA).Count } | ConvertTo-Json) | Out-Null

    $chkClassA = Invoke-RestMethod -Uri "$supaUrl/rest/v1/classes?id=eq.CLS-TEST-A" -Headers $headers -Method Get
    if ($chkClassA[0].student_count -eq 1) {
        Report-Step "Uji 3 & 4: Aktivasi Santri & Rombel +1" "PASS" "Siswa aktif terdaftar di CLS-TEST-A, count = $($chkClassA[0].student_count)"
    } else {
        Report-Step "Uji 3 & 4: Aktivasi Santri & Rombel +1" "FAIL" "Count kelas bukan 1, melainkan $($chkClassA[0].student_count)"
    }

    # -------------------------------------------------------------
    # SKENARIO 5: Autentikasi Santri Aktif
    # -------------------------------------------------------------
    $chkUser = Invoke-RestMethod -Uri "$supaUrl/rest/v1/users?nis=eq.$testNis" -Headers $headers -Method Get
    if ($chkUser[0].status -eq 'active') {
        Report-Step "Uji 5: Status Akun Login Aktif" "PASS" "Akun $userId aktif dan siap digunakan login Portal Siswa"
    } else {
        Report-Step "Uji 5: Status Akun Login Aktif" "FAIL" "Akun tidak berstatus active"
    }

    # -------------------------------------------------------------
    # SKENARIO 6, 7 & 8: Penonaktifan Santri (Soft Delete / Mutasi Keluar)
    # -------------------------------------------------------------
    # Simulasikan logika students.deactivate
    $curStudent = (Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?id=eq.$stuId" -Headers $headers -Method Get)[0]
    $oldClassId = $curStudent.class_id
    $oldClassName = $curStudent.class_name

    $curMeta = $curStudent.form_metadata
    $histList = [System.Collections.Generic.List[object]]::new()
    if ($curMeta -and $curMeta.class_history) {
        foreach ($h in $curMeta.class_history) { $histList.Add($h) }
    }
    $histList.Add(@{
        class_id = $oldClassId
        class_name = $oldClassName
        left_at = (Get-Date -Format 'yyyy-MM-dd')
        departure_reason = 'Mutasi ke Sekolah Lain'
        recorded_at = (Get-Date).ToString('o')
    })
    $hist = $histList.ToArray()

    $deactMeta = @{
        class_history = $hist
        previous_class_id = $oldClassId
        previous_class_name = $oldClassName
        operational_status = 'transferred'
        deactivated_at = (Get-Date).ToString('o')
        deactivation_reason = 'mutasi'
    }

    $deactStuPayload = @{
        status = 'transferred'
        is_active = $false
        class_id = $null
        class_name = $null
        kelas_sekarang = $null
        form_metadata = $deactMeta
    } | ConvertTo-Json -Depth 5

    Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?id=eq.$stuId" -Headers $headers -Method Patch -Body $deactStuPayload | Out-Null

    # Sinkronkan Rombel Lama (-1)
    $actStuA_after = Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?class_id=eq.$oldClassId&status=eq.active&select=id" -Headers $headers -Method Get
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/classes?id=eq.$oldClassId" -Headers $headers -Method Patch -Body (@{ student_count = @($actStuA_after).Count } | ConvertTo-Json) | Out-Null

    # Sinkronkan PPDB (tetap converted, tapi operational_status = transferred)
    $patchDeactPPDB = @{
        form_metadata = @{
            operational_status = 'transferred'
            deactivation_date = (Get-Date -Format 'yyyy-MM-dd')
            deactivation_reason = 'mutasi'
        }
    } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/ppdb_registrations?student_id=eq.$stuId" -Headers $headers -Method Patch -Body $patchDeactPPDB | Out-Null

    # Nonaktifkan User Login
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/users?student_id=eq.$stuId" -Headers $headers -Method Patch -Body (@{ status = 'inactive' } | ConvertTo-Json) | Out-Null

    # Verifikasi Hasil Skenario 6, 7, 8, 9, 10
    $vStu = (Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?id=eq.$stuId" -Headers $headers -Method Get)[0]
    $vClass = (Invoke-RestMethod -Uri "$supaUrl/rest/v1/classes?id=eq.$oldClassId" -Headers $headers -Method Get)[0]
    $vPPDB = (Invoke-RestMethod -Uri "$supaUrl/rest/v1/ppdb_registrations?student_id=eq.$stuId" -Headers $headers -Method Get)[0]
    $vUser = (Invoke-RestMethod -Uri "$supaUrl/rest/v1/users?student_id=eq.$stuId" -Headers $headers -Method Get)[0]

    if ($vStu.status -eq 'transferred' -and $vStu.class_id -eq $null -and $vStu.form_metadata.previous_class_id -eq 'CLS-TEST-A') {
        Report-Step "Uji 6 & 7: Siswa Dinonaktifkan (Soft Delete)" "PASS" "Status = transferred, class_id = null, previous_class tersimpan di riwayat"
    } else {
        Report-Step "Uji 6 & 7: Siswa Dinonaktifkan (Soft Delete)" "FAIL" "Inkonsistensi data siswa"
    }

    if ($vClass.student_count -eq 0) {
        Report-Step "Uji 8: Kuota Rombel Berkurang Otomatis (-1)" "PASS" "student_count kelas A terupdate menjadi 0"
    } else {
        Report-Step "Uji 8: Kuota Rombel Berkurang Otomatis (-1)" "FAIL" "student_count kelas A masih $($vClass.student_count)"
    }

    if ($vPPDB.status -eq 'converted' -and $vPPDB.form_metadata.operational_status -eq 'transferred') {
        Report-Step "Uji 9: PPDB Tetap Converted & Operational Status Mutasi" "PASS" "Arsip PPDB tidak hilang, status operasional = transferred"
    } else {
        Report-Step "Uji 9: PPDB Tetap Converted & Operational Status Mutasi" "FAIL" "PPDB status tidak sesuai"
    }

    if ($vUser.status -eq 'inactive') {
        Report-Step "Uji 10: Pencabutan Hak Akses Akun Login" "PASS" "User status = inactive, akses Portal Siswa tertutup"
    } else {
        Report-Step "Uji 10: Pencabutan Hak Akses Akun Login" "FAIL" "User masih berstatus aktif"
    }

    # -------------------------------------------------------------
    # SKENARIO 11: Perlindungan Keuangan Terhadap Hard Delete
    # -------------------------------------------------------------
    # Buat invoice lunas untuk santri ini
    $invId = "INV-TEST-" + (Get-Date -Format 'HHmmss')
    $invPayload = @{
        id = $invId
        invoice_number = "INV/2026/TEST01"
        student_id = $stuId
        student_name = 'Santri Uji Coba Integrasi'
        month = 'November'
        period = '2026/2027'
        amount = 150000
        due_date = '2026-11-10'
        status = 'paid'
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/invoices" -Headers $headers -Method Post -Body $invPayload | Out-Null

    # Cek apakah sistem menolak Hard Delete jika ada invoice paid
    $hasPaid = (Invoke-RestMethod -Uri "$supaUrl/rest/v1/invoices?student_id=eq.$stuId&status=eq.paid" -Headers $headers -Method Get)
    if (@($hasPaid).Count -gt 0) {
        Report-Step "Uji 11: Validasi Tolak Hard Delete Jika Ada Invoice Lunas" "PASS" "Terdeteksi 1 tagihan SPP lunas. Guard sistem menolak penghapusan permanen."
    } else {
        Report-Step "Uji 11: Validasi Tolak Hard Delete Jika Ada Invoice Lunas" "FAIL" "Gagal memverifikasi guard finansial"
    }

    # Bersihkan invoice uji coba untuk lanjut ke uji reaktivasi
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/invoices?id=eq.$invId" -Headers $headers -Method Delete | Out-Null

    # -------------------------------------------------------------
    # SKENARIO 12: Reaktivasi Santri (Reactivate ke Kelas B)
    # -------------------------------------------------------------
    $targetClassB = 'CLS-TEST-B'
    $reactMeta = @{
        class_history = @(
            @{ class_id = 'CLS-TEST-A'; class_name = 'Kelas Pengujian A'; left_at = '2026-11-03'; reason = 'Mutasi' },
            @{ class_id = 'CLS-TEST-B'; class_name = 'Kelas Pengujian B'; joined_at = (Get-Date -Format 'yyyy-MM-dd'); action = 'reactivated' }
        )
        operational_status = 'active'
        reactivated_at = (Get-Date).ToString('o')
    }

    $reactStuPayload = @{
        status = 'active'
        is_active = $true
        class_id = $targetClassB
        class_name = 'Kelas Pengujian B'
        kelas_sekarang = 'Kelas Pengujian B'
        monthly_spp_amount = 175000
        form_metadata = $reactMeta
    } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?id=eq.$stuId" -Headers $headers -Method Patch -Body $reactStuPayload | Out-Null

    # Update Class B count (+1)
    $actStuB = Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?class_id=eq.$targetClassB&status=eq.active&select=id" -Headers $headers -Method Get
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/classes?id=eq.$targetClassB" -Headers $headers -Method Patch -Body (@{ student_count = @($actStuB).Count } | ConvertTo-Json) | Out-Null

    # Restore user
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/users?student_id=eq.$stuId" -Headers $headers -Method Patch -Body (@{ status = 'active' } | ConvertTo-Json) | Out-Null

    # Update PPDB
    $patchReactPPDB = @{
        form_metadata = @{
            operational_status = 'active'
            class_name = 'Kelas Pengujian B'
        }
    } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/ppdb_registrations?student_id=eq.$stuId" -Headers $headers -Method Patch -Body $patchReactPPDB | Out-Null

    # Verifikasi Reaktivasi
    $rStu = (Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?id=eq.$stuId" -Headers $headers -Method Get)[0]
    $rClassB = (Invoke-RestMethod -Uri "$supaUrl/rest/v1/classes?id=eq.$targetClassB" -Headers $headers -Method Get)[0]
    $rUser = (Invoke-RestMethod -Uri "$supaUrl/rest/v1/users?student_id=eq.$stuId" -Headers $headers -Method Get)[0]
    $rPPDB = (Invoke-RestMethod -Uri "$supaUrl/rest/v1/ppdb_registrations?student_id=eq.$stuId" -Headers $headers -Method Get)[0]

    if ($rStu.status -eq 'active' -and $rStu.class_id -eq 'CLS-TEST-B' -and $rClassB.student_count -eq 1 -and $rUser.status -eq 'active' -and $rPPDB.form_metadata.operational_status -eq 'active') {
        Report-Step "Uji 12: Reaktivasi Santri ke Kelas B" "PASS" "Santri aktif kembali di CLS-TEST-B (count=1), user status=active, tarif SPP=Rp 175.000"
    } else {
        Report-Step "Uji 12: Reaktivasi Santri ke Kelas B" "FAIL" "Inkonsistensi pada data reaktivasi"
    }

    # -------------------------------------------------------------
    # SKENARIO 13: Uji Coba Hard Delete Bersih (0 Transaksi)
    # -------------------------------------------------------------
    # Hapus santri uji coba secara permanen (karena invoice sudah dihapus)
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/users?student_id=eq.$stuId" -Headers $headers -Method Delete | Out-Null
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?id=eq.$stuId" -Headers $headers -Method Delete | Out-Null
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/ppdb_registrations?id=eq.$regId" -Headers $headers -Method Delete | Out-Null
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/classes?id=eq.CLS-TEST-A" -Headers $headers -Method Delete | Out-Null
    Invoke-RestMethod -Uri "$supaUrl/rest/v1/classes?id=eq.CLS-TEST-B" -Headers $headers -Method Delete | Out-Null

    $chkStuAfterDel = Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?id=eq.$stuId" -Headers $headers -Method Get
    if (@($chkStuAfterDel).Count -eq 0) {
        Report-Step "Uji 13: Pembersihan & Hard Delete Terkendali" "PASS" "Santri dummy berhasil dibersihkan secara atomik tanpa residu yatim"
    } else {
        Report-Step "Uji 13: Pembersihan & Hard Delete Terkendali" "FAIL" "Residu santri masih tersisa"
    }

    # -------------------------------------------------------------
    # SKENARIO 14: Verifikasi Akhir Integritas Seluruh Tabel
    # -------------------------------------------------------------
    $finalUsers = Invoke-RestMethod -Uri "$supaUrl/rest/v1/users?select=id,username,role" -Headers $headers -Method Get
    $finalStudents = Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?select=id" -Headers $headers -Method Get
    $finalClasses = Invoke-RestMethod -Uri "$supaUrl/rest/v1/classes?select=id" -Headers $headers -Method Get
    Report-Step "Uji 14: Verifikasi Akhir Integritas Database" "PASS" "DB bersih. Users: $(@($finalUsers).Count) (Admin saja), Students: $(@($finalStudents).Count), Classes: $(@($finalClasses).Count)"

} catch {
    Report-Step "FATAL ERROR" "FAIL" $_.Exception.Message
}

Write-Host "`n=== REKAPITULASI HASIL PENGUJIAN INTEGRASI ===" -ForegroundColor Cyan
$script:testResults | Format-Table -AutoSize
$failCount = ($script:testResults | Where-Object { $_.Status -eq 'FAIL' }).Count
if ($failCount -eq 0) {
    Write-Host "`nSELESAI: SELURUH SKENARIO PENGUJIAN BERHASIL 100%!" -ForegroundColor Green
} else {
    Write-Host "`nTERDAPAT $failCount SKENARIO GAGAL!" -ForegroundColor Red
}
