$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    'apikey' = $apiKey
    'Authorization' = "Bearer $apiKey"
}
$baseUrl = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1"

try {
    $rows = Invoke-RestMethod -Uri "$baseUrl/ppdb_registrations?select=*" -Headers $headers -Method Get
    Write-Host "Total PPDB Registrations in Supabase: $($rows.Count)"
    foreach ($r in $rows) {
        Write-Host "------------------------------------"
        Write-Host "ID         : $($r.id)"
        Write-Host "Reg No     : $($r.registration_number)"
        Write-Host "Full Name  : $($r.full_name)"
        Write-Host "Status     : $($r.status)"
        Write-Host "Level      : $($r.level)"
        Write-Host "Phone      : $($r.phone)"
        Write-Host "Father     : $($r.father_name)"
        Write-Host "Photo URL  : $($r.photo_url)"
        Write-Host "Birth Cert : $($r.birth_certificate_url)"
        Write-Host "Family Card: $($r.family_card_url)"
        Write-Host "Created At : $($r.created_at)"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

