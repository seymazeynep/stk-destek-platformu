@echo off
cd /d "%~dp0"
title STK Destek ve Dayanisma Platformu
echo ===================================================
echo 🇹🇷 STK Destek ve Dayanisma Platformu Baslatiliyor...
echo ===================================================
python "%~dp0run.py"
if errorlevel 1 (
  echo.
  echo Sunucu baslatilamadi. Yukaridaki hata mesajini kontrol edin.
)
pause
