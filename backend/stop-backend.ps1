# Dừng backend đang chiếm port 5056 / khóa backend.exe
$port = 5056
$procIds = [System.Collections.Generic.List[int]]::new()

$lines = netstat -ano | Select-String ":$port\s"
foreach ($line in $lines) {
    if ($line -match '\s+(\d+)\s*$') {
        $id = [int]$Matches[1]
        if ($id -gt 0) { $procIds.Add($id) }
    }
}

Get-Process -Name backend -ErrorAction SilentlyContinue | ForEach-Object {
    $procIds.Add($_.Id)
}

$unique = $procIds | Select-Object -Unique

if (-not $unique) {
    Write-Host "Khong co backend dang chay (port $port)."
    exit 0
}

foreach ($procId in $unique) {
    $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($p) {
        Write-Host "Dung PID $procId ($($p.ProcessName))..."
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 1
Write-Host "Xong. Chay: dotnet run --launch-profile http"
