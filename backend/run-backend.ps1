# Dung instance cu (neu co) roi build + chay API local :5056
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

& "$PSScriptRoot\stop-backend.ps1"
dotnet run --launch-profile http
