$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    'apikey' = $apiKey
    'Authorization' = "Bearer $apiKey"
}
$baseUrl = "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1"

$tables = @(
    'users',
    'schools',
    'web_settings',
    'roles',
    'classes',
    'teachers',
    'students',
    'student_documents',
    'ppdb_registrations',
    'ppdb_periods',
    'invoices',
    'payments',
    'news',
    'announcements',
    'events',
    'galleries',
    'audit_logs'
)

foreach ($t in $tables) {
    try {
        $u = "$baseUrl/$t"
        $res = Invoke-RestMethod -Uri $u -Headers $headers -Method Get
        Write-Host "Table '$t' -> Count: $($res.Count)" -ForegroundColor Green
    } catch {
        Write-Host "Table '$t' -> $($_.Exception.Message)" -ForegroundColor Red
    }
}
