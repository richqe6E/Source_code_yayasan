$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TESTING FASE 1 REMEDIATION: BUG-002, BUG-004, BUG-005" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# We use Headless Edge to run apiCall directly via browser context
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$testRunnerHtml = @"
<!DOCTYPE html>
<html>
<head><title>Test Fase 1</title></head>
<body>
  <div id="output">Running...</div>
  <script src="http://localhost:8080/shared/js/supabase-config.js"></script>
  <script src="http://localhost:8080/shared/js/api.js"></script>
  <script>
    async function runFase1Tests() {
      const results = {};
      try {
        // -------------------------------------------------------------
        // TEST 1: BUG-002 - Empty PPDB Payload Submission
        // -------------------------------------------------------------
        const emptyRes = await window.apiCall('ppdb', 'submit', {});
        results.empty_payload_rejected = (!emptyRes.success);
        results.empty_payload_message = emptyRes.message;

        // -------------------------------------------------------------
        // TEST 2: BUG-002 - Partial Incomplete Payload
        // -------------------------------------------------------------
        const partialRes = await window.apiCall('ppdb', 'submit', {
          student_name: 'Anak Inkomplit'
        });
        results.partial_payload_rejected = (!partialRes.success);

        // -------------------------------------------------------------
        // TEST 3: BUG-002 & BUG-005 - Valid Complete Registration
        // -------------------------------------------------------------
        const validPayload = {
          student_name: '[UJI-F1] Zidna Ilma Al-Munawwar',
          full_name: '[UJI-F1] Zidna Ilma Al-Munawwar',
          parent_name: '[UJI-F1] Ahmad Munawwar',
          phone: '081255554444',
          birth_date: '2019-03-15',
          nik: '6472011503190002',
          level: 'TPQ Pagi',
          form_type: 'tpq',
          gender: 'L',
          password: 'SecretPassword99!',
          notes: JSON.stringify({
            previous_school: 'PAUD Al-Ikhlas',
            account: { initial_password: 'SecretPassword99!' }
          })
        };
        const validRes = await window.apiCall('ppdb', 'submit', validPayload);
        results.valid_submit_success = (validRes.success === true);
        results.registered_no = validRes.registration_number;

        // -------------------------------------------------------------
        // TEST 4: BUG-004 - SPP Concurrent State Protection
        // -------------------------------------------------------------
        // Create simulated invoice
        const invId = 'INV-TEST-' + Date.now();
        const initialInv = {
          id: invId,
          invoice_number: 'INV/TEST/' + Math.floor(1000 + Math.random() * 9000),
          student_id: 'STU-TEST-01',
          student_name: 'Santri Uji Proteksi SPP',
          month: 'November',
          period: '2026/2027',
          amount: 150000,
          status: 'paid' // Currently paid!
        };
        await window.apiCall('invoices', 'create', initialInv).catch(() => {});

        // Direct low-level insert to ensure it is 'paid'
        await fetch('https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices', {
          method: 'POST',
          headers: {
            'apikey': window.SIYAYASAN_SUPABASE.anonKey,
            'Authorization': 'Bearer ' + window.SIYAYASAN_SUPABASE.anonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(initialInv)
        }).catch(() => {});

        // Now simulate a delayed payment.submit trying to set this paid invoice to 'menunggu_verifikasi'
        await window.apiCall('payments', 'submit', {
          invoice_id: invId,
          student_id: 'STU-TEST-01',
          student_name: 'Santri Uji Proteksi SPP',
          amount: 150000,
          method: 'transfer'
        });

        // Fetch invoice again: status MUST remain 'paid'!
        const invCheck = await window.apiCall('invoices', 'get', { id: invId });
        results.invoice_paid_protected = (invCheck.data && invCheck.data.status === 'paid');
        results.protected_invoice_status = invCheck.data ? invCheck.data.status : 'null';

        // Clean up test invoice
        await fetch('https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices?id=eq.' + invId, {
          method: 'DELETE',
          headers: {
            'apikey': window.SIYAYASAN_SUPABASE.anonKey,
            'Authorization': 'Bearer ' + window.SIYAYASAN_SUPABASE.anonKey
          }
        }).catch(() => {});

        const allPass = results.empty_payload_rejected &&
                        results.partial_payload_rejected &&
                        results.valid_submit_success &&
                        results.invoice_paid_protected;

        document.getElementById('output').textContent = JSON.stringify(results);
        document.title = allPass ? 'FASE1_PASS' : 'FASE1_FAIL';
      } catch (err) {
        document.getElementById('output').textContent = 'ERROR: ' + err.message;
        document.title = 'FASE1_ERROR';
      }
    }
    window.addEventListener('DOMContentLoaded', runFase1Tests);
  </script>
</body>
</html>
"@

$runnerPath = "d:\Source_code_yayasan\tests\test-fase1-runner.html"
$testRunnerHtml | Set-Content -Path $runnerPath -Encoding UTF8

$userDataDir = [System.IO.Path]::Combine($env:TEMP, "edge-fase1-" + [System.Guid]::NewGuid().ToString())
$outFile = "tests/fase1-output.html"

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless",
    "--dump-dom",
    "--virtual-time-budget=6000",
    "--user-data-dir=$userDataDir",
    "--disable-gpu",
    "http://localhost:8080/tests/test-fase1-runner.html"
) -PassThru -NoNewWindow -RedirectStandardOutput $outFile

$proc.WaitForExit(10000)
Start-Sleep -Seconds 1

if (Test-Path $outFile) {
    $dom = Get-Content $outFile -Raw
    if ($dom -match '<div id="output">(.*?)</div>') {
        Write-Host "BROWSER TEST RESULT: $($matches[1])" -ForegroundColor Cyan
    }
    if ($dom -match '<title>(.*?)</title>') {
        Write-Host "TITLE: $($matches[1])" -ForegroundColor Green
    }
} else {
    Write-Host "No output generated!" -ForegroundColor Red
}

# Cleanup
if (Test-Path $userDataDir) {
    Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
}

