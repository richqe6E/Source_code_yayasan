$urls = @(
    'http://localhost:8080/public/images/logo.png',
    'http://localhost:8080/images/logo.png',
    'http://localhost:8080/shared/js/supabase-config.js',
    'http://localhost:8080/shared/js/api.js'
)

foreach ($u in $urls) {
    try {
        $res = Invoke-WebRequest -Uri $u -UseBasicParsing
        Write-Host "[$($res.StatusCode)] $u (Length: $($res.Content.Length))" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL $($_.Exception.Response.StatusCode.value__)] $u : $($_.Exception.Message)" -ForegroundColor Red
    }
}

