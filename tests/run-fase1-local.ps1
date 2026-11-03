$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$testHtml = "file:///" + (Resolve-Path "tests/test-fase1-runner.html").Path.Replace("\", "/")
$userDataDir = [System.IO.Path]::Combine($env:TEMP, "edge-f1-" + [System.Guid]::NewGuid().ToString())
$outFile = "tests/f1-result.html"

if (Test-Path $outFile) { Remove-Item $outFile -Force }

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless",
    "--dump-dom",
    "--virtual-time-budget=4000",
    "--user-data-dir=$userDataDir",
    "--disable-gpu",
    $testHtml
) -PassThru -NoNewWindow -RedirectStandardOutput $outFile

$proc.WaitForExit(10000)
Start-Sleep -Seconds 1

if (Test-Path $outFile) {
    $dom = Get-Content $outFile -Raw
    Write-Host "DOM length: $($dom.Length)"
    if ($dom -match '<div id="output">(.*?)</div>') {
        Write-Host "OUTPUT: $($matches[1])" -ForegroundColor Cyan
    }
    if ($dom -match '<title>(.*?)</title>') {
        Write-Host "TITLE: $($matches[1])" -ForegroundColor Green
    }
}

if (Test-Path $userDataDir) {
    Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
}

