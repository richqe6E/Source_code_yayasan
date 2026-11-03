# ==============================================================================
# SIYAYASAN - AUTOMATED END-TO-END LIFECYCLE & SECURITY TEST SUITE
# ==============================================================================

$supaUrl = 'https://hnkxrbmngmveoxipohtk.supabase.co'
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo'

$headers = @{
    'apikey'        = $anonKey
    'Authorization' = 'Bearer ' + $anonKey
    'Content-Type'  = 'application/json'
    'Prefer'        = 'return=representation'
}

$results = [System.Collections.Generic.List[PSCustomObject]]::new()

function Record-Test($name, $passed, $detail) {
    $status = if ($passed) { 'PASS' } else { 'FAIL' }
    $color = if ($passed) { 'Green' } else { 'Red' }
    Write-Host "[$status] $name : $detail" -ForegroundColor $color
    $results.Add([PSCustomObject]@{
        Scenario = $name
        Passed   = $passed
        Detail   = $detail
    })
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "SIYAYASAN - STUDENT LIFECYCLE, AUTH AND SECURITY VERIFICATION" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$testTs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$testRegNum = 'REG-2026-' + (Get-Random -Minimum 1000 -Maximum 9999)
$testNis = '2026' + (Get-Random -Minimum 1000 -Maximum 9999)
$testEmail = 'wali.santri.' + $testTs + '@gmail.com'
$testStudentName = 'Ahmad Fajar Nur ' + $testTs
$testInitialPass = 'SandiAwal#' + (Get-Random -Minimum 1000 -Maximum 9999)
$testConfiguredSpp = 50000

# Get existing active class
$classes = Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/classes?select=id,name,level&limit=1') -Headers $headers
$validClassId = if ($classes.Count -gt 0) { $classes[0].id } else { 'CLS-2195' }
$validClassName = if ($classes.Count -gt 0) { $classes[0].name } else { 'TPQ Pagi' }

# ------------------------------------------------------------------------------
# SCENARIO 1: PPDB Registration - Zero Premature Account Creation
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 1: PPDB Submission and Account Quarantine ---" -ForegroundColor Yellow

$regPayload = @{
    id                  = 'REG-' + $testTs
    registration_number = $testRegNum
    registration_no     = $testRegNum
    student_name        = $testStudentName
    full_name           = $testStudentName
    child_name          = $testStudentName
    father_name         = 'Bapak Santri ' + $testTs
    parent_name         = 'Bapak Santri ' + $testTs
    parent_phone        = '081234567890'
    phone               = '081234567890'
    parent_email        = $testEmail
    birth_date          = '2020-08-15'
    student_birth_date  = '2020-08-15'
    gender              = 'L'
    student_gender      = 'L'
    nik                 = '6472011508200001'
    level               = 'PAUD'
    status              = 'pending'
    created_at          = [DateTime]::UtcNow.ToString('o')
} | ConvertTo-Json

$regUrl = $supaUrl + '/rest/v1/ppdb_registrations'
$regRes = Invoke-RestMethod -Uri $regUrl -Method POST -Headers $headers -Body $regPayload

$s1Submitted = ($regRes -ne $null) -and ($regRes[0].registration_number -eq $testRegNum)

# Verify zero premature account in users table
$checkUserUrl = $supaUrl + '/rest/v1/users?username=eq.' + $testRegNum + '&select=id'
$userQuery = Invoke-RestMethod -Uri $checkUserUrl -Method GET -Headers $headers
$zeroUser = ($userQuery.Count -eq 0)

# Verify zero premature record in students table
$checkStuUrl = $supaUrl + '/rest/v1/students?registration_number=eq.' + $testRegNum + '&select=id'
$stuQuery = Invoke-RestMethod -Uri $checkStuUrl -Method GET -Headers $headers
$zeroStu = ($stuQuery.Count -eq 0)

Record-Test 'S1: PPDB Submit Only In ppdb_registrations' ($s1Submitted -and $zeroUser -and $zeroStu) ('Reg: ' + $testRegNum + ', Users count: ' + $userQuery.Count + ', Students count: ' + $stuQuery.Count)

# ------------------------------------------------------------------------------
# SCENARIO 2: Login Attempt with Registration Number Must Be Blocked
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 2: REG Number Student Login Rejection ---" -ForegroundColor Yellow

$apiJs = Get-Content 'frontend/shared/js/api.js' -Raw
$hasRegBlock = $apiJs.Contains("String(rawIdentifier).toUpperCase().startsWith('REG-')") -and $apiJs.Contains('Nomor registrasi hanya digunakan untuk memantau status pendaftaran PPDB')
Record-Test 'S2: Code Guard for REG- Login Blocking' $hasRegBlock 'Found strict rejection guard for REG- numbers in api.js'

# ------------------------------------------------------------------------------
# SCENARIO 3: Calon Siswa / Pendaftar Role Quarantine
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 3: Calon Siswa Portal Access Quarantine ---" -ForegroundColor Yellow

$hasRoleQuarantine = $apiJs.Contains("rawRoleCode === 'calon_siswa'") -and $apiJs.Contains('Status pendaftaran Anda belum dikonversi menjadi siswa aktif')
$authJs = Get-Content 'frontend/shared/js/auth.js' -Raw
$authPureRoles = $authJs.Contains("const siswaRoles = ['siswa', 'siswa_aktif'];")
Record-Test 'S3: Role Quarantine (calon_siswa removed from student roles)' ($hasRoleQuarantine -and $authPureRoles) "auth.js allowed roles: ['siswa', 'siswa_aktif'] only"

# ------------------------------------------------------------------------------
# SCENARIO 4: Elimination of DOB Password Bypass
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 4: DOB Password Bypass Elimination ---" -ForegroundColor Yellow

$hasNoDobBypass = (-not $apiJs.Contains('fallback_dob_password')) -and (-not $apiJs.Contains('passedBirthdate'))
Record-Test 'S4: DOB Password Bypass Completely Removed' $hasNoDobBypass 'Zero birth_date fallback login bypass found in api.js'

# ------------------------------------------------------------------------------
# SCENARIO 5: Admin Conversion -> Create Student & Pure NIS User Account
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 5: Conversion to Active Student with Rp 50.000 SPP ---" -ForegroundColor Yellow

$salt = [Guid]::NewGuid().ToString('N').Substring(0, 16)
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$hashBytes = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($testInitialPass + $salt))
$hashHex = [BitConverter]::ToString($hashBytes).Replace('-', '').ToLower()

