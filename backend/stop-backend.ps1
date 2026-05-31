# Dừng backend đang chiếm port 5056 / khóa backend.exe
$port = 5056
$lines = netstat -ano | Select-String ":$port\s"
$pids = $lines | ForEach-Object {
    if ($_ -match '\s+(\d+)\s*$') { [int]$Matches[1] }
} | Where-Object { $_ -gt 0 } | Select-Object -Unique

Get-Process -Name backend -ErrorAction SilentlyContinue | ForEach-Object {
    $pids += $_.Id
}
$pids = $pids | Select-Object -Unique

if (-not $pids) {
    Write-Host "Không có backend đang chạy trên port $port."
    exit 0
}

foreach ($pid in $pids) {
    $p = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($p) {
        Write-Host "Dừng PID $pid ($($p.ProcessName))..."
        Stop-Process -Id $pid -Force
    }
}
Write-Host "Xong. Chạy: dotnet run"
