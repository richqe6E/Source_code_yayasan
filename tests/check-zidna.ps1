$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
}

$p = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/ppdb_registrations?full_name=ilike.*Zidna*&select=*" -Headers $headers -Method Get
Write-Host "Zidna count: $($p.Count)"
$p | Format-List id, registration_number, full_name, status, notes, form_metadata