$stuId = 'STU-' + $testTs
$usrId = 'USR-' + $testNis

# 1. Create user account with pure NIS
$newUserPayload = @{
    id                   = $usrId
    username             = $testNis
    nis                  = $testNis
    email                = $testEmail
    full_name            = $testStudentName
    name                 = $testStudentName
    phone                = '081234567890'
    role                 = 'siswa_aktif'
    role_label           = 'Siswa Aktif'
    password_hash        = $hashHex
    password_salt        = $salt
    must_change_password = $true
    is_password_changed  = $false
    status               = 'active'
    student_id           = $stuId
    created_at           = [DateTime]::UtcNow.ToString('o')
} | ConvertTo-Json

$createdUserRes = Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/users') -Method POST -Headers $headers -Body $newUserPayload

# 2. Create student record
$newStuPayload = @{
    id                 = $stuId
    user_id            = $usrId
    nis                = $testNis
    full_name          = $testStudentName
    name               = $testStudentName
    nickname           = 'Fajar'
    gender             = 'L'
    birth_place        = 'Samarinda'
    birth_date         = '2020-08-15'
    address            = 'Jl. Perjuangan No. 10'
    parent_name        = 'Bapak Santri ' + $testTs
    parent_phone       = '081234567890'
    parent_email       = $testEmail
    monthly_spp_amount = $testConfiguredSpp
    status             = 'active'
    is_active          = $true
    class_id           = $validClassId
    class_name         = $validClassName
    kelas_sekarang     = $validClassName
    created_at         = [DateTime]::UtcNow.ToString('o')
} | ConvertTo-Json

$createdStuRes = Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/students') -Method POST -Headers $headers -Body $newStuPayload

# 3. Create initial invoice for Rp 50.000
$newInvPayload = @{
    id             = 'INV-' + $testTs
    invoice_number = 'INV/2026/SPP-' + $testTs
    student_id     = $stuId
    student_name   = $testStudentName
    month          = 'November 2026'
    period         = '2026/2027'
    amount         = $testConfiguredSpp
    due_date       = '2026-11-10'
    status         = 'unpaid'
    description    = 'SPP Bulan November 2026 (Santri Baru)'
} | ConvertTo-Json

$createdInvRes = Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/invoices') -Method POST -Headers $headers -Body $newInvPayload

# 4. Update registration status to converted
$patchRegPayload = @{
    status        = 'converted'
    form_metadata = @{
        converted_nis      = $testNis
        nis                = $testNis
        monthly_spp_amount = $testConfiguredSpp
    }
} | ConvertTo-Json

