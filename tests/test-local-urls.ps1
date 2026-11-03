$urls = @(
    'http://localhost:8080/',
    'http://localhost:8080/profil.html',
    'http://localhost:8080/ppdb.html',
    'http://localhost:8080/berita.html',
    'http://localhost:8080/kontak.html',
    'http://localhost:8080/login.html',
    'http://localhost:8080/admin/dashboard.html',
    'http://localhost:8080/admin/ppdb.html',
    'http://localhost:8080/admin/students.html',
    'http://localhost:8080/admin/classes.html',
    'http://localhost:8080/admin/teachers.html',
    'http://localhost:8080/admin/payments.html',
    'http://localhost:8080/admin/reports.html',
    'http://localhost:8080/admin/content.html',
    'http://localhost:8080/admin/cms_setting.html',
    'http://localhost:8080/admin/users.html',
    'http://localhost:8080/admin/logs.html',
    'http://localhost:8080/siswa/dashboard.html',
    'http://localhost:8080/siswa/biodata.html',
    'http://localhost:8080/siswa/spp.html',
    'http://localhost:8080/siswa/dokumen.html'
)

foreach ($u in $urls) {
    try {
        $res = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 5
        Write-Host "[$($res.StatusCode)] $u (Length: $($res.Content.Length))" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] $u : $($_.Exception.Message)" -ForegroundColor Red
    }
}

