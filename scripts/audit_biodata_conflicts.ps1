<#
.SYNOPSIS
    SIYAYASAN V2 - Dry-Run Biodata Conflict Audit Script
.DESCRIPTION
    Non-destructive audit script that compares physical student columns with legacy form_metadata.
    Generates a conflict report without modifying any data.
#>

[CmdletBinding()]
param(
    [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"

$supaUrl = 'https://hnkxrbmngmveoxipohtk.supabase.co'
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo'
$headers = @{
    'apikey' = $anonKey
    'Authorization' = "Bearer $anonKey"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " SIYAYASAN V2 - BIODATA CONFLICT AUDIT (DRY-RUN)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$students = Invoke-RestMethod -Uri "$supaUrl/rest/v1/students?select=*" -Headers $headers -Method Get
Write-Host "Fetched $($students.Count) student records for conflict inspection." -ForegroundColor Green

$conflicts = @()
$inspectedCount = 0

foreach ($s in $students) {
    $inspectedCount++
    $meta = $s.form_metadata
    if (-not $meta) { continue }

    $studentId = $s.id
    $studentNis = $s.nis
    $studentName = $s.name

    # Check Father Occupation Conflict
    $physFatherJob = $s.father_occupation
    $metaFatherJob = if ($meta.father -and $meta.father.job) { $meta.father.job } elseif ($meta.father_job) { $meta.father_job } else { $null }
    if ($physFatherJob -and $metaFatherJob -and ($physFatherJob.Trim() -ne $metaFatherJob.Trim())) {
        $conflicts += [PSCustomObject]@{
            student_id = $studentId
            nis = $studentNis
            name = $studentName
            field = "father_occupation"
            physical_value = $physFatherJob
            metadata_value = $metaFatherJob
            resolution = "PRESERVE_PHYSICAL_COLUMN"
        }
    }

    # Check Mother Occupation Conflict
    $physMotherJob = $s.mother_occupation
    $metaMotherJob = if ($meta.mother -and $meta.mother.job) { $meta.mother.job } elseif ($meta.mother_job) { $meta.mother_job } else { $null }
    if ($physMotherJob -and $metaMotherJob -and ($physMotherJob.Trim() -ne $metaMotherJob.Trim())) {
        $conflicts += [PSCustomObject]@{
            student_id = $studentId
            nis = $studentNis
            name = $studentName
            field = "mother_occupation"
            physical_value = $physMotherJob
            metadata_value = $metaMotherJob
            resolution = "PRESERVE_PHYSICAL_COLUMN"
        }
    }

    # Check Parent Phone Conflict
    $physPhone = $s.parent_phone
    $metaPhone = if ($meta.phone) { $meta.phone } elseif ($meta.parent_phone) { $meta.parent_phone } else { $null }
    if ($physPhone -and $metaPhone -and ($physPhone.Trim() -ne $metaPhone.Trim())) {
        $conflicts += [PSCustomObject]@{
            student_id = $studentId
            nis = $studentNis
            name = $studentName
            field = "parent_phone"
            physical_value = $physPhone
            metadata_value = $metaPhone
            resolution = "PRESERVE_PHYSICAL_COLUMN"
        }
    }
}

if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }
$reportPath = Join-Path $OutputDir "biodata_conflict_report.json"
$conflicts | ConvertTo-Json -Depth 5 | Set-Content -Path $reportPath -Encoding UTF8

Write-Host "Inspected: $inspectedCount students" -ForegroundColor White
Write-Host "Detected Conflicts: $($conflicts.Count)" -ForegroundColor $(if ($conflicts.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host "Report saved to: $reportPath" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

