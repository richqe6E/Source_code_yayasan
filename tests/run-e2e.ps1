$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$testHtml = "file:///" + (Resolve-Path "tests/test-qa-e2e.html").Path.Replace("\", "/")
$userDataDir = [System.IO.Path]::Combine($env:TEMP, "edge-e2e-" + [System.Guid]::NewGuid().ToString())

Write-Host "Running E2E UI Test against: $testHtml" -ForegroundColor Cyan

$process = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--dump-dom",
    "--virtual-time-budget=4000",
    "--user-data-dir=$userDataDir",
    "--disable-gpu",
    $testHtml
) -PassThru -NoNewWindow -RedirectStandardOutput "tests/e2e-output.html" -RedirectStandardError "tests/e2e-error.log"

$process.WaitForExit(8000)
Start-Sleep -Milliseconds 1500

if (Test-Path "tests/e2e-output.html") {
    $html = [System.IO.File]::ReadAllText("tests/e2e-output.html")
    if ($html -match '<title>(.*?)</title>') {
        Write-Host "E2E PAGE TITLE: $($matches[1])" -ForegroundColor Yellow
    }
    if ($html -match 'id="log"[^>]*>([\s\S]*?)</div>') {
        Write-Host "E2E LOG OUTPUT:`n$($matches[1])" -ForegroundColor Green
    }
}

# Cleanup
if (Test-Path $userDataDir) {
    Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
}