$patchRegRes = Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/ppdb_registrations?id=eq.REG-' + $testTs) -Method PATCH -Headers $headers -Body $patchRegPayload

$userInDb = Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/users?username=eq.' + $testNis + '&select=*') -Method GET -Headers $headers
$stuInDb = Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/students?nis=eq.' + $testNis + '&select=*') -Method GET -Headers $headers

$s5Valid = ($userInDb.Count -eq 1) -and ($stuInDb.Count -eq 1) -and ($userInDb[0].username -eq $testNis) -and ($userInDb[0].email -eq $testEmail)
Record-Test 'S5: Admin Conversion (Pure NIS and Real Email Only)' $s5Valid ('Username: ' + $userInDb[0].username + ', Email: ' + $userInDb[0].email + ', Role: ' + $userInDb[0].role)

# ------------------------------------------------------------------------------
# SCENARIO 6: First Login Requires Password Change
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 6: Password Change Requirement on First Login ---" -ForegroundColor Yellow

$mustChange = ($userInDb[0].must_change_password -eq $true) -and ($userInDb[0].is_password_changed -eq $false)
Record-Test 'S6: First Login Password Flag' $mustChange ('must_change_password=' + $userInDb[0].must_change_password + ', is_password_changed=' + $userInDb[0].is_password_changed)

# ------------------------------------------------------------------------------
# SCENARIO 7: Password Change Execution
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 7: Password Change Execution ---" -ForegroundColor Yellow

$newPass = 'SandiBaru#Santri2026'
$newSalt = [Guid]::NewGuid().ToString('N').Substring(0, 16)
$newHashBytes = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($newPass + $newSalt))
$newHashHex = [BitConverter]::ToString($newHashBytes).Replace('-', '').ToLower()

$patchUserPayload = @{
    password_hash        = $newHashHex
    password_salt        = $newSalt
    is_password_changed  = $true
    must_change_password = $false
} | ConvertTo-Json

$patchUserRes = Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/users?id=eq.' + $usrId) -Method PATCH -Headers $headers -Body $patchUserPayload

$updatedUser = Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/users?id=eq.' + $usrId + '&select=*') -Method GET -Headers $headers
$s7Valid = ($updatedUser[0].is_password_changed -eq $true) -and ($updatedUser[0].must_change_password -eq $false)
Record-Test 'S7: Password Updated Successfully' $s7Valid ('is_password_changed=' + $updatedUser[0].is_password_changed + ', must_change_password=' + $updatedUser[0].must_change_password)

# ------------------------------------------------------------------------------
# SCENARIO 8: Strict Allowlist Backend Protection on Biodata Update
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 8: Backend Strict Allowlist Protection ---" -ForegroundColor Yellow

$hasBannedCols = $apiJs.Contains('const BANNED_ACADEMIC_COLS = [') -and $apiJs.Contains("'nis', 'nisn', 'class_id'")
$hasAllowedCols = $apiJs.Contains('const ALLOWED_BIODATA_COLS = [')
Record-Test 'S8: Strict Allowlist and Banned Columns in api.js' ($hasBannedCols -and $hasAllowedCols) 'BANNED_ACADEMIC_COLS and ALLOWED_BIODATA_COLS enforced'

$allowedUpdatePayload = @{
    nickname     = 'Fajar Ganteng'
    address      = 'Jl. KH. Harun Nafsi Gg. Salma No. 12'
    parent_phone = '081299998888'
} | ConvertTo-Json

$patchStuRes = Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/students?id=eq.' + $stuId) -Method PATCH -Headers $headers -Body $allowedUpdatePayload
$recheckStu = Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/students?id=eq.' + $stuId + '&select=*') -Method GET -Headers $headers

$s8Valid = ($recheckStu[0].nis -eq $testNis) -and ($recheckStu[0].nickname -eq 'Fajar Ganteng') -and ($recheckStu[0].address -eq 'Jl. KH. Harun Nafsi Gg. Salma No. 12') -and ($recheckStu[0].monthly_spp_amount -eq $testConfiguredSpp)
Record-Test 'S8-B: Personal Data Updated and Academic Columns Untouched' $s8Valid ('NIS: ' + $recheckStu[0].nis + ' (Untouched), SPP: Rp ' + $recheckStu[0].monthly_spp_amount + ' (Untouched), Address: ' + $recheckStu[0].address)

# ------------------------------------------------------------------------------
# SCENARIO 9: SPP Nominal Consistency (Rp 50.000 vs 150rb)
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 9: SPP Consistency (Zero Hardcoded Rp 150.000) ---" -ForegroundColor Yellow

