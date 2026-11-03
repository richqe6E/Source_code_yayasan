$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$statusHtml = @"
<!DOCTYPE html>
<html>
<head><title>Test Status Page</title></head>
<body>
  <div id="output">Running...</div>
  <script src="http://localhost:8080/shared/js/supabase-config.js"></script>
  <script src="http://localhost:8080/shared/js/api.js"></script>
  <script>
    async function testStatus() {
      try {
        const res = await window.apiCall('ppdb', 'check_status', {
          registration_number: 'REG-2026-6951'
        });
        document.getElementById('output').textContent = JSON.stringify(res);
        document.title = res.success ? 'STATUS_CHECK_OK' : 'STATUS_CHECK_FAIL';
      } catch (e) {
        document.getElementById('output').textContent = 'ERROR: ' + e.message;
        document.title = 'STATUS_CHECK_ERROR';
      }
    }
    window.addEventListener('DOMContentLoaded', testStatus);
  </script>
</body>
</html>
"@

$statusHtml | Set-Content "tests/test-status-runner.html" -Encoding UTF8

$userDataDir = [System.IO.Path]::Combine($env:TEMP, "edge-status-" + [System.Guid]::NewGuid().ToString())
$outFile = "tests/status-output.html"

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless",
    "--dump-dom",
    "--virtual-time-budget=5000",
    "--user-data-dir=$userDataDir",
    "--disable-gpu",
    "http://localhost:8080/tests/test-status-runner.html"
) -PassThru -NoNewWindow -RedirectStandardOutput $outFile -RedirectStandardError "tests/status-err.log"

$proc.WaitForExit(10000)
Start-Sleep -Seconds 1

if (Test-Path $outFile) {
    $dom = Get-Content $outFile -Raw
    if ($dom -match '<div id="output">(.*?)</div>') {
        Write-Host "STATUS CHECK API RESULT:" -ForegroundColor Cyan
        Write-Host $matches[1] -ForegroundColor Green
    }
}

if (Test-Path $userDataDir) {
    Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
}
