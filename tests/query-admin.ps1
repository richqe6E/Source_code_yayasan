$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    'apikey' = $apiKey
    'Authorization' = "Bearer $apiKey"
}
$baseUrl = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1"

try {
    $u = "$baseUrl/users?email=eq.admin@yayasan.sch.id&select=id,email,full_name,role,status,password_hash,password_salt"
    $res = Invoke-RestMethod -Uri $u -Headers $headers -Method Get
    Write-Host "Admin User from Supabase:"
    $res | Format-List
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
