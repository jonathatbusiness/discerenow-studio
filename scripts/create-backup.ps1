param(
  [Parameter(Position = 0)]
  [string]$Reason = "checkpoint"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$safeReason = $Reason.ToLowerInvariant() -replace "[^a-z0-9-]", "-"
$safeReason = $safeReason -replace "-+", "-"
$safeReason = $safeReason.Trim("-")
if ([string]::IsNullOrWhiteSpace($safeReason)) {
  $safeReason = "checkpoint"
}

$stamp = Get-Date -Format "yyMMdd-HHmm"
$backupDir = Join-Path $root ".bk"
$baseName = "$stamp-$safeReason"
$zipPath = Join-Path $backupDir "$baseName.zip"
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("discerenow-backup-" + [guid]::NewGuid())
$statusPath = Join-Path $tempDir "backup-info.txt"
$patchPath = Join-Path $tempDir "changes.patch"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
New-Item -ItemType File -Force -Path $statusPath, $patchPath | Out-Null

if (Test-Path $zipPath) {
  throw "Ja existe um backup com este nome: $zipPath"
}

$status = @(
  "DiscereNow Studio backup"
  "Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"
  "Reason: $Reason"
  "Commit: $(git rev-parse HEAD 2>$null)"
  "Branch: $(git branch --show-current 2>$null)"
  ""
  "Working tree:"
  (git status --short 2>$null)
)
$status | Set-Content -Path $statusPath -Encoding UTF8
git diff HEAD | Set-Content -Path $patchPath -Encoding UTF8

$excludeArgs = @(
  "--exclude=.git",
  "--exclude=.bk",
  "--exclude=addin",
  "--exclude=node_modules",
  "--exclude=out",
  "--exclude=dist",
  "--exclude=build",
  "--exclude=*.zip",
  "--exclude=template/node_modules",
  "--exclude=template/dist",
  "--exclude=template/SCORM",
  "--exclude=template/temp_scorm_build"
)

& tar -a -c -f $zipPath @excludeArgs .
if ($LASTEXITCODE -ne 0 -or !(Test-Path $zipPath)) {
  throw "Falha ao criar o arquivo de backup."
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open(
  $zipPath,
  [System.IO.Compression.ZipArchiveMode]::Update
)
try {
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
    $archive,
    $statusPath,
    "backup-info.txt"
  ) | Out-Null
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
    $archive,
    $patchPath,
    "changes.patch"
  ) | Out-Null
} finally {
  $archive.Dispose()
  Remove-Item -LiteralPath $tempDir -Recurse -Force
}

$sizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "Backup criado: .bk/$baseName.zip ($sizeMb MB)"
Write-Host "O ZIP inclui backup-info.txt e changes.patch."
