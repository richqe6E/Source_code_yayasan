$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$userDataDir = [System.IO.Path]::Combine($env:TEMP, "edge-e2e-" + [System.Guid]::NewGuid().ToString())
$outFile = "tests/e2e-sim-output.html"
$errFile = "tests/e2e-sim-err.log"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Launching Headless Edge for Full E2E Simulation..." -ForegroundColor Cyan
Write-Host "Target: http://localhost:8080/tests/test-full-e2e.html" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless",
    "--dump-dom",
    "--virtual-time-budget=12000",
    "--user-data-dir=$userDataDir",
    "--disable-gpu",
    "http://localhost:8080/tests/test-full-e2e.html"
) -PassThru -NoNewWindow -RedirectStandardOutput $outFile -RedirectStandardError $errFile

$proc.WaitForExit(20000)
Start-Sleep -Seconds 2

if (Test-Path $outFile) {
    $dom = Get-Content $outFile -Raw
    Write-Host "`nDOM Output length: $($dom.Length)" -ForegroundColor Gray
    if ($dom -match '<pre id="log"[^>]*>([\s\S]*?)</pre>') {
        Write-Host "`nE2E SIMULATION LOG OUTPUT:" -ForegroundColor White
        Write-Host $matches[1] -ForegroundColor White
    }
    if ($dom -match 'E2E_PASS') {
        Write-Host "`nSUCCESS! ALL END-TO-END TESTS PASSED 100%!" -ForegroundColor Green
    } elseif ($dom -match 'E2E_PARTIAL') {
        Write-Host "`nPARTIAL! Some tests passed, some failed or require inspection." -ForegroundColor Yellow
    } else {
        Write-Host "`nFAILED OR TIMEOUT! Review logs for details." -ForegroundColor Red
    }
} else {
    Write-Host "No output generated!" -ForegroundColor Red
}

if (Test-Path $userDataDir) {
    Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
}

