@echo off
chcp 65001 >nul
title Quantora Solar - Baslatici
cd /d "%~dp0"

echo ============================================================
echo    QUANTORA SOLAR - Site baslatiliyor...
echo ============================================================
echo.

REM --- Kontrol 1: server.js bu klasorde mi? ---
if not exist "%~dp0server.js" (
  echo [HATA] server.js bu klasorde bulunamadi.
  echo Bu dosyayi ^(baslat.bat^) site dosyalarinin oldugu klasore koyun.
  echo Ornek: C:\quantora  ^(icinde server.js, index.html, js\ ... olmali^)
  echo.
  pause
  exit /b 1
)

REM --- Kontrol 2: Node.js kurulu mu? ---
where node >nul 2>nul
if errorlevel 1 (
  echo [HATA] Node.js bulunamadi.
  echo https://nodejs.org adresinden LTS surumunu kurun, sonra tekrar deneyin.
  echo.
  pause
  exit /b 1
)

REM --- Kontrol 3: cloudflared kurulu mu? ---
where cloudflared >nul 2>nul
if errorlevel 1 (
  echo [HATA] cloudflared bulunamadi.
  echo https://github.com/cloudflare/cloudflared/releases adresinden kurun.
  echo.
  pause
  exit /b 1
)

REM --- Kontrol 4: config.yml var mi? ---
if not exist "%~dp0config.yml" (
  echo [HATA] config.yml bulunamadi ^(Cloudflare tunel ayari^).
  echo config.yml dosyasi bu klasorde olmali.
  echo.
  pause
  exit /b 1
)

echo [1/2] Web sunucusu baslatiliyor ^(server.js^)...
start "Quantora Sunucu (server.js)" cmd /k "cd /d "%~dp0" && node server.js"

REM Sunucunun ayaga kalkmasi icin kisa bekleme
timeout /t 3 /nobreak >nul

echo [2/2] Cloudflare tuneli baglaniyor ^(solararena.store^)...
start "Cloudflare Tunnel (solararenastore)" cmd /k "cloudflared tunnel --config "%~dp0config.yml" run solararenastore"

REM Tunel baglaninca siteyi tarayicida ac
timeout /t 6 /nobreak >nul
start "" "https://solararena.store"

echo.
echo ============================================================
echo  Iki pencere acildi:
echo    - "Quantora Sunucu"   -^> siteyi ve verileri sunar
echo    - "Cloudflare Tunnel" -^> solararena.store'u sunucuya baglar
echo.
echo  Site adresi: https://solararena.store
echo.
echo  NOT: Bu iki pencere ACIK KALMALI. Kapatirsaniz site kapanir.
echo  Bu baslatici penceresini simdi kapatabilirsiniz.
echo ============================================================
echo.
pause
