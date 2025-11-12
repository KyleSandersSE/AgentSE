@echo off
echo Starting web server...
echo.
echo Open your browser and go to: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8080/'); $listener.Start(); Write-Host 'Server started on http://localhost:8080'; Write-Host 'Press Ctrl+C to stop...'; while ($listener.IsListening) { $context = $listener.GetContext(); $request = $context.Request; $response = $context.Response; $filepath = $request.Url.LocalPath; if ($filepath -eq '/') { $filepath = '/index.html'; }; $filepath = Join-Path (Get-Location) $filepath.TrimStart('/'); if (Test-Path $filepath) { $content = [System.IO.File]::ReadAllBytes($filepath); $response.ContentType = if ($filepath -match '\.html$') { 'text/html' } elseif ($filepath -match '\.js$') { 'application/javascript' } elseif ($filepath -match '\.css$') { 'text/css' } elseif ($filepath -match '\.csv$') { 'text/csv' } else { 'application/octet-stream' }; $response.ContentLength64 = $content.Length; $response.OutputStream.Write($content, 0, $content.Length); } else { $response.StatusCode = 404; }; $response.Close(); }"

