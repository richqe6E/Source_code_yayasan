$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$userDataDir = [System.IO.Path]::Combine($env:TEMP, "edge-auth-" + [System.Guid]::NewGuid().ToString())
$outFile = "tests/step1-output.html"

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless",
    "--dump-dom",
    "--virtual-time-budget=6000",
    "--user-data-dir=$userDataDir",
    "--disable-gpu",
    "http://localhost:8080/tests/test-step1-admin-auth.html"
) -PassThru -NoNewWindow -RedirectStandardOutput $outFile

$proc.WaitForExit(10000)
Start-Sleep -Seconds 1

if (Test-Path $outFile) {
    $dom = Get-Content $outFile -Raw
    if ($dom -match '<div id="output">(.*?)</div>') {
        Write-Host "RESULT: $($matches[1])" -ForegroundColor Cyan
    }
    if ($dom -match '<title>(.*?)</title>') {
        Write-Host "TITLE: $($matches[1])" -ForegroundColor Green
    }
} else {
    Write-Host "No output generated!" -ForegroundColor Red
}

if (Test-Path $userDataDir) {
    Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
}

