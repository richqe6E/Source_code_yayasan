$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
try {
    $listener.Start()
    Write-Host "HttpListener started successfully on port 8080!"
    $listener.Stop()
} catch {
    Write-Host "HttpListener error: $($_.Exception.Message)"
} finally {
    $listener.Close()
}

