try {
    $res = Invoke-WebRequest -Uri 'http://localhost:8080/pengumuman.html' -UseBasicParsing
    Write-Host "pengumuman.html Status: $($res.StatusCode), Length: $($res.Content.Length)"
} catch {
    Write-Host "pengumuman.html Error: $($_.Exception.Message)"
}

try {
    $loginContent = Get-Content "frontend/public/login.html" -Raw
    $imgMatch = [regex]::Match($loginContent, '<img[^>]+src=["''](.*?)["'']')
    Write-Host "login.html image src: $($imgMatch.Groups[1].Value)"
} catch {}

try {
    $statusContent = Get-Content "frontend/public/ppdb/status.html" -Raw
    $scripts = [regex]::Matches($statusContent, '<script[^>]+src=["''](.*?)["'']')
    Write-Host "ppdb/status.html script tags:"
    foreach ($s in $scripts) {
        Write-Host "  - $($s.Groups[1].Value)"
    }
} catch {}

