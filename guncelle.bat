@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"
echo ============================================================
echo    Solar Arena - Guvenli Guncelleme
echo ============================================================
echo.
echo Bu dosya, SUNUCUDA CALISAN klasorde durmalidir.
echo Yeni surumu indirip bir klasore cikarin; asagiya o klasorun
echo yolunu yapistirin. Kod dosyalari guncellenir, verileriniz
echo (data.json = urunler, kategoriler, IBAN, kullanicilar) KORUNUR.
echo.
set /p KAYNAK="Yeni dosyalarin cikarildigi klasor: "
if not exist "!KAYNAK!\server.js" (
  echo.
  echo HATA: "!KAYNAK!" icinde server.js bulunamadi. Yol yanlis gorunuyor.
  pause
  exit /b 1
)
echo.
echo Guncelleme oncesi verilerinizin yedegi aliniyor...
if exist data.json copy /y data.json "data.guncelleme-oncesi.json" >nul
echo Kod dosyalari kopyalaniyor (verileriniz haric tutuluyor)...
robocopy "!KAYNAK!" "%~dp0." /E /XF data.json data.json.tmp data.yedek.json data.guncelleme-oncesi.json mail-ayarlari.json *.log /XD .git >nul
echo.
echo ============================================================
echo    TAMAM - Kodlar guncellendi, verileriniz korundu.
echo    Sunucuyu yeniden baslatin (baslat.bat).
echo ============================================================
pause
