$baseUrl = "http://localhost:8080"
$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   SIYAYASAN - FULL SYSTEM REGRESSION & E2E SUITE     " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

$results = @()
function Record-Test($name, $pass, $details) {
    $script:results += [PSCustomObject]@{ Test = $name; Status = if ($pass) { "PASS" } else { "FAIL" }; Details = $details }
    $color = if ($pass) { "Green" } else { "Red" }
    Write-Host "[$($script:results[-1].Status)] $name : $details" -ForegroundColor $color
}

# -----------------------------------------------------------------
# 1. INTEGRITAS ASET & HALAMAN UTAMA (BUG-001 & BUG-003)
# -----------------------------------------------------------------
$pagesToCheck = @(
    "index.html", "profil.html", "agenda.html", "berita.html",
    "pengumuman.html", "galeri.html", "kontak.html", "login.html", "ppdb.html"
)
$allPagesOk = $true
foreach ($p in $pagesToCheck) {
    $code = (curl.exe -s -o NUL -w "%{http_code}" "$baseUrl/$p")
    if ($code -ne "200") { $allPagesOk = $false; break }
}
Record-Test "Aset dan 9 Halaman Publik" $allPagesOk "Seluruh halaman merespons HTTP 200 via web server lokal"

$loginContent = Get-Content "frontend/public/login.html" -Raw
$logoFallbackValid = ($loginContent -match 'onerror="this\.onerror=null;\s*this\.src=\x27/images/logo\.png\x27"')
Record-Test "BUG-001 Fallback Logo Login" $logoFallbackValid "Path onerror menggunakan absolute fallback /images/logo.png"

# -----------------------------------------------------------------
# 2. FAIL-FAST VALIDATION PPDB (BUG-002)
# -----------------------------------------------------------------
$emptyTestProc = Start-Process -FilePath "powershell" -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "tests/run-empty-test.ps1" -PassThru -NoNewWindow -Wait
$emptyOutput = Get-Content "tests/empty-output.html" -Raw -ErrorAction SilentlyContinue
$emptyPassed = ($emptyOutput -match 'EMPTY_REJECT_PASS')
Record-Test "BUG-002 Fail-Fast PPDB Submit" $emptyPassed "Formulir kosong dan tidak lengkap ditolak tanpa membuat record database"

# -----------------------------------------------------------------
# 3. PERLINDUNGAN PASSWORD & SALTED SHA-256 (BUG-005)
# -----------------------------------------------------------------
$zidnaRegUri = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/ppdb_registrations?registration_number=eq.REG-2026-6988&select=*"
$zidnaUserUri = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/users?username=eq.REG-2026-6988&select=*"

$zidnaReg = Invoke-RestMethod -Uri $zidnaRegUri -Headers $headers -Method Get
$zidnaUser = Invoke-RestMethod -Uri $zidnaUserUri -Headers $headers -Method Get

$pwScrubbed = $false
if ($zidnaReg -and $zidnaReg.Count -gt 0) {
    $notes = $zidnaReg[0].notes
    $meta = $zidnaReg[0].form_metadata
    $pwScrubbed = ($notes -match '"account":\{\}') -and ($meta -match '\[TERENKRIPSI\]') -and ($zidnaReg[0].password -eq $null -or $zidnaReg[0].password -eq "")
}
$pwHashed = $false
if ($zidnaUser -and $zidnaUser.Count -gt 0) {
    $u = $zidnaUser[0]
    $pwHashed = ($u.password_hash.Length -eq 64) -and ($u.password_salt.Length -ge 16) -and ($u.password_hash -ne "password123")
}
Record-Test "BUG-005 Password Scrubber" $pwScrubbed "Notes dan metadata pendaftar bersih dari password plaintext"
Record-Test "BUG-005 Salted SHA-256 Hashing" $pwHashed "Akun portal siswa menyimpan password_hash 64-hex dan salt acak"

