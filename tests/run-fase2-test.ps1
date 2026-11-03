$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$userDataDir = [System.IO.Path]::Combine($env:TEMP, "edge-fase2-" + [System.Guid]::NewGuid().ToString())
$outFile = "tests/fase2-output.html"

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless",
    "--dump-dom",
    "--virtual-time-budget=4000",
    "--user-data-dir=$userDataDir",
    "--disable-gpu",
    "http://localhost:8080/tests/test-fase2.html"
) -PassThru -NoNewWindow -RedirectStandardOutput $outFile

$proc.WaitForExit(10000)
Start-Sleep -Seconds 1

if (Test-Path $outFile) {
    $dom = Get-Content $outFile -Raw
    if ($dom -match 'ALL_FASE2_TESTS_PASS') {
        Write-Host "FASE 2 VERIFICATION RESULT: SUCCESS (ALL TESTS PASS)" -ForegroundColor Green
    } else {
        Write-Host "FASE 2 VERIFICATION RESULT: FAILED" -ForegroundColor Red
    }
    # Print list items
    $matches = [regex]::Matches($dom, '<li.*?>(.*?)</li>')
    foreach ($m in $matches) {
        $clean = $m.Groups[1].Value -replace '<.*?>', ''
        Write-Host "  - $clean"
    }
} else {
    Write-Host "Output file not found" -ForegroundColor Red
}

if (Test-Path $userDataDir) {
    Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
}

