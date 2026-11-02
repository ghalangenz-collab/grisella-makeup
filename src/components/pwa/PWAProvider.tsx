'use client';

import { useState, useEffect } from 'react';
import { Download, Sparkles, X, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    // 1. REGISTER SERVICE WORKER DENGAN AUTO-UPDATE DETECTION
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Cek update saat register dan saat tab kembali aktif
          reg.update();

          const onFocus = () => reg.update();
          window.addEventListener('focus', onFocus);

          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Ada versi baru hasil deploy Vercel, reload otomatis untuk update instan
                  console.log('Versi baru Grisella Makeup terdeteksi, memperbarui otomatis...');
                  window.location.reload();
                }
              };
            }
          };
        })
        .catch((err) => console.log('SW registration skipped:', err));

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // 2. CEK APAKAH SUDAH TERINSTAL (STANDALONE MODE)
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isApp);

    // 3. DETEKSI PERANGKAT iOS / APPLE
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 4. TANGKAP EVENT INSTALL PROMPT UNTUK ANDROID / CHROME
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 5. DENGARKAN EVENT DARI TOMBOL NAVBAR ATAU LINK LAIN
    const handleTriggerFromNavbar = () => {
      // Panggil prompt jika ada, atau buka modal iOS / panduan
      const ua = window.navigator.userAgent.toLowerCase();
      const isApple = /iphone|ipad|ipod/.test(ua);
      if (isApple) {
        setShowIOSModal(true);
        return;
      }
      setDeferredPrompt((prompt) => {
        if (prompt) {
          prompt.prompt();
          prompt.userChoice.then((choice) => {
            if (choice.outcome === 'accepted') {
              setShowBanner(false);
            }
          });
          return null;
        } else {
          setShowIOSModal(true);
          return null;
        }
      });
    };
    window.addEventListener('pwa-install-click', handleTriggerFromNavbar);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-install-click', handleTriggerFromNavbar);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    } else {
      // Jika browser tidak menembakkan prompt, tampilkan panduan
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {children}

      {/* FLOATING LUXURY INSTALL APP ICON / BANNER (Hanya tampil jika belum terinstal) */}
      {!isStandalone && showBanner && (
        <aside aria-label="Pasang Aplikasi" className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#2D2424] text-white rounded-3xl p-3.5 shadow-2xl border-2 border-[#C97A7E] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAEDF0] border border-[#F1DADF] flex items-center justify-center text-[#C97A7E] shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 text-[#C97A7E]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-serif font-bold text-xs text-white leading-tight flex items-center gap-1.5">
                  <span>Pasang Aplikasi Grisella</span>
                </h4>
                <p className="text-[10px] text-[#D1C7C7] truncate mt-0.5">
                  Akses instan di Android & iPhone tanpa unduh di Play Store
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="py-2 px-3 rounded-xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pasang</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                title="Tutup banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* MODAL PANDUAN INSTALASI iOS / SAFARI */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-[#EBDCD5] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1DADF]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAEDF0] flex items-center justify-center text-[#C97A7E]">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#2D2424]">
                    Cara Pasang di iPhone / iPad
                  </h3>
                  <span className="text-[10px] text-[#8A797A]">Hanya 3 langkah cepat di Safari</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-xl text-[#635354] hover:bg-[#FAEDF0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#2D2424]">
              {/* Langkah 1 */}
              <div className="p-3 bg-white border border-[#EBDCD5] rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FAEDF0] text-[#8C4247] font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <span className="font-semibold block">Tekan tombol Bagikan (Share)</span>
                  <p className="text-[11px] text-[#635354] mt-0.5">
                    Ketuk ikon kotak berpanah atas <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> di bilah bawah browser Safari kamu.
                  </p>
                </div>
              </div>

              {/* Langkah 2 */}
              <div className="p-3 bg-white border border-[#EBDCD5] rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FAEDF0] text-[#8C4247] font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <span className="font-semibold block">Pilih Tambah ke Layar Utama</span>
                  <p className="text-[11px] text-[#635354] mt-0.5">
                    Gulir ke bawah menu Safari, lalu pilih menu{' '}
                    <strong>&ldquo;Tambah ke Layar Utama&rdquo; (Add to Home Screen)</strong>{' '}
                    <Plus className="w-3.5 h-3.5 inline mx-1 text-zinc-700" />.
                  </p>
                </div>
              </div>

              {/* Langkah 3 */}
              <div className="p-3 bg-white border border-[#EBDCD5] rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FAEDF0] text-[#8C4247] font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <span className="font-semibold block">Tekan &ldquo;Tambah&rdquo; (Add)</span>
                  <p className="text-[11px] text-[#635354] mt-0.5">
                    Tekan tombol Tambah di pojok kanan atas layar. Ikon Grisella Makeup akan muncul di homescreen iPhone kamu!
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-2xl bg-[#C97A7E] text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-98"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
