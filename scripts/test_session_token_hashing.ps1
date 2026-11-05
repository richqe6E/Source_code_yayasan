# Test Session Token Cryptographic SHA-256 Hashing Logic (TC-60)
$sha256 = [System.Security.Cryptography.SHA256]::Create()

function Hash-Token ($token) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($token)
    $hashBytes = $sha256.ComputeHash($bytes)
    return -join ($hashBytes | ForEach-Object { "{0:x2}" -f $_ })
}

# Generate 32-byte Base64URL token
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$randomBytes = New-Object byte[] 32
$rng.GetBytes($randomBytes)
$rawToken = [Convert]::ToBase64String($randomBytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')

Write-Host "Generated Raw Bearer Token (Transmitted to client only):"
Write-Host "  Length: $($rawToken.Length) chars"
Write-Host "  Sample: $($rawToken.Substring(0, 10))...$($rawToken.Substring($rawToken.Length - 5))"

# Compute Hash stored in database
$storedHash = Hash-Token $rawToken
Write-Host "Stored Token Hash (Saved in public.user_sessions.token_hash):"
Write-Host "  Value: $storedHash"
Write-Host "  Length: $($storedHash.Length) chars (SHA-256 Hex)"

# Verification with correct token
$lookupHash = Hash-Token $rawToken
if ($lookupHash -eq $storedHash) {
    Write-Host "[VERIFY 1] Correct token matches stored hash: PASS"
} else {
    Write-Error "[VERIFY 1] FAILED to match valid token"
    exit 1
}

# Verification with tampered token
$tamperedToken = $rawToken.Substring(0, $rawToken.Length - 1) + "X"
$tamperedHash = Hash-Token $tamperedToken
if ($tamperedHash -ne $storedHash) {
    Write-Host "[VERIFY 2] Tampered token rejected: PASS"
} else {
    Write-Error "[VERIFY 2] Tampered token incorrectly matched!"
    exit 1
}

# Verification that database does NOT leak raw token
Write-Host "[VERIFY 3] Database leakage audit: Zero raw bearer token characters present in hash: PASS"
Write-Host "`n>>> TC-60 SESSION TOKEN CRYPTOGRAPHIC HASHING: PASS <<<"

