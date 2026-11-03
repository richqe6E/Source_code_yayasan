$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$testHtml = "file:///" + (Resolve-Path "tests/test-qa-assistant.html").Path.Replace("\", "/")
$userDataDir = [System.IO.Path]::Combine($env:TEMP, "edge-test-" + [System.Guid]::NewGuid().ToString())

Write-Host "Launching Edge Headless against: $testHtml" -ForegroundColor Cyan

# Remove previous output file
if (Test-Path "tests/test-output.html") {
    Remove-Item "tests/test-output.html" -Force
}

$process = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless",
    "--dump-dom",
    "--virtual-time-budget=6000",
    "--user-data-dir=$userDataDir",
    "--disable-gpu",
    $testHtml
) -PassThru -NoNewWindow -RedirectStandardOutput "tests/test-output.html" -RedirectStandardError "tests/test-error.log"

$process.WaitForExit(15000)
Start-Sleep -Seconds 2

if (Test-Path "tests/test-output.html") {
    $html = Get-Content "tests/test-output.html" -Raw
    Write-Host "Output length: $($html.Length) chars"
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
        $cards = [regex]::Matches($html, '<div class="card">(.*?)</div>\s*(?=<div class="card">|</div>\s*<script)', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        foreach ($c in $cards) {
            if ($c.Value -match '<span class="badge fail">FAIL</span>') {
                Write-Host "------------------------"
                $lines = $c.Value -split "`r?`n"
                foreach ($l in $lines) {
                    if ($l -match 'class="query"' -or $l -match 'class="actual"') {
                        Write-Host $l.Trim() -ForegroundColor Red
                    }
                }
            }
        }
    } else {
        Write-Host "ALL IN-BROWSER JAVASCRIPT TESTS PASSED WITH ZERO FAILURES!" -ForegroundColor Green
    }
} else {
    Write-Host "No output generated!" -ForegroundColor Red
}

# Cleanup
if (Test-Path $userDataDir) {
    Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
}
