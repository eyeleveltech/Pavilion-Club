Write-Host ">>> 1. Building Next.js Static Export..." -ForegroundColor Cyan
pnpm --filter @pavilion/web build

Write-Host ">>> 2. Writing .htaccess for Hostinger LiteSpeed/Apache..." -ForegroundColor Cyan
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
[System.IO.File]::WriteAllText("$PSScriptRoot/apps/web/out/.htaccess", $htaccess, [System.Text.UTF8Encoding]::new($false))

Write-Host ">>> 3. Creating Hostinger ZIP package..." -ForegroundColor Cyan
$zipPath = "$env:USERPROFILE/Desktop/thepavilionclub-hostinger.zip"
Push-Location "$PSScriptRoot/apps/web/out"
tar -a -cf "$zipPath" * .htaccess
Pop-Location

Write-Host ">>> SUCCESS! Static zip ready on Desktop: $zipPath" -ForegroundColor Green
