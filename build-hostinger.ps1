# The static site books through the TurfOS public API. The URL is baked in at
# build time and is NOT a secret (there is no API key anywhere in this site).
# Without it the build would silently point at localhost.
if (-not $env:NEXT_PUBLIC_TURFOS_API_URL) {
  Write-Host "Set NEXT_PUBLIC_TURFOS_API_URL first, e.g.  `$env:NEXT_PUBLIC_TURFOS_API_URL = 'https://turfos.example.com'" -ForegroundColor Red
  exit 1
}
if ($env:NEXT_PUBLIC_TURFOS_API_URL -match 'localhost|127\.0\.0\.1') {
  Write-Host "NEXT_PUBLIC_TURFOS_API_URL points at localhost - refusing to build a production zip." -ForegroundColor Red
  exit 1
}

Write-Host ">>> 1. Building Next.js Static Export (TurfOS: $env:NEXT_PUBLIC_TURFOS_API_URL)..." -ForegroundColor Cyan
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

Write-Host ">>> 4. Creating Hostinger ZIP package..." -ForegroundColor Cyan
$zipPath = "$env:USERPROFILE\Desktop\thepavilionclub-hostinger.zip"
Compress-Archive -Path "$PSScriptRoot\apps\web\out\*" -DestinationPath $zipPath -Force

Write-Host ">>> SUCCESS! Pristine static zip ready on Desktop: $zipPath" -ForegroundColor Green
