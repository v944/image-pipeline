$ErrorActionPreference = "Continue"
$root = "E:\Image Pipeline\image-pipeline"
$vite = "$root\node_modules\.bin\vite.cmd"

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 900

$caches = @(
  "$root\node_modules\.vite",
  "$root\node_modules\.vitest"
)
foreach ($c in $caches) {
  if (Test-Path -LiteralPath $c) {
    Remove-Item -LiteralPath $c -Recurse -Force -ErrorAction SilentlyContinue
  }
}

$vout = "$env:TEMP\vite2-out.log"
$verr = "$env:TEMP\vite2-err.log"
Remove-Item -LiteralPath $vout, $verr -Force -ErrorAction SilentlyContinue

Start-Process -FilePath $vite `
  -ArgumentList @("--host", "127.0.0.1", "--port", "5173", "--strictPort") `
  -WorkingDirectory $root `
  -RedirectStandardOutput $vout `
  -RedirectStandardError $verr `
  -WindowStyle Hidden
Start-Sleep -Seconds 7

$probe = $null
try {
  $probe = Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -UseBasicParsing -TimeoutSec 8
} catch {
  "ROOT PROBE FAILED: $($_.Exception.Message)"
}
if ($probe) {
  "ROOT HTTP $($probe.StatusCode) bytes=$($probe.RawContentLength) title=$($probe.Content -match '<title>') rootDiv=$($probe.Content -match 'id="root"')"
}

$mod = $null
try {
  $mod = Invoke-WebRequest -Uri "http://127.0.0.1:5173/src/core/PipelineEngine.ts" -UseBasicParsing -TimeoutSec 8
} catch {
  "MODULE PROBE FAILED: $($_.Exception.Message)"
}
if ($mod) {
  "MODULE HTTP $($mod.StatusCode) bytes=$($mod.RawContentLength)"
  "  starts-like-js: $($mod.Content.TrimStart().StartsWith('import'))"
  "  has-parse-error-txt: $($mod.Content -match 'Invalid Unicode escape|Maximum call stack|PARSE_ERROR')"
  $i = $mod.Content.IndexOf("topologicalSortNodes(chain")
  if ($i -ge 0) { "  topo-call-snippet: " + $mod.Content.Substring($i, 40) }
}

"--- vite stdout tail ---"
if (Test-Path -LiteralPath $vout) { Get-Content -LiteralPath $vout | Select-Object -Last 5 }
"--- vite stderr tail ---"
if (Test-Path -LiteralPath $verr) { Get-Content -LiteralPath $verr | Select-Object -Last 5 }
"=== DONE ==="