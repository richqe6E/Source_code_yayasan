$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

Write-Host "=== TEST BUG-004: SPP CONCURRENT INVOICE STATE GUARD ===" -ForegroundColor Cyan

# 1. Create a paid invoice for Desember
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$invId = "INV-RACE-" + $ts
$invNum = "INV/2026/R" + $ts
$invPayload = @{
    id = $invId
    invoice_number = $invNum
    student_id = "STU-1793673254202"
    student_name = "[SIMULASI] Santri Uji Race Condition"
    month = "Desember"
    period = "2026/2027"
    amount = 150000.00
    due_date = "2026-12-20"
    status = "paid"
    paid_at = (Get-Date).ToString("o")
    payment_method = "transfer"
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices" -Headers $headers -Method Post -Body $invPayload
Write-Host "Created test invoice: $invId with status: $($created[0].status)"

# 2. Simulate delayed submit trying to patch invoice to 'menunggu_verifikasi' using our guarded query (&status=neq.paid)
$guardedPatchUri = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices?id=eq.$invId&status=neq.paid"
$body = @{ status = "menunggu_verifikasi" } | ConvertTo-Json

$patchRes = Invoke-RestMethod -Uri $guardedPatchUri -Headers $headers -Method Patch -Body $body
Write-Host "Rows updated by delayed submit patch: $($patchRes.Count)"

# 3. Check current invoice status
$check = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices?id=eq.$invId&select=*" -Headers $headers -Method Get
Write-Host "Final invoice status: $($check[0].status)" -ForegroundColor $(if ($check[0].status -eq "paid") { "Green" } else { "Red" })

if ($check[0].status -eq "paid" -and $patchRes.Count -eq 0) {
    Write-Host "BUG-004 TEST PASSED: Status 'paid' is completely protected from being overwritten!" -ForegroundColor Green
} else {
    Write-Host "BUG-004 TEST FAILED!" -ForegroundColor Red
}

# Cleanup test invoice
Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices?id=eq.$invId" -Headers $headers -Method Delete | Out-Null
Write-Host "Cleaned up test invoice."
