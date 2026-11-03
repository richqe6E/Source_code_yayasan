$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
}

$payments = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/payments?select=*" -Headers $headers -Method Get
Write-Host "Payments count: $($payments.Count)"
$payments | Format-Table id, invoice_id, student_name, amount, method, status, verified_by

