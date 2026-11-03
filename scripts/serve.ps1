param([int]$Port = 8080)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "SIYAYASAN Local Server listening on http://localhost:$Port/" -ForegroundColor Green

$baseDir = (Get-Location).Path

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response
        
        try {
            $p = $req.Url.AbsolutePath
            $targetFile = $null
            
            if ($p -eq '/' -or $p -eq '/index.html' -or $p -eq '/index') {
                $targetFile = Join-Path $baseDir 'frontend/public/index.html'
            } elseif ($p -eq '/admin' -or $p -eq '/admin/') {
                $res.Redirect('/admin/dashboard.html')
                return
            } elseif ($p -eq '/siswa' -or $p -eq '/siswa/') {
                $res.Redirect('/siswa/dashboard.html')
                return
            } elseif ($p.StartsWith('/admin/')) {
                $sub = $p.Substring(7)
                $targetFile = Join-Path $baseDir "frontend/portal/admin/$sub"
            } elseif ($p.StartsWith('/siswa/')) {
                $sub = $p.Substring(7)
                $targetFile = Join-Path $baseDir "frontend/portal/siswa/$sub"
            } elseif ($p.StartsWith('/portal/admin/')) {
                $sub = $p.Substring(14)
                $targetFile = Join-Path $baseDir "frontend/portal/admin/$sub"
            } elseif ($p.StartsWith('/portal/siswa/')) {
                $sub = $p.Substring(14)
                $targetFile = Join-Path $baseDir "frontend/portal/siswa/$sub"
            } elseif ($p.StartsWith('/shared/')) {
                $sub = $p.Substring(8)
                $targetFile = Join-Path $baseDir "frontend/shared/$sub"
            } elseif ($p.StartsWith('/tests/')) {
                $sub = $p.Substring(7)
                $targetFile = Join-Path $baseDir "tests/$sub"
            } elseif ($p.StartsWith('/images/')) {
                $targetFile = Join-Path $baseDir "frontend/public$p"
            } elseif ($p.StartsWith('/css/')) {
                $targetFile = Join-Path $baseDir "frontend/public$p"
            } elseif ($p.StartsWith('/js/')) {
                $targetFile = Join-Path $baseDir "frontend/public$p"
            } elseif ($p.StartsWith('/assets/')) {
                $targetFile = Join-Path $baseDir "frontend/public$p"
            } elseif ($p.StartsWith('/ppdb/')) {
                $targetFile = Join-Path $baseDir "frontend/public$p"
            } elseif ($p.StartsWith('/berita/')) {
                $targetFile = Join-Path $baseDir "frontend/public/berita/detail.html"
            } else {
                $candidate = Join-Path $baseDir "frontend/public$p"
                if (Test-Path $candidate -PathType Leaf) {
                    $targetFile = $candidate
                } elseif (Test-Path "$candidate.html" -PathType Leaf) {
                    $targetFile = "$candidate.html"
                }
            }
            
            if ($targetFile -and (Test-Path $targetFile -PathType Leaf)) {
                $ext = [System.IO.Path]::GetExtension($targetFile).ToLower()
                $mime = switch ($ext) {
                    '.html' { 'text/html; charset=utf-8' }
                    '.css'  { 'text/css; charset=utf-8' }
                    '.js'   { 'application/javascript; charset=utf-8' }
                    '.json' { 'application/json; charset=utf-8' }
                    '.png'  { 'image/png' }
                    '.jpg'  { 'image/jpeg' }
                    '.jpeg' { 'image/jpeg' }
                    '.webp' { 'image/webp' }
                    '.svg'  { 'image/svg+xml' }
                    '.ico'  { 'image/x-icon' }
                    '.woff' { 'font/woff' }
                    '.woff2'{ 'font/woff2' }
                    '.ttf'  { 'font/ttf' }
                    default { 'application/octet-stream' }
                }
                
                $bytes = [System.IO.File]::ReadAllBytes($targetFile)
                $res.ContentType = $mime
                $res.ContentLength64 = $bytes.Length
                $res.AddHeader("Access-Control-Allow-Origin", "*")
                if ($req.HttpMethod -ne "HEAD") {
                    $res.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $res.StatusCode = 404
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $p")
                if ($req.HttpMethod -ne "HEAD") {
                    $res.OutputStream.Write($errBytes, 0, $errBytes.Length)
                }
            }
        } finally {
            try { $res.Close() } catch {}
        }
    } catch {
        # ignore connection resets
    }
}
