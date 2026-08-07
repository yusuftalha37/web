@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo ============================================================
echo    Solar Arena - Masaustunden Otomatik Guncelleme
echo ============================================================
echo.

set HEDEF=C:\Users\WİN11 PRO\OneDrive\Desktop\soalrarena
set REPO=https://github.com/yusuftalha37/web.git
set DAL=claude/solar-energy-website-sy2koi

:: Hedef klasor yoksa olustur
if not exist "!HEDEF!" mkdir "!HEDEF!"

:: Gecici klasore git clone
set GECICI=%TEMP%\solararena-guncelleme-%RANDOM%
echo [1/3] GitHub'dan son surum indiriliyor...
git clone --depth 1 --branch %DAL% %REPO% "!GECICI!" >nul 2>&1
if errorlevel 1 (
  echo HATA: GitHub'dan indirilemedi. Internet baglantinizi ve git kurulumunu kontrol edin.
  echo   git yoksa: https://git-scm.com/download/win adresinden indirin.
  pause
  exit /b 1
)

echo [2/3] Kod dosyalari kopyalaniyor (verileriniz korunuyor)...
:: Veri dosyalari, uploads, .git haric her seyi kopyala
robocopy "!GECICI!" "!HEDEF!" /E /XF data.json data.json.tmp data.yedek.json data.guncelleme-oncesi.json mail-ayarlari.json *.log *.zip /XD .git node_modules uploads >nul

echo [3/3] Gecici dosyalar temizleniyor...
rd /s /q "!GECICI!" >nul 2>&1

echo.
echo ============================================================
echo    TAMAM! Dosyalar guncellendi:
echo    %HEDEF%
echo.
echo    Korunan dosyalar (dokunulmadi):
echo      - data.json (urunler, kategoriler, kullanicilar)
echo      - data.yedek.json (otomatik yedek)
echo      - mail-ayarlari.json (SMTP ayarlari)
echo      - uploads/ (yuklenen gorseller)
echo ============================================================
pause
