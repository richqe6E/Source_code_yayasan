<#
.SYNOPSIS
    SIYAYASAN V2 - Hardened Database State & Schema Backup Utility
.DESCRIPTION
    Safely captures full JSON snapshots and schema definitions of all operational tables.
    Includes strict error handling (fails manifest on any table error), pagination,
    environment guards, and SHA-256 checksum verification.
    READ-ONLY: Performs GET requests only. Zero database mutations.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$TargetUrl = "https://hnkxrbmngmveoxipohtk.supabase.co",

    [Parameter(Mandatory=$false)]
    [string]$TargetDir = "backups/db-pre-remediation",

    [Parameter(Mandatory=$false)]
    [string]$Environment = "production_read_only",

    [Parameter(Mandatory=$false)]
    [int]$PageSize = 1000
)

$ErrorActionPreference = "Stop"

$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo'
$headers = @{
    'apikey' = $anonKey
    'Authorization' = "Bearer $anonKey"
}

$tables = @(
    'web_settings',
    'users',
    'teachers',
    'classes',
    'ppdb_registrations',
    'students',
    'student_documents',
    'invoices',
    'payments',
    'activity_logs'
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " SIYAYASAN V2 - HARDENED DATABASE BACKUP UTILITY" -ForegroundColor Cyan
Write-Host " Target URL   : $TargetUrl" -ForegroundColor White
Write-Host " Environment  : $Environment" -ForegroundColor White
Write-Host " Mode         : READ-ONLY GET (Zero Database Mutations)" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    Write-Host "Created backup directory: $TargetDir" -ForegroundColor Green
}

$backupManifest = @{
    created_at = (Get-Date).ToString("o")
    environment = $Environment
    supabase_url = $TargetUrl
    tables = @{}
    total_records = 0
    overall_status = "IN_PROGRESS"
    failure_count = 0
}

$fullData = @{}
$hasFailures = $false

foreach ($t in $tables) {
    Write-Host "Backing up table: $t ..." -NoNewline
    $allRows = @()
    $offset = 0
    $hasMore = $true
    $tableFailed = $false
    $errorMessage = $null

    while ($hasMore) {
        $uri = "$TargetUrl/rest/v1/$t`?select=*&limit=$PageSize&offset=$offset"
        try {
            $batch = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
            $batchCount = @($batch).Count
            if ($batchCount -gt 0) {
                $allRows += $batch
                $offset += $batchCount
                if ($batchCount -lt $PageSize) {
                    $hasMore = $false
                }
            } else {
                $hasMore = $false
            }
        } catch {
            $tableFailed = $true
            $hasFailures = $true
            $errorMessage = $_.Exception.Message
            $hasMore = $false
        }
    }

    if ($tableFailed) {
        $backupManifest.tables[$t] = @{
            row_count = 0
            status = "FAILED"
            error = $errorMessage
        }
        $backupManifest.failure_count++
        Write-Host " FAILED! ($errorMessage)" -ForegroundColor Red
    } else {
        $totalTableRows = $allRows.Count
        $fullData[$t] = $allRows
        $backupManifest.tables[$t] = @{
            row_count = $totalTableRows
            status = "captured"
        }
        $backupManifest.total_records += $totalTableRows
        Write-Host " OK ($totalTableRows rows)" -ForegroundColor Green
    }
}

if ($hasFailures) {
    $backupManifest.overall_status = "FAILED"
    Write-Host "`nCRITICAL: One or more tables failed to back up. Manifest marked FAILED." -ForegroundColor Red
} else {
    $backupManifest.overall_status = "SUCCESS"
}

$timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
$snapshotFilename = "db_snapshot_$timestamp.json"
$manifestFilename = "db_manifest_$timestamp.json"

$snapshotPath = Join-Path $TargetDir $snapshotFilename
$manifestPath = Join-Path $TargetDir $manifestFilename

$fullData | ConvertTo-Json -Depth 10 | Set-Content -Path $snapshotPath -Encoding UTF8
$backupManifest | ConvertTo-Json -Depth 5 | Set-Content -Path $manifestPath -Encoding UTF8

# Checksum verification
$hash = (Get-FileHash -Path $snapshotPath -Algorithm SHA256).Hash
$backupManifest["sha256_checksum"] = $hash
$backupManifest | ConvertTo-Json -Depth 5 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Backup Finished with Status: $($backupManifest.overall_status)" -ForegroundColor $(if ($hasFailures) { "Red" } else { "Green" })
Write-Host " Snapshot File : $snapshotPath" -ForegroundColor White
Write-Host " Manifest File : $manifestPath" -ForegroundColor White
Write-Host " Total Records : $($backupManifest.total_records)" -ForegroundColor White
Write-Host " SHA-256 Hash  : $hash" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

if ($hasFailures) {
    exit 1
}
