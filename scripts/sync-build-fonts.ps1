<#
.SYNOPSIS
  把宿主机的中文字体同步到 docker/fonts/，供镜像构建时装入。
.DESCRIPTION
  从 C:\Windows\Fonts 拷贝宋体/黑体/楷体/仿宋/雅黑到 docker/fonts/。
  这些字体为微软专有字体，已被 .gitignore 排除，不会进入版本库。
  用法：powershell -ExecutionPolicy Bypass -File scripts/sync-build-fonts.ps1
#>
[CmdletBinding()]
param([string]$TargetDir)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $TargetDir) { $TargetDir = Join-Path $repoRoot 'docker/fonts' }
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

$map = @{
  'simsun.ttc'  = '宋体 / 新宋体'
  'simhei.ttf'  = '黑体'
  'simkai.ttf'  = '楷体'
  'simfang.ttf' = '仿宋'
  'msyh.ttc'    = '微软雅黑'
}
$missing = @()
foreach ($name in $map.Keys) {
  $src = Join-Path $env:SystemRoot "Fonts\$name"
  if (Test-Path $src) {
    Copy-Item $src $TargetDir -Force
    Write-Host ("  ✓ {0,-12} {1}" -f $name, $map[$name])
  } else {
    $missing += $name
    Write-Host ("  ✗ {0,-12} 未找到（{1}）" -f $name, $src) -ForegroundColor Yellow
  }
}
$size = (Get-ChildItem $TargetDir -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -ne '.md' } | Measure-Object -Property Length -Sum).Sum
Write-Host ("`n字体目录: {0}" -f $TargetDir)
Write-Host ("合计: {0:N1} MB" -f ($size / 1MB))
if ($missing.Count -gt 0) { Write-Host ("缺失: {0}" -f ($missing -join ', ')) -ForegroundColor Yellow }
Write-Host "`n下一步：docker compose build  （字体将在构建时装入镜像）"