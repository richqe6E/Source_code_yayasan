try {
    $res = Invoke-WebRequest -Uri 'https://siyayasan.vercel.app/' -UseBasicParsing -TimeoutSec 10
    Write-Host "STATUS: $($res.StatusCode)"
    Write-Host "CONTENT LENGTH: $($res.Content.Length)"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

