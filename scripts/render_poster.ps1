# 1. Run Node script to generate the HTML with embedded QR code
node 'C:\Users\Pc\Documents\Eyelevel\Pavilion-Club\scripts\generate_story_poster.cjs'

# 2. Chrome headless render
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$posterHtml = 'C:\Users\Pc\Documents\Eyelevel\Pavilion-Club\pavilion_services_story_poster.html'
$posterPng = 'C:\Users\Pc\Documents\Eyelevel\Pavilion-Club\apps\web\public\assets\qr\pavilion_services_story_poster.png'
$tempUserDir = "C:\Users\Pc\AppData\Local\Temp\chrome_story_poster_render"

if (Test-Path $tempUserDir) {
    Remove-Item -Recurse -Force $tempUserDir -ErrorAction SilentlyContinue
}

Write-Host "Rendering 1080x1920 Instagram Story Poster via Chrome Headless..."
$htmlUri = "file:///" + ($posterHtml -replace "\\", "/")

Start-Process -FilePath $chrome -ArgumentList @(
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--user-data-dir=$tempUserDir",
    "--window-size=1080,1920",
    "--screenshot=$posterPng",
    $htmlUri
) -Wait

if (Test-Path $posterPng) {
    Write-Host "SUCCESS: Story poster generated!"
    Copy-Item $posterPng -Destination 'C:\Users\Pc\Documents\Eyelevel\Pavilion-Club\pavilion_services_story_poster.png' -Force
    Copy-Item $posterPng -Destination 'C:\Users\Pc\.gemini\antigravity\brain\3016575f-6a97-4c03-b1ed-c7c1906f4c5a\pavilion_services_story_poster.png' -Force
    
    $qrPng = 'C:\Users\Pc\Documents\Eyelevel\Pavilion-Club\apps\web\public\assets\qr\pavilion_services_qr.png'
    Copy-Item $qrPng -Destination 'C:\Users\Pc\Documents\Eyelevel\Pavilion-Club\pavilion_services_qr.png' -Force
    Copy-Item $qrPng -Destination 'C:\Users\Pc\.gemini\antigravity\brain\3016575f-6a97-4c03-b1ed-c7c1906f4c5a\pavilion_services_qr.png' -Force

    Get-Item $posterPng, $qrPng | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "FAILED: Poster PNG not found."
    exit 1
}
