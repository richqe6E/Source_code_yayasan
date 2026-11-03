$dom = Get-Content "tests/ppdb-sim-output.html" -Raw
if ($dom -match '<pre id="log">(.*?)</pre>') {
    Write-Host $matches[1]
}

