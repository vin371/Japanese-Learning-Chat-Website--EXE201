# Fix SQL Server 0/1 -> PostgreSQL true/false for BOOLEAN columns in INSERT statements.
param(
    [string[]]$Files
)

$schemaPath = "c:\Users\VINH\Downloads\yumegoji_supabase.sql"
$schemaText = Get-Content $schemaPath -Raw -Encoding UTF8
$boolByTable = @{}
[regex]::Matches($schemaText, 'CREATE TABLE IF NOT EXISTS "(\w+)"\s*\((.*?)\);', 'Singleline') | ForEach-Object {
    $table = $_.Groups[1].Value
    $body = $_.Groups[2].Value
    $cols = @()
    foreach ($m in [regex]::Matches($body, '"(\w+)"\s+BOOLEAN')) {
        $cols += $m.Groups[1].Value
    }
    if ($cols.Count -gt 0) { $boolByTable[$table] = $cols }
}

function Parse-SqlValues([string]$s) {
    $vals = [System.Collections.Generic.List[string]]::new()
    $i = 0
    $len = $s.Length
    while ($i -lt $len) {
        while ($i -lt $len -and [char]::IsWhiteSpace($s[$i])) { $i++ }
        if ($i -ge $len) { break }
        if ($s.Substring($i).StartsWith('NULL', [StringComparison]::OrdinalIgnoreCase)) {
            $vals.Add('NULL')
            $i += 4
            if ($i -lt $len -and $s[$i] -eq ',') { $i++ }
            continue
        }
        if ($s[$i] -eq [char]39) {
            $sb = [System.Text.StringBuilder]::new()
            [void]$sb.Append([char]39)
            $i++
            while ($i -lt $len) {
                if ($s[$i] -eq [char]39) {
                    if ($i + 1 -lt $len -and $s[$i + 1] -eq [char]39) {
                        [void]$sb.Append([char]39)
                        [void]$sb.Append([char]39)
                        $i += 2
                    } else {
                        $i++
                        break
                    }
                } else {
                    [void]$sb.Append($s[$i])
                    $i++
                }
            }
            [void]$sb.Append([char]39)
            $vals.Add($sb.ToString())
            if ($i -lt $len -and $s[$i] -eq ',') { $i++ }
            continue
        }
        $j = $i
        while ($j -lt $len -and $s[$j] -ne ',') { $j++ }
        $vals.Add($s.Substring($i, $j - $i).Trim())
        $i = $j
        if ($i -lt $len -and $s[$i] -eq ',') { $i++ }
    }
    return $vals
}

function Fix-InsertLine([string]$line) {
    if ($line -notmatch '^INSERT INTO "(\w+)" \((.+)\) VALUES \((.+)\);\s*$') { return $line }
    $table = $Matches[1]
    if (-not $boolByTable.ContainsKey($table)) { return $line }

    $colList = [regex]::Matches($Matches[2], '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
    $boolIdx = @()
    for ($c = 0; $c -lt $colList.Count; $c++) {
        if ($boolByTable[$table] -contains $colList[$c]) { $boolIdx += $c }
    }
    if ($boolIdx.Count -eq 0) { return $line }

    $values = Parse-SqlValues $Matches[3]
    if ($values.Count -ne $colList.Count) { return $line }

    foreach ($idx in $boolIdx) {
        switch ($values[$idx]) {
            '0' { $values[$idx] = 'false' }
            '1' { $values[$idx] = 'true' }
        }
    }

    $colSql = ($colList | ForEach-Object { "`"$_`"" }) -join ', '
    $valSql = $values -join ', '
    return "INSERT INTO `"$table`" ($colSql) VALUES ($valSql);"
}

$fixed = 0
foreach ($file in $Files) {
    if (-not (Test-Path $file)) { Write-Warning "Skip missing: $file"; continue }
    $out = @()
    foreach ($line in (Get-Content $file -Encoding UTF8)) {
        if ($line -like 'INSERT INTO*') {
            $newLine = Fix-InsertLine $line
            if ($newLine -ne $line) { $fixed++ }
            $out += $newLine
        } else {
            $out += $line
        }
    }
    $out | Set-Content -Path $file -Encoding UTF8
    Write-Output "Updated: $file"
}
Write-Output "Boolean fixes applied: $fixed INSERT lines"
Write-Output "Tables with boolean columns: $($boolByTable.Count)"
