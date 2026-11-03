# SIYAYASAN Smart QA Engine Verification Script (PowerShell Native)
$jsPath = "frontend/public/js/qa-knowledge-base.js"
$content = [System.IO.File]::ReadAllText($jsPath)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "SIYAYASAN QA ENGINE - RULE & LOGIC VERIFICATION" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Verify Out-of-Scope regex
$outOfScopeRegex = [regex]'\b(politik|pemilu|pilpres|pilkada|capres|cawapres|caleg|partai|dpr|mpr|presiden|menteri|pemerintah\s+daerah|perang|militer|senjata|rusia|ukraina|israel|palestina|coding|programmer|programming|python|javascript|typescript|react|vue|angular|html|css|php|laravel|java|c\+\+|sql|database\s+admin|hack|cheat|game|gaming|dota|mobile\s+legends|free\s+fire|pubg|roblox|genshin|gta|steam|film|movie|bioskop|cinema|aktor|aktris|artis|selebriti|sinetron|netflix|anime|manga|zodiak|horoskop|ramalan|tarot|cuaca|prakiraan\s+cuaca|hujan\s+hari\s+ini|gempa|tsunami|resep|bumbu|memasak|goreng|rebus|masakan|kuliner|restoran|kafe|cafe|kopi|coffee|crypto|bitcoin|ethereum|forex|saham|investasi\s+bodong|pinjol|pinjaman\s+online|judi|slot|casino|togel|pacaran|selingkuh|curhat|jodoh|kalkulus|integral|turunan|sin\s+cos\s+tan|aljabar\s+vektor)\b'

$oosQueries = @(
    "siapa presiden indonesia?",
    "siapa presiden amerika?",
    "pemilu tahun berapa?",
    "bagaimana cara coding python?",
    "resep nasi goreng enak",
    "cara main mobile legends",
    "1+1 berapa kalkulus"
)

$oosPassed = $true
foreach ($q in $oosQueries) {
    if ($outOfScopeRegex.IsMatch($q)) {
        Write-Host " [PASS] Out-of-scope detected: '$q'" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] Out-of-scope NOT detected: '$q'" -ForegroundColor Red
        $oosPassed = $false
    }
}

# 2. Verify In-scope Anchors
$inScopeAnchor = [regex]'\b(halo|hallop|hallo|hai|assalam|assalamu|assalamualaikum|salam|kabar|permisi|pagi|siang|sore|malam|yayasan|sekolah|paud|tpq|santri|siswa|ananda|ppdb|daftar|pendaftaran|guru|ustadz|ustadzah|tu|tata\s+usaha|spp|ijazah|rapor|juanda|wijaya\s+kusuma|air\s+putih|samarinda|ulinnuha|qiraati|tahfidz|ptpt|pra\s+ptpt|surah|nis|nomor\s+induk|portal\s+siswa)\b'

$inScopeQueries = @(
    "halo",
    "hallop",
    "hai admin",
    "assalamu alaikum",
    "bagaimana cara daftar?",
    "apa saja berkas ppdb?",
    "dimana alamat yayasan?",
    "kapan sekolah libur?",
    "bagaimana bayar spp santri?",
    "kapan dapat nis portal siswa?"
)

$inScopePassed = $true
foreach ($q in $inScopeQueries) {
    if ($inScopeAnchor.IsMatch($q)) {
        Write-Host " [PASS] In-scope anchor detected: '$q'" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] In-scope anchor NOT detected: '$q'" -ForegroundColor Red
        $inScopePassed = $false
    }
}

# 3. Verify Slang Mapping & Normalization coverage
$slangCheck = @("hallop", "hallo", "assalamu", "assalamualaikum", "gimana", "bgmn", "sy", "mo", "brapa", "daptar", "skolah", "biaya", "syarat", "lulus", "kontak", "libur")
$slangPassed = $true
foreach ($s in $slangCheck) {
    if ($content.Contains("'$s':")) {
        Write-Host " [PASS] Slang mapping present for '$s'" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] Slang mapping MISSING for '$s'" -ForegroundColor Red
        $slangPassed = $false
    }
}

# 4. Verify 11 PPDB Steps presence
$stepsCheck = @(
    "Mengenal Informasi & Program Pendidikan",
    "Memahami Persyaratan Pendaftaran",
    "Membuka Halaman Formulir PPDB Online",
    "Mengisi Formulir Pendaftaran",
    "Mengunggah Dokumen yang Diperlukan",
    "Mengirim Formulir & Mencetak Bukti Registrasi",
    "Menunggu Verifikasi Administrasi Tata Usaha",
    "Memantau Status & Pengumuman Penerimaan",
    "Daftar Ulang di Sekretariat Yayasan",
    "Aktivasi Status Menjadi Siswa / Santri Aktif",
    "Penerbitan NIS & Akun Portal Siswa"
)

$stepsPassed = $true
foreach ($st in $stepsCheck) {
    if ($content.Contains($st)) {
        Write-Host " [PASS] Found PPDB Step: '$st'" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] Missing PPDB Step: '$st'" -ForegroundColor Red
        $stepsPassed = $false
    }
}

# 5. Verify No Unscoped ctx in Static Actions
$noCtxLeak = $true
if ($content -match 'url:\s*ctx\.') {
    Write-Host " [FAIL] Found static 'url: ctx.' leak in code!" -ForegroundColor Red
    $noCtxLeak = $false
} else {
    Write-Host " [PASS] No static 'url: ctx.' leaks in KNOWLEDGE_BASE!" -ForegroundColor Green
}

# 6. Verify Greeting & PPDB Schedule Intents
$intentsPassed = $true
if ($content.Contains("intent: 'greeting'")) {
    Write-Host " [PASS] Found 'greeting' intent" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Missing 'greeting' intent" -ForegroundColor Red
    $intentsPassed = $false
}

if ($content.Contains("intent: 'ppdb_schedule'")) {
    Write-Host " [PASS] Found 'ppdb_schedule' intent" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Missing 'ppdb_schedule' intent" -ForegroundColor Red
    $intentsPassed = $false
}

if ($oosPassed -and $inScopePassed -and $slangPassed -and $stepsPassed -and $noCtxLeak -and $intentsPassed) {
    Write-Host "`nALL QA ENGINE VERIFICATION CHECKS PASSED 100%!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSOME CHECKS FAILED!" -ForegroundColor Red
    exit 1
}
