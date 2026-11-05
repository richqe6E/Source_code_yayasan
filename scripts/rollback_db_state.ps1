<#
.SYNOPSIS
    SIYAYASAN V2 - Hardened Database State Rollback / Restoration Script
.DESCRIPTION
    Safely restores database state from a validated JSON snapshot in strict foreign key dependency order.
    Includes strict ENVIRONMENT GUARDS (blocks execution if target is production),
    SHA-256 manifest checksum verification, and targeted table restoration support.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$TargetUrl,

    [Parameter(Mandatory=$true)]
    [string]$ApiKey,

    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "local", "isolated_test")]
    [string]$Environment,

    [Parameter(Mandatory=$false)]
    [string]$SnapshotPath = "",

    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,

    [Parameter(Mandatory=$false)]
    [string[]]$TargetedTables = @()
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host " SIYAYASAN V2 - HARDENED RESTORE & ROLLBACK UTILITY" -ForegroundColor Magenta
Write-Host " Target URL   : $TargetUrl" -ForegroundColor White
Write-Host " Environment  : $Environment" -ForegroundColor Yellow
Write-Host " Dry-Run      : $DryRun" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Magenta

# 1. ENVIRONMENT GUARD: Strictly block any execution targeted at production database!
$productionHostnames = @(
    "hnkxrbmngmveoxipohtk.supabase.co",
    "siyayasan.supabase.co",
    "siyayasan.vercel.app"
)

foreach ($prodHost in $productionHostnames) {
    if ($TargetUrl -like "*$prodHost*") {
        Write-Error "CRITICAL SECURITY BLOCK: TargetUrl '$TargetUrl' matches production infrastructure! Rollback/restore is strictly prohibited on production. Execution aborted."
        exit 1
    }
}

if ($Environment -notin @("staging", "local", "isolated_test")) {
    Write-Error "CRITICAL SECURITY BLOCK: Environment must be explicitly set to 'staging', 'local', or 'isolated_test'. Got '$Environment'. Execution aborted."
    exit 1
}

# 2. Resolve Snapshot & Manifest Paths
if (-not $SnapshotPath) {
    $latest = $null
    if (Test-Path "backups/db-pre-remediation") {
        $latest = Get-ChildItem -Path "backups/db-pre-remediation" -Filter "db_snapshot_*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    }
    if ($latest) {
        $SnapshotPath = $latest.FullName
    } else {
        Write-Error "CRITICAL: No snapshot file found in backups/db-pre-remediation."
        exit 1
    }
}

if (-not (Test-Path $SnapshotPath)) {
    Write-Error "Snapshot file does not exist: $SnapshotPath"
    exit 1
}

# 3. Checksum Verification against Manifest
$manifestPath = $SnapshotPath.Replace("db_snapshot_", "db_manifest_")
if (Test-Path $manifestPath) {
    Write-Host "Verifying SHA-256 checksum against manifest ..." -NoNewline
    $manifest = Get-Content -Path $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $expectedHash = $manifest.sha256_checksum
    $actualHash = (Get-FileHash -Path $SnapshotPath -Algorithm SHA256).Hash
    if ($expectedHash -and ($expectedHash -ne $actualHash)) {
        Write-Host " CORRUPTED!" -ForegroundColor Red
        Write-Error "Checksum mismatch! Expected: $expectedHash, Actual: $actualHash. Snapshot file may have been tampered with or corrupted."
        exit 1
    }
    Write-Host " VALID ($actualHash)" -ForegroundColor Green
} else {
    Write-Host "Warning: Manifest file not found for checksum verification ($manifestPath)." -ForegroundColor Yellow
}

# 4. Parse Snapshot
Write-Host "Verifying snapshot JSON structure ..." -NoNewline
try {
    $data = Get-Content -Path $SnapshotPath -Raw -Encoding UTF8 | ConvertFrom-Json
    Write-Host " VALID" -ForegroundColor Green
} catch {
    Write-Host " CORRUPTED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. Strict Foreign Key Dependency Restoration Order
$orderedTables = @(
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

# Apply TargetedTables filter if specified
$tablesToRestore = @()
if ($TargetedTables -and $TargetedTables.Count -gt 0) {
    Write-Host "Targeted Table Mode Active: Restoring only [ $($TargetedTables -join ', ') ]" -ForegroundColor Cyan
    foreach ($t in $orderedTables) {
        if ($TargetedTables -contains $t) {
            $tablesToRestore += $t
        }
    }
} else {
    $tablesToRestore = $orderedTables
}

if ($DryRun) {
    Write-Host "`n[DRY-RUN MODE] Analyzing restore payload by foreign key sequence:" -ForegroundColor Cyan
    foreach ($table in $tablesToRestore) {
        if ($data.PSObject.Properties[$table]) {
            $rows = $data.$table
            $count = @($rows).Count
            Write-Host "  -> Table [$table]: $count records ready to restore." -ForegroundColor White
        } else {
            Write-Host "  -> Table [$table]: No records present in snapshot." -ForegroundColor DarkGray
        }
    }
    Write-Host "`nDry-run completed successfully. Target '$TargetUrl' was NOT modified." -ForegroundColor Green
    exit 0
}

# 6. Execute Restoration to Staging / Local
$headers = @{
    'apikey' = $ApiKey
    'Authorization' = "Bearer $ApiKey"
    'Content-Type' = 'application/json'
    'Prefer' = 'resolution=merge-duplicates'
}

Write-Host "`nProceeding with restoration to $Environment ($TargetUrl) in strict FK sequence ..." -ForegroundColor Yellow

$overallSuccess = $true

foreach ($table in $tablesToRestore) {
    if ($data.PSObject.Properties[$table]) {
        $rows = $data.$table
        $rowCount = @($rows).Count
        if ($rowCount -gt 0) {
            Write-Host "Restoring table $table ($rowCount records) ... " -NoNewline
            $batchSize = 50
            $totalBatches = [Math]::Ceiling($rowCount / $batchSize)
            $successCount = 0

            for ($i = 0; $i -lt $totalBatches; $i++) {
                $batchRows = $rows | Select-Object -Skip ($i * $batchSize) -First $batchSize
                $jsonBody = $batchRows | ConvertTo-Json -Depth 10
                try {
                    Invoke-RestMethod -Uri "$TargetUrl/rest/v1/$table" -Headers $headers -Method Post -Body $jsonBody | Out-Null
                    $successCount += @($batchRows).Count
                } catch {
                    Write-Host " [ERROR at batch $i : $($_.Exception.Message)]" -ForegroundColor Red
                    $overallSuccess = $false
                }
            }
            Write-Host "OK ($successCount / $rowCount records restored)" -ForegroundColor Green
        }
    }
}

Write-Host "`n==========================================================" -ForegroundColor Magenta
Write-Host " Database Restoration Finished! Status: $(if ($overallSuccess) { 'SUCCESS' } else { 'PARTIAL/FAILED' })" -ForegroundColor $(if ($overallSuccess) { 'Green' } else { 'Red' })
Write-Host "==========================================================" -ForegroundColor Magenta

if (-not $overallSuccess) {
    exit 1
}