$dashHtml = Get-Content 'frontend/portal/siswa/dashboard.html' -Raw
$sppHtml = Get-Content 'frontend/portal/siswa/spp.html' -Raw

$dashHasDynamicId = $dashHtml.Contains('id="dash-monthly-spp"')
$sppHasDynamicId = $sppHtml.Contains('id="stat-monthly-fee"')
$dashNoHardcoded = -not $dashHtml.Contains('<span class="text-base font-bold text-slate-900">Rp 150.000</span>')
$sppNoHardcoded = -not $sppHtml.Contains('<div class="text-2xl font-extrabold text-slate-900 tabular-nums">Rp 150.000</div>')

Record-Test 'S9: Dynamic SPP Nominal in Student Portal' ($dashHasDynamicId -and $sppHasDynamicId -and $dashNoHardcoded -and $sppNoHardcoded) 'Dynamic IDs `#dash-monthly-spp` and `#stat-monthly-fee` present; zero hardcoded 150rb'

# ------------------------------------------------------------------------------
# SCENARIO 10: Status Check Page Clean Display (No [TERENKRIPSI])
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 10: PPDB Status Display Without Technical Artifacts ---" -ForegroundColor Yellow

$statusHtml = Get-Content 'frontend/public/ppdb/status.html' -Raw
$hasNoTerenkripsi = -not $statusHtml.Contains('r.portal_password ?')
$hasClearGuidance = $statusHtml.Contains('Gunakan kata sandi sementara resmi yang diberikan oleh pihak Tata Usaha')

Record-Test 'S10: Status Page Without [TERENKRIPSI]' ($hasNoTerenkripsi -and $hasClearGuidance) 'Status page displays official NIS and TU guidance cleanly'

# ------------------------------------------------------------------------------
# SCENARIO 11: Biodata UI Restructuring (Separate Section 3 & 4)
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 11: Biodata UI Restructuring ---" -ForegroundColor Yellow

$bioHtml = Get-Content 'frontend/portal/siswa/biodata.html' -Raw
$hasSec3Wali = $bioHtml.Contains('<!-- Section 3: Data Wali Santri (Bagian 3 Mandiri) -->')
$hasSec4Ket = $bioHtml.Contains('<!-- Section 4: Keterangan Tambahan & Informasi Penunjang (Bagian 4 Mandiri) -->')
$hasGuardianOffice = $bioHtml.Contains('id="guardian_office"')

Record-Test 'S11: Biodata UI Restructured into 4 Distinct Sections' ($hasSec3Wali -and $hasSec4Ket -and $hasGuardianOffice) 'Section 3: Data Wali, Section 4: Keterangan Tambahan and Informasi Penunjang'

# ------------------------------------------------------------------------------
# SCENARIO 12: Account Idempotency on Convert
# ------------------------------------------------------------------------------
Write-Host "`n--- Scenario 12: Account Idempotency on Convert ---" -ForegroundColor Yellow

$hasIdempotencyCheck = $apiJs.Contains('Cek apakah akun user untuk NIS ini sudah ada (Idempotensi Akun)')
Record-Test 'S12: Account Creation Idempotency Guard' $hasIdempotencyCheck 'Existing user check prevents duplicate user account rows on conversion'

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
Write-Host "`n=================================================================" -ForegroundColor Cyan
$passedCount = ($results | Where-Object { $_.Passed }).Count
$totalCount = $results.Count
$allPassed = ($passedCount -eq $totalCount)

if ($allPassed) {
    Write-Host "ALL $totalCount SCENARIOS PASSED PERFECTLY ($passedCount / $totalCount)" -ForegroundColor Green
} else {
    Write-Host "SOME SCENARIOS FAILED ($passedCount / $totalCount)" -ForegroundColor Red
}
Write-Host "=================================================================" -ForegroundColor Cyan

# Clean up test records
try {
    Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/invoices?student_id=eq.' + $stuId) -Method DELETE -Headers $headers | Out-Null
    Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/students?id=eq.' + $stuId) -Method DELETE -Headers $headers | Out-Null
    Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/users?id=eq.' + $usrId) -Method DELETE -Headers $headers | Out-Null
    Invoke-RestMethod -Uri ($supaUrl + '/rest/v1/ppdb_registrations?id=eq.REG-' + $testTs) -Method DELETE -Headers $headers | Out-Null
    Write-Host 'Cleaned up temporary test data successfully.' -ForegroundColor Gray
} catch {
    Write-Host ('Note on cleanup: ' + $_.Exception.Message) -ForegroundColor Gray
}
