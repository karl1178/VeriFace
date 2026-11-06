@echo off
title Veriface
if not exist "%~dp0.env" (
  echo File .env tidak ditemukan. Salin .env.example menjadi .env dan isi semua nilainya.
  pause
  exit /b 1
)
for /f "usebackq tokens=1,* delims==" %%A in ("%~dp0.env") do (
  if "%%A"=="AI_SERVICE_URL" set "AI_SERVICE_URL=%%B"
  if "%%A"=="FRONTEND_URL" set "FRONTEND_URL=%%B"
)
if not defined AI_SERVICE_URL (
  echo AI_SERVICE_URL belum diatur di .env.
  pause
  exit /b 1
)
if not defined FRONTEND_URL (
  echo FRONTEND_URL belum diatur di .env.
  pause
  exit /b 1
)
echo [1/3] Menyalakan Server AI (FastAPI)...
start "Server AI (FastAPI)" /MIN cmd /k ""%~dp0venv\Scripts\python.exe" -m uvicorn main:app --app-dir "%~dp0ai-service""

echo.
echo Menunggu Server AI siap...
powershell -NoProfile -Command "1..30 | ForEach-Object { try { Invoke-WebRequest -UseBasicParsing -Uri '%AI_SERVICE_URL%/openapi.json' -TimeoutSec 1 | Out-Null; exit 0 } catch { Start-Sleep -Seconds 1 } }; exit 1"
if errorlevel 1 (
  echo Server AI tidak merespons di %AI_SERVICE_URL%.
  echo Periksa jendela Server AI untuk melihat pesan error.
  pause
  exit /b 1
)

echo [2/3] Menyalakan Server Utama (Express)...
start "Server Express (Node.js)" /MIN cmd /k "cd /d ""%~dp0backend"" && npm start"

echo [3/3] Menyalakan Web Frontend...
start "Web Server (Vite)" /MIN cmd /k "cd /d ""%~dp0frontend"" && npm run dev -- --host 0.0.0.0"

echo.
echo Menunggu server siap...
timeout /t 3 >nul

echo Membuka Browser...
start %FRONTEND_URL%/scanner
start %FRONTEND_URL%/dashboard

echo.
echo Selesai! Semua server berjalan di latar (Minimize).
echo Anda bisa menutup jendela hitam ini jika browser sudah terbuka.
pause