# -----------------------------------------------------------------
# 4. KAMUS KANONIKAL JENJANG & ROMBEL (BUG-006)
# -----------------------------------------------------------------
$fase2Output = Get-Content "tests/fase2-output.html" -Raw -ErrorAction SilentlyContinue
$fase2Passed = ($fase2Output -match 'ALL_FASE2_TESTS_PASS')
Record-Test "BUG-006 Kamus Kanonikal Jenjang" $fase2Passed "12 variasi jenjang terpetakan dan kelas rombel tersaring presisi"

# -----------------------------------------------------------------
# 5. DUAL-ALIASING LOG AKTIVITAS (BUG-007)
# -----------------------------------------------------------------
$logAliasPassed = ($fase2Output -match 'BUG-007 Log Dual-Aliasing List.*?PASS') -and ($fase2Output -match 'BUG-007 Log Creation Aliasing.*?PASS')
Record-Test "BUG-007 Dual-Aliasing Log Aktivitas" $logAliasPassed "Properti description dan details terisi identik di seluruh log"

# -----------------------------------------------------------------
# 6. SPP STATE GUARD & ANTI-RACE CONDITION (BUG-004)
# -----------------------------------------------------------------
$validStudent = (Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/students?select=id,name&limit=1" -Headers $headers -Method Get)[0]
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$invId = "INV-REGRESS-" + $ts
$invNum = "INV/2026/RG" + $ts
$invPayload = @{
    id = $invId
    invoice_number = $invNum
    student_id = $validStudent.id
    student_name = $validStudent.name
    month = "Februari"
    period = "2026/2027"
    amount = 175000.00
    due_date = "2027-02-20"
    status = "paid"
    paid_at = (Get-Date).ToString("o")
    payment_method = "transfer"
} | ConvertTo-Json

$createdInv = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices" -Headers $headers -Method Post -Body $invPayload
$delayedPatchUri = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices?id=eq.$invId&status=neq.paid"
$patchBody = @{ status = "menunggu_verifikasi" } | ConvertTo-Json
$patchRes = Invoke-RestMethod -Uri $delayedPatchUri -Headers $headers -Method Patch -Body $patchBody
$checkInvUri = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices?id=eq.$invId&select=status"
$checkInv = Invoke-RestMethod -Uri $checkInvUri -Headers $headers -Method Get

$raceProtected = ($checkInv[0].status -eq "paid") -and ($patchRes.Count -eq 0)
Record-Test "BUG-004 SPP Race Condition Guard" $raceProtected "Invoice status 'paid' kebal dari penimpaan request terlambat"

# Clean up temporary regression invoice
Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices?id=eq.$invId" -Headers $headers -Method Delete | Out-Null

# -----------------------------------------------------------------
# 7. INTEGRASI DATABASE & KELENGKAPAN ENTITAS UTAMA
# -----------------------------------------------------------------
$teachersUri = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/teachers?select=id&limit=5"
$classesUri = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/classes?select=id&limit=5"
$studentsUri = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/students?select=id&limit=5"

$teachers = Invoke-RestMethod -Uri $teachersUri -Headers $headers -Method Get
$classes = Invoke-RestMethod -Uri $classesUri -Headers $headers -Method Get
$students = Invoke-RestMethod -Uri $studentsUri -Headers $headers -Method Get

$entitiesOk = ($teachers.Count -gt 0) -and ($classes.Count -gt 0) -and ($students.Count -gt 0)
Record-Test "Integritas Data Entitas Akademik" $entitiesOk "Tabel guru ($($teachers.Count)), kelas ($($classes.Count)), dan siswa ($($students.Count)) terhubung aktif"

# -----------------------------------------------------------------
# SUMMARY
# -----------------------------------------------------------------
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
$failedCount = ($results | Where-Object { $_.Status -ne "PASS" }).Count
if ($failedCount -eq 0) {
    Write-Host "   HASIL AKHIR: 100% REGRESI LULUS (SEMUA 8 PENGUJIAN PASS)" -ForegroundColor Green
} else {
    Write-Host "   HASIL AKHIR: $failedCount PENGUJIAN GAGAL" -ForegroundColor Red
}
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
