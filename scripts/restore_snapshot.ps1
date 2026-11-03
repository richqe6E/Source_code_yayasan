param(
    [string]$SnapshotPath = ""
)

if (-not $SnapshotPath) {
    $latest = Get-ChildItem -Path "backup_snapshots" -Filter *.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latest) {
        $SnapshotPath = $latest.FullName
    } else {
        Write-Error "No snapshot file found."
        exit 1
    }
}

Write-Host "Restoring from snapshot: $SnapshotPath"
$supaUrl = 'https://hnkxrbmngmveoxipohtk.supabase.co'
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo'
$headers = @{ 
    'apikey' = $anonKey
    'Authorization' = "Bearer $anonKey"
    'Content-Type' = 'application/json'
    'Prefer' = 'resolution=merge-duplicates'
}

$data = Get-Content -Path $SnapshotPath -Raw | ConvertFrom-Json
foreach ($prop in $data.PSObject.Properties) {
    $t = $prop.Name
    $rows = $prop.Value
    if ($rows -and @($rows).Count -gt 0) {
        Write-Host "Restoring table $t ($((@($rows)).Count) rows)..."
        $jsonBody = $rows | ConvertTo-Json -Depth 10
        try {
            Invoke-RestMethod -Uri "$supaUrl/rest/v1/$t" -Headers $headers -Method Post -Body $jsonBody | Out-Null
            Write-Host "Restored $t successfully."
        } catch {
            Write-Host "Warning restoring $t: $($_.Exception.Message)"
        }
    }
}
Write-Host "Restore complete."

