Write-Host ">>> 1. Building Next.js Static Export..." -ForegroundColor Cyan
pnpm --dir "$PSScriptRoot" --filter @pavilion/web build

Write-Host ">>> 2. Installing Pristine Luxury Editorial Homepage to out/index.html..." -ForegroundColor Cyan
Copy-Item "$PSScriptRoot\apps\web\public\index.html" "$PSScriptRoot\apps\web\out\index.html" -Force

Write-Host ">>> 3. Writing .htaccess for Hostinger LiteSpeed/Apache..." -ForegroundColor Cyan
$htaccess = @"
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteCond %{DOCUMENT_ROOT}/$1/index.html -f
  RewriteRule ^(.*)/?$ $1/index.html [L]
  ErrorDocument 404 /404.html
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
"@
[System.IO.File]::WriteAllText("$PSScriptRoot\apps\web\out\.htaccess", $htaccess, [System.Text.UTF8Encoding]::new($false))

Write-Host ">>> 4. Creating Linux-compatible Hostinger ZIP package (forward slashes)..." -ForegroundColor Cyan
$zipPath = "$env:USERPROFILE\Desktop\thepavilionclub-hostinger.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$outDir = Resolve-Path "$PSScriptRoot\apps\web\out"
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

$count = 0
Get-ChildItem -Path $outDir -Recurse | ForEach-Object {
    if (-not $_.PSIsContainer) {
        $relPath = $_.FullName.Substring($outDir.Path.Length + 1).Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relPath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        $count++
    }
}
$zip.Dispose()

Write-Host ">>> SUCCESS! Packaged $count files with Linux forward-slashes: $zipPath" -ForegroundColor Green
