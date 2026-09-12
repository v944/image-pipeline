$ErrorActionPreference = "Continue"
$root = "E:\Image Pipeline\image-pipeline"
$vite = "$root\node_modules\.bin\vite.cmd"
$caches = @(
  "$root\node_modules\.vite",
  "$root\node_modules\.vitest"
)
foreach ($c in $caches) {
  if (Test-Path -LiteralPath $c) {
    Remove-Item -LiteralPath $c -Recurse -Force -ErrorAction SilentlyContinue
    Write-Output "cleared: $c"
  }
}
$vout = "$env:TEMP\vite-dev-out.log"
$verr = "$env:TEMP\vite-dev-err.log"
Remove-Item -LiteralPath $vout, $verr -Force -ErrorAction SilentlyContinue
Start-Process -FilePath $vite `
  -ArgumentList @("--host", "127.0.0.1", "--port", "5173", "--strictPort") `
  -WorkingDirectory $root `
  -RedirectStandardOutput $vout `
  -RedirectStandardError $verr `
  -WindowStyle Hidden
Start-Sleep -Seconds 6
$probe = $null
try {
  $probe = Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -UseBasicParsing -TimeoutSec 8
} catch {
  Write-Output "PROBE FAILED: $($_.Exception.Message)"
}
if ($probe) {
  Write-Output "PROBE HTTP $($probe.StatusCode) bytes=$($probe.RawContentLength) title=$($probe.Content -match '<title>')"
}
Write-Output "--- vite stdout tail ---"
if (Test-Path -LiteralPath $vout) {
  Get-Content -LiteralPath $vout | Select-Object -Last 6
}
Write-Output "--- vite stderr tail ---"
if (Test-Path -LiteralPath $verr) {
  Get-Content -LiteralPath $verr | Select-Object -Last 6
}
