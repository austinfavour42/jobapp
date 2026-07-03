# Native PowerShell HTTP Server for AutoApply AI
$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "AutoApply AI Live Server started successfully!"
    Write-Host "Local Address: http://localhost:$port"
    Write-Host "Press Ctrl+C to terminate the server session."
} catch {
    Write-Error "Failed to start server: $_"
    exit 1
}

$baseDir = "C:\Users\HOME\.gemini\antigravity\scratch\job-tailor-applicator"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { 
            $urlPath = "/index.html" 
        }
        
        $filePath = Join-Path $baseDir $urlPath
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Set mime type
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($ext) {
                ".html" { $contentType = "text/html; charset=utf-8" }
                ".css"  { $contentType = "text/css; charset=utf-8" }
                ".js"   { $contentType = "application/javascript; charset=utf-8" }
                ".json" { $contentType = "application/json; charset=utf-8" }
                default { $contentType = "application/octet-stream" }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errorMsg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $errorMsg.Length
            $response.OutputStream.Write($errorMsg, 0, $errorMsg.Length)
        }
        $response.Close()
    } catch {
        # Catch connection resets or aborted requests gracefully
        # without stopping the server loop
    }
}
