$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$testHtml = "file:///" + (Resolve-Path "tests/test-qa-assistant.html").Path.Replace("\", "/")
$userDataDir = [System.IO.Path]::Combine($env:TEMP, "edge-test-" + [System.Guid]::NewGuid().ToString())

Write-Host "Launching Edge Headless against: $testHtml" -ForegroundColor Cyan

$process = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--dump-dom",
    "--virtual-time-budget=5000",
    "--user-data-dir=$userDataDir",
    "--disable-gpu",
    $testHtml
) -PassThru -NoNewWindow -RedirectStandardOutput "tests/test-output.html" -RedirectStandardError "tests/test-error.log"

$process.WaitForExit(10000)
Start-Sleep -Milliseconds 1500

if (Test-Path "tests/test-output.html") {
    $html = [System.IO.File]::ReadAllText("tests/test-output.html")
    if ($html -match '<title>(.*?)</title>') {
        Write-Host "PAGE TITLE: $($matches[1])" -ForegroundColor Yellow
    }
    if ($html -match 'id="summary"[^>]*>(.*?)</div>') {
        Write-Host "SUMMARY: $($matches[1])" -ForegroundColor Green
    }
    
    # Check failed items
    $failures = [regex]::Matches($html, '<span class="badge fail">FAIL</span>')
    if ($failures.Count -gt 0) {
        Write-Host "Found $($failures.Count) FAILED tests!" -ForegroundColor Red
        # Print failure cards
        $cards = [regex]::Matches($html, '<div class="card">.*?<span class="badge fail">FAIL</span>.*?</div>')
        foreach ($c in $cards) {
            Write-Host $c.Value -ForegroundColor Red
        }
    } else {
        Write-Host "ALL IN-BROWSER JAVASCRIPT TESTS PASSED WITH ZERO FAILURES!" -ForegroundColor Green
    }
} else {
    Write-Host "No output generated!" -ForegroundColor Red
}

if (Test-Path "tests/test-error.log") {
    $err = [System.IO.File]::ReadAllText("tests/test-error.log")
    if ($err) {
        Write-Host "STDERR: $err" -ForegroundColor Yellow
    }
}

# Cleanup
if (Test-Path $userDataDir) {
    Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
}
