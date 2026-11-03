$html = Get-Content 'tests/test-output.html' -Raw
$targets = @('hallop', 'kapan PPDB buka?', 'Bagaimana cara mendaftar?', 'Apa saja persyaratan PPDB?', 'siapa presiden amerika?')

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "TARGET QUERIES VERIFICATION FROM BROWSER TEST" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

foreach ($q in $targets) {
    $pattern = '<div class="card">[\s\S]*?<div class="query">Q: "' + [regex]::Escape($q) + '"</div>[\s\S]*?<div class="actual">Type: <strong>(.*?)</strong> \| Intent: <strong>(.*?)</strong></div>[\s\S]*?<div class="actual"[^>]*>([\s\S]*?)</div>'
    if ($html -match $pattern) {
        Write-Host "QUERY  : $q" -ForegroundColor Yellow
        Write-Host "TYPE   : $($matches[1])" -ForegroundColor Green
        Write-Host "INTENT : $($matches[2])" -ForegroundColor Green
        Write-Host "PREVIEW: $($matches[3].Trim())" -ForegroundColor White
        Write-Host "--------------------------------------------------" -ForegroundColor DarkGray
    } else {
        Write-Host "NOT FOUND: $q" -ForegroundColor Red
    }
}
