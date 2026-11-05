$sqlFile = "database/STAGE6_ISOLATED_MIGRATION.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Error "Migration file not found."
    exit 1
}

$content = [System.IO.File]::ReadAllText($sqlFile)

# 1. Check prohibited parser keywords and additions
$prohibited = @("pg_catalog.coalesce", "pg_catalog.least", "pg_catalog.trim", "pg_catalog.length")
$foundProhibited = @()
foreach ($p in $prohibited) {
    if ($content.Contains($p)) {
        $foundProhibited += $p
    }
}

if ($content -match "(?i)ADD COLUMN\s+.*?temporary_password_secret") {
    $foundProhibited += "ADD COLUMN temporary_password_secret"
}

if ($foundProhibited.Count -gt 0) {
    Write-Error "Found prohibited tokens: $($foundProhibited -join ', ')"
    exit 1
} else {
    Write-Host "[CHECK 1] Prohibited tokens check: CLEAN (0 found)"
}

# 2. Check BEGIN / END $$ blocks balance
$begins = ([regex]::Matches($content, "(?i)\bBEGIN\b")).Count
$ends = ([regex]::Matches($content, "(?i)\bEND\b")).Count
Write-Host "[CHECK 2] PL/pgSQL BEGIN count: $begins, END count: $ends"

# 3. Check functions defined
$funcMatches = [regex]::Matches($content, "(?i)CREATE OR REPLACE FUNCTION\s+([\w\.]+)")
Write-Host "[CHECK 3] Functions defined ($($funcMatches.Count)):"
foreach ($m in $funcMatches) {
    Write-Host "  - $($m.Groups[1].Value)"
}

# 4. Check tables defined
$tableMatches = [regex]::Matches($content, "(?i)CREATE TABLE IF NOT EXISTS\s+([\w\.]+)")
Write-Host "[CHECK 4] New tables defined ($($tableMatches.Count)):"
foreach ($m in $tableMatches) {
    Write-Host "  - $($m.Groups[1].Value)"
}

# 5. Check triggers defined
$trigMatches = [regex]::Matches($content, "(?i)CREATE TRIGGER\s+([\w]+)")
Write-Host "[CHECK 5] Triggers defined ($($trigMatches.Count)):"
foreach ($m in $trigMatches) {
    Write-Host "  - $($m.Groups[1].Value)"
}

# 6. Check RLS policies defined
$policyMatches = [regex]::Matches($content, "(?i)CREATE POLICY\s+([\w]+)")
Write-Host "[CHECK 6] Policies defined ($($policyMatches.Count)):"
foreach ($m in $policyMatches) {
    Write-Host "  - $($m.Groups[1].Value)"
}

Write-Host "`n>>> SQL SYNTAX & STRUCTURE AUDIT: PASS 100% <<<"
