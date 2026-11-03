$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$invId = "INV-RACE-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$invPayload = @{
    id = $invId
    invoice_number = "INV/2026/RACE01"
    student_id = "STU-1793673254202"
    student_name = "Santri Uji"
    month = "November"
    period = "2026/2027"
    amount = 150000
    status = "paid"
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices" -Headers $headers -Method Post -Body $invPayload
    Write-Host "Success: $($res[0].id)"
} catch {
    $errStream = $_.Exception.Response.GetResponseStream()
    if ($errStream) {
        $reader = New-Object System.IO.StreamReader($errStream)
        Write-Host "Error Response: $($reader.ReadToEnd())" -ForegroundColor Red
    }
}

