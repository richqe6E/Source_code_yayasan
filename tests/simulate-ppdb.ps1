$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$testRunnerHtml = @"
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi PPDB Calon Siswa</title>
</head>
<body>
  <h1>Simulasi PPDB</h1>
  <div id="status">Memulai simulasi pendaftaran PPDB...</div>
  <pre id="log"></pre>

  <script src="http://localhost:8080/shared/js/supabase-config.js"></script>
  <script src="http://localhost:8080/shared/js/api.js"></script>
  <script>
    const logEl = document.getElementById('log');
    const statusEl = document.getElementById('status');
    function log(msg) {
      logEl.textContent += msg + '\n';
      console.log(msg);
    }

    async function runSimulation() {
      try {
        log('1. Memeriksa ketersediaan API PPDB...');
        if (!window.apiCall) throw new Error('apiCall is not defined!');

        log('2. Uji Validasi Form Kosong...');
        const emptyRes = await window.apiCall('ppdb', 'submit', {});
        log('   Hasil submit kosong: ' + JSON.stringify(emptyRes));

        log('3. Mengirim Data Pendaftaran Calon Siswa Sintetis...');
        const payload = {
          student_name: '[SIMULASI] Muhammad Fahri Ramadhan',
          full_name: '[SIMULASI] Muhammad Fahri Ramadhan',
          child_name: '[SIMULASI] Muhammad Fahri Ramadhan',
          nickname: 'Fahri',
          nik: '6472011205180001',
          gender: 'L',
          birth_place: 'Samarinda',
          birth_date: '2018-05-12',
          level: 'TPQ Pagi',
          form_type: 'tpq',
          father_name: '[SIMULASI] Hendra Wijaya',
          mother_name: '[SIMULASI] Siti Aminah',
          parent_name: '[SIMULASI] Hendra Wijaya',
          phone: '081299998888',
          email: 'simulasi.fahri@test-siyayasan.id',
          address: 'Jl. Pangeran Antasari No. 45, Samarinda',
          photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
          birth_certificate_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400',
          family_card_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400',
          notes: JSON.stringify({
            previous_school: 'TK Aisyiyah 1 Samarinda',
            emergency_contact: '081299997777',
            account: { initial_password: 'Password123' }
          })
        };

        const res = await window.apiCall('ppdb', 'submit', payload, 'POST');
        log('   Respons submit PPDB: success=' + res.success + ', message=' + (res.message || 'OK'));
        
        const regNumber = res.registration_number || res.registration_no || (res.data && (res.data.registration_number || res.data.registration_no)) || res.id;
        log('   Nomor Registrasi Diterbitkan: ' + regNumber);

        if (!regNumber) throw new Error('Nomor registrasi tidak berhasil diperoleh!');

        log('4. Memverifikasi Pencatatan di Supabase...');
        const checkRes = await window.apiCall('ppdb', 'get', { id: regNumber });
        log('   Hasil get pendaftaran: ' + (checkRes.success && checkRes.data ? 'DITEMUKAN' : 'GAGAL'));
        if (checkRes.data) {
          log('   Nama terdaftar: ' + (checkRes.data.full_name || checkRes.data.student_name));
          log('   Status awal: ' + checkRes.data.status);
          log('   Jenjang: ' + checkRes.data.level);
        }

        log('5. Menguji Pelacakan Status di Halaman Cek Status...');
        const statusCheck = await window.apiCall('ppdb', 'checkStatus', {
          registration_number: regNumber,
          birth_date: '2018-05-12'
        });
        log('   Respons Cek Status: success=' + statusCheck.success + ', status=' + (statusCheck.data ? statusCheck.data.status : statusCheck.status));

        statusEl.textContent = 'SIMULASI_PPDB_SUCCESS|' + regNumber;
        document.title = 'PPDB_SIM_PASS_' + regNumber;
      } catch (err) {
        log('[FATAL ERROR] ' + err.message);
        statusEl.textContent = 'SIMULASI_PPDB_FAILED: ' + err.message;
        document.title = 'PPDB_SIM_FAIL';
      }
    }

    window.addEventListener('DOMContentLoaded', runSimulation);
  </script>
</body>
</html>
"@

$runnerPath = "d:\Source_code_yayasan\tests\test-ppdb-sim.html"
$testRunnerHtml | Set-Content -Path $runnerPath -Encoding UTF8

$userDataDir = [System.IO.Path]::Combine($env:TEMP, "edge-ppdb-" + [System.Guid]::NewGuid().ToString())
$outFile = "tests/ppdb-sim-output.html"

Write-Host "Launching Headless Edge for PPDB Registration Simulation..." -ForegroundColor Cyan

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless",
    "--dump-dom",
    "--virtual-time-budget=8000",
    "--user-data-dir=$userDataDir",
    "--disable-gpu",
    "http://localhost:8080/tests/test-ppdb-sim.html"
) -PassThru -NoNewWindow -RedirectStandardOutput $outFile -RedirectStandardError "tests/ppdb-sim-err.log"

$proc.WaitForExit(15000)
Start-Sleep -Seconds 2

if (Test-Path $outFile) {
    $dom = Get-Content $outFile -Raw
    Write-Host "DOM Output length: $($dom.Length)"
    if ($dom -match '<pre id="log">(.*?)</pre>') {
        Write-Host "`nSIMULATION LOG OUTPUT:" -ForegroundColor White
        Write-Host $matches[1] -ForegroundColor Gray
    }
    if ($dom -match 'PPDB_SIM_PASS_(REG-[^<"]+)') {
        Write-Host "`nSUCCESS! PPDB SIMULATION COMPLETED WITH REG NO: $($matches[1])" -ForegroundColor Green
        $matches[1] | Set-Content "tests/current-sim-reg.txt" -Encoding UTF8
    } else {
        Write-Host "`nPPDB SIMULATION FAILED OR INCOMPLETE" -ForegroundColor Red
    }
} else {
    Write-Host "No output generated!" -ForegroundColor Red
}

if (Test-Path $userDataDir) {
    Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
}

