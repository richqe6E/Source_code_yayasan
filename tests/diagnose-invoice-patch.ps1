$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

Write-Host "Attempting PATCH on invoices status to 'paid'..." -ForegroundColor Cyan

# Test with just status
$bodyStatusOnly = @{ status = "paid" } | ConvertTo-Json
try {
    $res1 = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices?id=eq.INV-820774" -Headers $headers -Method Patch -Body $bodyStatusOnly
    Write-Host "Status-only PATCH succeeded! Result:" -ForegroundColor Green
    $res1 | Format-List
} catch {
    Write-Host "Status-only PATCH failed: $_" -ForegroundColor Red
}

# Test with paid_at
$bodyWithPaidAt = @{ paid_at = (Get-Date).ToString("o") } | ConvertTo-Json
try {
    $res2 = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices?id=eq.INV-820774" -Headers $headers -Method Patch -Body $bodyWithPaidAt
    Write-Host "paid_at PATCH succeeded!" -ForegroundColor Green
} catch {
    Write-Host "paid_at PATCH failed: $_" -ForegroundColor Red
    $errStream = $_.Exception.Response.GetResponseStream()
    if ($errStream) {
        $reader = New-Object System.IO.StreamReader($errStream)
        Write-Host "Error Body: $($reader.ReadToEnd())" -ForegroundColor Yellow
    }
}

# Test with payment_method
$bodyWithMethod = @{ payment_method = "transfer" } | ConvertTo-Json
try {
    $res3 = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices?id=eq.INV-820774" -Headers $headers -Method Patch -Body $bodyWithMethod
    Write-Host "payment_method PATCH succeeded!" -ForegroundColor Green
} catch {
    Write-Host "payment_method PATCH failed: $_" -ForegroundColor Red
    $errStream = $_.Exception.Response.GetResponseStream()
    if ($errStream) {
        $reader = New-Object System.IO.StreamReader($errStream)
        Write-Host "Error Body: $($reader.ReadToEnd())" -ForegroundColor Yellow
    }
}

