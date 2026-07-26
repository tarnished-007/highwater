# Normalises any screenshot to the exact size the Chrome Web Store accepts.
#
#   powershell -ExecutionPolicy Bypass -File store\make-screenshot.ps1 "C:\path\shot.png"
#   powershell -ExecutionPolicy Bypass -File store\make-screenshot.ps1 "C:\path\shot.png" -Size 640x400
#
# The image is scaled to fit (never distorted, never upscaled past 1:1) and
# centred on a #121212 background matching the Highwater panel.
# Output: store\screenshots\<name>-1280x800.png

param(
  [Parameter(Mandatory = $true)][string]$Path,
  [string]$Size = "1280x800"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $Path)) { throw "No such file: $Path" }

$parts = $Size.ToLower().Split("x")
if ($parts.Count -ne 2) { throw "Size must look like 1280x800" }
$targetW = [int]$parts[0]
$targetH = [int]$parts[1]

$src = [System.Drawing.Image]::FromFile((Resolve-Path $Path))
try {
  # scale to fit inside the canvas; don't blow up a small screenshot
  $scale = [Math]::Min($targetW / $src.Width, $targetH / $src.Height)
  if ($scale -gt 1) { $scale = 1 }
  $w = [int][Math]::Round($src.Width * $scale)
  $h = [int][Math]::Round($src.Height * $scale)
  $x = [int](($targetW - $w) / 2)
  $y = [int](($targetH - $h) / 2)

  $canvas = New-Object System.Drawing.Bitmap($targetW, $targetH)
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  try {
    $g.Clear([System.Drawing.ColorTranslator]::FromHtml("#121212"))
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, $x, $y, $w, $h)
  } finally {
    $g.Dispose()
  }

  $outDir = Join-Path $PSScriptRoot "screenshots"
  if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
  $base = [System.IO.Path]::GetFileNameWithoutExtension($Path)
  $out = Join-Path $outDir "$base-${targetW}x${targetH}.png"
  $canvas.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose()

  Write-Output "Source: $($src.Width)x$($src.Height)"
  Write-Output "Placed: ${w}x${h} at ${x},${y}"
  Write-Output "Wrote:  $out"
} finally {
  $src.Dispose()
}
