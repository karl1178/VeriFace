@echo off
title Sistem Absensi Wajah AI
echo ===================================================
echo     MEMULAI SISTEM ABSENSI WAJAH AI (1-KLIK)
echo ===================================================

echo.
echo [1/3] Menyalakan Server AI (FastAPI)...
start "Server AI (FastAPI)" /MIN cmd /k "cd /d ""%~dp0ai-service"" && ""%~dp0venv\Scripts\python.exe"" -m uvicorn main:app"

echo [2/3] Menyalakan Server Utama (Express)...
start "Server Express (Node.js)" /MIN cmd /k "cd /d ""%~dp0backend"" && npm start"

echo [3/3] Menyalakan Web Frontend...
start "Web Server (Python)" /MIN cmd /k "python -m http.server 3000 --directory ""%~dp0frontend"""

echo.
echo Menunggu server siap...
timeout /t 3 >nul

echo Membuka Browser...
start http://localhost:3000
start http://localhost:3000/dashboard.html

echo.
echo Selesai! Semua server berjalan di latar (Minimize).
echo Anda bisa menutup jendela hitam ini jika browser sudah terbuka.
pause