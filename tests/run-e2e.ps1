$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$testHtml = "file:///" + (Resolve-Path "tests/test-qa-e2e.html").Path.Replace("\", "/")
$userDataDir = [System.IO.Path]::Combine($env:TEMP, "edge-e2e-" + [System.Guid]::NewGuid().ToString())

Write-Host "Launching Edge Headless against E2E: $testHtml" -ForegroundColor Cyan

if (Test-Path "tests/e2e-output.html") {
    Remove-Item "tests/e2e-output.html" -Force
}

$process = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless",
    "--dump-dom",
    "--virtual-time-budget=3000",
    "--user-data-dir=$userDataDir",
    "--disable-gpu",
    $testHtml
) -PassThru -NoNewWindow -RedirectStandardOutput "tests/e2e-output.html" -RedirectStandardError "tests/e2e-error.log"

$process.WaitForExit(10000)
Start-Sleep -Seconds 1

if (Test-Path "tests/e2e-output.html") {
    $html = Get-Content "tests/e2e-output.html" -Raw
    Write-Host "E2E Output length: $($html.Length) chars"
    if ($html -match '<title>(.*?)</title>') {
        Write-Host "E2E TITLE: $($matches[1])" -ForegroundColor Yellow
    }
    if ($html -match 'id="log"[^>]*>(.*?)</div>') {
        Write-Host "E2E LOG OUTPUT:" -ForegroundColor White
        Write-Host $matches[1] -ForegroundColor Gray
    }
    if ($html -match 'E2E_PASS_ALL') {
        Write-Host "E2E INTERFACE & INTERACTION TESTS PASSED 100%!" -ForegroundColor Green
    } else {
        Write-Host "E2E FAILED OR INCOMPLETE" -ForegroundColor Red
    }
} else {
    Write-Host "No E2E output generated!" -ForegroundColor Red
}

if (Test-Path $userDataDir) {
    Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
}
