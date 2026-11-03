$pages = @(
    "siswa/dashboard.html",
    "siswa/biodata.html",
    "siswa/spp.html",
    "siswa/dokumen.html"
)

$results = @()

foreach ($pg in $pages) {
    $url = "http://localhost:8080/$pg"
    try {
        $res = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 5
        $content = $res.Content
        $title = if ($content -match '<title>(.*?)</title>') { $matches[1] } else { "N/A" }
        $hasAuthGuard = $content.Contains("checkAuth") -or $content.Contains("siy_user") -or $content.Contains("auth")
        $hasSidebar = $content.Contains("sidebar") -or $content.Contains("nav")
        $results += [PSCustomObject]@{
            Page = $pg
            StatusCode = $res.StatusCode
            Title = $title
            HasAuthGuard = $hasAuthGuard
            ContentLength = $content.Length
        }
    } catch {
        $results += [PSCustomObject]@{
            Page = $pg
            StatusCode = 500
            Title = "Error: $_"
            HasAuthGuard = $false
            ContentLength = 0
        }
    }
}

$results | Format-Table -AutoSize

