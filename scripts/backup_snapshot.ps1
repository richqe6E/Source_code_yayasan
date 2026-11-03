$supaUrl = 'https://hnkxrbmngmveoxipohtk.supabase.co'
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo'
$headers = @{ 'apikey' = $anonKey; 'Authorization' = "Bearer $anonKey" }

$tables = @('students', 'classes', 'ppdb_registrations', 'users', 'invoices', 'payments', 'teachers', 'student_documents', 'activity_logs', 'web_settings')
$backupData = @{}
foreach ($t in $tables) {
    try {
        $rows = Invoke-RestMethod -Uri "$supaUrl/rest/v1/$t`?select=*" -Headers $headers -Method Get
        $count = @($rows).Count
        $backupData[$t] = $rows
        Write-Host "Table $t backed up: $count rows"
    } catch {
        Write-Host "Table $t backup warning: $($_.Exception.Message)"
    }
}

$backupDir = 'backup_snapshots'
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force }
$timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
$backupPath = "$backupDir/pre_implementation_backup_$timestamp.json"
$backupData | ConvertTo-Json -Depth 10 | Set-Content -Path $backupPath -Encoding UTF8
Write-Host "Pre-implementation snapshot created successfully at $backupPath"

