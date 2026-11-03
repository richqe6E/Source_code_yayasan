$pages = @(
    "admin/dashboard.html",
    "admin/students.html",
    "admin/classes.html",
    "admin/teachers.html",
    "admin/ppdb.html",
    "admin/payments.html",
    "admin/users.html",
    "admin/reports.html",
    "admin/content.html",
    "admin/cms_setting.html",
    "admin/backup.html",
    "admin/logs.html"
)

$results = @()

foreach ($pg in $pages) {
    $url = "http://localhost:8080/$pg"
    try {
        $res = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 5
        $content = $res.Content
        $title = if ($content -match '<title>(.*?)</title>') { $matches[1] } else { "N/A" }
        $hasAuth = $content.Contains("checkAuth") -or $content.Contains("siy_user") -or $content.Contains("auth")
        $results += [PSCustomObject]@{
            Page = $pg
            StatusCode = $res.StatusCode
            Title = $title
            HasAuth = $hasAuth
            ContentLength = $content.Length
        }
    } catch {
        $results += [PSCustomObject]@{
            Page = $pg
            StatusCode = 500
            Title = "Error: $_"
            HasAuth = $false
            ContentLength = 0
        }
    }
}

$results | Format-Table -AutoSize

