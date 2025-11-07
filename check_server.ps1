Write-Host "Checking if Next.js server is responding..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Server is responding!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Try opening: http://localhost:3000 in your browser"
    Write-Host ""
    Write-Host "If it still doesn't work, check:"
    Write-Host "  1. Browser console (F12) for errors"
    Write-Host "  2. Terminal window for compilation errors"
    Write-Host "  3. Try: http://127.0.0.1:3000"
} catch {
    Write-Host "❌ Server is not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the terminal window where 'npm run dev' is running for errors"
}









