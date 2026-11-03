$baseUrl = "http://localhost:8080"
$pages = @("index.html", "profil.html", "agenda.html", "berita.html", "pengumuman.html", "galeri.html", "kontak.html", "ppdb.html", "login.html")

Write-Host "=== AUDIT ASSETS & SEMANTIK HEADING (BUG-001 & BUG-003) ===" -ForegroundColor Cyan

$allPass = $true

# 1. Test logo image direct access via curl
$logoCode = (curl.exe -s -o NUL -w "%{http_code}" "$baseUrl/images/logo.png")
if ($logoCode -eq "200") {
    Write-Host "[PASS] Logo /images/logo.png returned HTTP 200" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Logo /images/logo.png returned HTTP $logoCode" -ForegroundColor Red
    $allPass = $false
}

# 2. Test each public page for HTTP 200 and H1 tag
foreach ($p in $pages) {
    $code = (curl.exe -s -o NUL -w "%{http_code}" "$baseUrl/$p")
    $filePath = "frontend/public/$p"
    if ($code -ne "200" -or -not (Test-Path $filePath)) {
        Write-Host "[FAIL] $p returned HTTP $code" -ForegroundColor Red
        $allPass = $false
        continue
    }
    
    $content = Get-Content $filePath -Raw
    $h1Matches = [regex]::Matches($content, '<h1[\s>]')
    if ($h1Matches.Count -ge 1) {
        Write-Host "[PASS] $p : HTTP 200, Semantic <h1> tag present (Count: $($h1Matches.Count))" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $p : Missing <h1> tag!" -ForegroundColor Red
        $allPass = $false
    }
}

# 3. Check login.html fallback logo path
$loginHtml = Get-Content "frontend/public/login.html" -Raw
if ($loginHtml -match 'onerror="this\.onerror=null;\s*this\.src=\x27/images/logo\.png\x27"') {
    Write-Host "[PASS] login.html fallback logo path correctly set to /images/logo.png" -ForegroundColor Green
} else {
    Write-Host "[FAIL] login.html fallback logo path is invalid!" -ForegroundColor Red
    $allPass = $false
}

if ($allPass) {
    Write-Host "`nFASE 3 VERIFICATION: ALL ASSETS & HEADINGS PASS (100%)" -ForegroundColor Green
} else {
    Write-Host "`nFASE 3 VERIFICATION: FAILED" -ForegroundColor Red
}
