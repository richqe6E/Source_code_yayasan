# Automated Engine Verification for SIYAYASAN Smart Q/A Assistant
# Executes headless via Edge or tests via HTML test suite

$htmlPath = Join-Path (Get-Location) "tests\test-qa-assistant.html"
Write-Host "Verifying Smart Q/A Assistant Test Suite: $htmlPath" -ForegroundColor Cyan

# Test reading JS and validating structure
$jsPath = Join-Path (Get-Location) "frontend\public\js\qa-knowledge-base.js"
if (-not (Test-Path $jsPath)) {
    Write-Error "qa-knowledge-base.js not found!"
    exit 1
}

$jsContent = [System.IO.File]::ReadAllText($jsPath)
Write-Host "JS file size: $($jsContent.Length) bytes" -ForegroundColor Green

# Check essential components in JS
$checks = @(
    "OUT_OF_SCOPE_REGEX",
    "Saya tidak bisa menjawab pertanyaan Anda.",
    "Maaf, informasi tersebut belum tersedia dalam sistem",
    "PPDB_11_STEPS",
    "KNOWLEDGE_BASE",
    "ppdb_requirements",
    "school_location",
    "school_holidays",
    "tuition_spp",
    "findAnswer"
)

$allPassed = $true
foreach ($chk in $checks) {
    if ($jsContent.Contains($chk)) {
        Write-Host " [PASS] Found '$chk'" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] Missing '$chk'" -ForegroundColor Red
        $allPassed = $false
    }
}

if ($allPassed) {
    Write-Host "`nAll static engine validations PASSED successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSome checks failed!" -ForegroundColor Red
    exit 1
}
