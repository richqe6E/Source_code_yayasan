$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    'apikey' = $apiKey
    'Authorization' = "Bearer $apiKey"
}
$baseUrl = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. CHECKING SUPABASE BACKEND TABLES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$tables = @(
    'users',
    'ppdb_registrations',
    'students',
    'teachers',
    'classes',
    'academic_years',
    'spp_bills',
    'spp_payments',
    'cms_posts',
    'cms_settings',
    'audit_logs'
)

foreach ($t in $tables) {
    try {
        $u = "$baseUrl/$t?select=count"
        $h = $headers.Clone()
        $h['Range'] = '0-0'
        $h['Prefer'] = 'count=exact'
        $resp = Invoke-WebRequest -Uri $u -Headers $h -Method Get -TimeoutSec 10
        $cr = $resp.Headers['Content-Range']
        Write-Host "Table '$t': OK (Range/Count: $cr)" -ForegroundColor Green
    } catch {
        Write-Host "Table '$t': ERROR ($($_.Exception.Message))" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "2. CHECKING ADMIN USER ACCOUNT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    $adminUrl = "$baseUrl/users?email=eq.admin@yayasan.sch.id&select=id,name,email,role,status,is_active,password_hash,salt"
    $admin = Invoke-RestMethod -Uri $adminUrl -Headers $headers -Method Get -TimeoutSec 10
    if ($admin.Count -gt 0) {
        Write-Host "Admin User found:" -ForegroundColor Green
        Write-Host "  Name    : $($admin[0].name)"
        Write-Host "  Email   : $($admin[0].email)"
        Write-Host "  Role    : $($admin[0].role)"
        Write-Host "  Status  : $($admin[0].status)"
        Write-Host "  Active  : $($admin[0].is_active)"
        Write-Host "  Salted  : $([bool]$admin[0].salt)"
        Write-Host "  Hash    : $($admin[0].password_hash)"
    } else {
        Write-Host "Admin user admin@yayasan.sch.id NOT FOUND in users table!" -ForegroundColor Red
    }
} catch {
    Write-Host "Error checking admin user: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "3. CHECKING ACTIVE ACADEMIC YEAR & PPDB PERIOD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    $ayUrl = "$baseUrl/academic_years?select=id,name,is_active,status"
    $ays = Invoke-RestMethod -Uri $ayUrl -Headers $headers -Method Get -TimeoutSec 10
    Write-Host "Academic Years count: $($ays.Count)"
    foreach ($ay in $ays) {
        Write-Host "  - $($ay.name) | Active: $($ay.is_active) | Status: $($ay.status)"
    }
} catch {
    Write-Host "Error checking academic years: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $ppdbUrl = "$baseUrl/cms_settings?key=eq.ppdb_config&select=key,value"
    $ppdbCfg = Invoke-RestMethod -Uri $ppdbUrl -Headers $headers -Method Get -TimeoutSec 10
    if ($ppdbCfg.Count -gt 0) {
        Write-Host "PPDB Config Setting found:" -ForegroundColor Green
        Write-Host $ppdbCfg[0].value
    } else {
        Write-Host "ppdb_config key not in cms_settings, checking general settings..." -ForegroundColor Yellow
        $allCfg = Invoke-RestMethod -Uri "$baseUrl/cms_settings?select=key,updated_at" -Headers $headers -Method Get -TimeoutSec 10
        foreach ($c in $allCfg) {
            Write-Host "  - $($c.key)"
        }
    }
} catch {
    Write-Host "Error checking cms_settings: $($_.Exception.Message)" -ForegroundColor Red
}

