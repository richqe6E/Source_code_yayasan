$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    'apikey' = $apiKey
    'Authorization' = "Bearer $apiKey"
}
$baseUrl = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1"

# Query OpenAPI schema / Swagger definition of Supabase
try {
    $schema = Invoke-RestMethod -Uri "$baseUrl/" -Headers $headers -Method Get
    Write-Host "Supabase Swagger Definitions found!"
    Write-Host "Paths count: $($schema.paths.PSObject.Properties.Count)"
    foreach ($p in $schema.paths.PSObject.Properties) {
        Write-Host "Path: $($p.Name)"
    }
} catch {
    Write-Host "Error getting schema: $($_.Exception.Message)"
}

