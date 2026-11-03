'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { setUserSession, getUserSession } from '@/lib/auth-user';

type AuthMode = 'login' | 'register' | 'otp';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const redirectTo = searchParams.get('redirect') || '/akun';

  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP State (6 Digits)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpType, setOtpType] = useState<'signup' | 'email'>('signup');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect jika user sudah login
  useEffect(() => {
    const existing = getUserSession();
    if (existing) {
      router.push(redirectTo);
    }
  }, [router, redirectTo]);

  // Bersihkan cache service worker lawas seketika di halaman login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.update();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            if (name !== 'grisella-makeup-v6') {
              caches.delete(name);
            }
          });
        });
      }
    }
  }, []);

  // Timer cooldown kirim ulang OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Helper sync user ke server & localStorage
  const syncAndFinalizeLogin = async (userData: {
    id?: string;
    email: string;
    full_name?: string;
    phone?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_id: userData.id,
          email: userData.email,
          full_name: userData.full_name || fullName || userData.email.split('@')[0],
          phone: userData.phone || phone || '',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.user) {
          setUserSession(json.user);
          setSuccessMsg('Berhasil masuk! Mengalihkan...');
          setTimeout(() => router.push(redirectTo), 900);
          return;
        }
      }
    } catch (e) {
      console.warn('Sync user fallback to local session:', e);
    }

    // Fallback jika API sync offline
    setUserSession({
      id: userData.id || `usr-${Date.now()}`,
      email: userData.email,
      full_name: userData.full_name || fullName || userData.email.split('@')[0],
      phone: userData.phone || phone || '',
      role: 'user',
    });
    setSuccessMsg('Berhasil masuk! Mengalihkan...');
    setTimeout(() => router.push(redirectTo), 900);
  };

  // 1. SUBMIT LOGIN DENGAN PASSWORD (STRICT SERVER API)
  const handleLoginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needs_otp) {
          setOtpType('signup');
          setMode('otp');
          setResendCooldown(45);
          setErrorMsg(data.error);
          return;
        }
        setErrorMsg(data.error || 'Email atau password yang kamu masukkan salah.');
        return;
      }

      if (data.user) {
        setUserSession(data.user);
        setSuccessMsg('Berhasil masuk! Mengalihkan ke dashboard akun...');
        setTimeout(() => router.push(redirectTo), 700);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  // 2. SUBMIT DAFTAR AKUN BARU (STRICT SERVER API)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap wajib diisi');
      setLoading(false);
      return;
    }

    if (!cleanPhone) {
      setErrorMsg('Nomor WhatsApp wajib diisi');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: cleanPhone,
          email: cleanEmail,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal mendaftarkan akun.');
        return;
      }

      if (data.isAutoConfirmed && data.user) {
        setUserSession(data.user);
        setSuccessMsg('Pendaftaran berhasil! Mengalihkan...');
        setTimeout(() => router.push(redirectTo), 700);
        return;
      }

      // Beralih ke layar input OTP 6 digit
      setOtpType('signup');
      setMode('otp');
      setResendCooldown(45);
      setSuccessMsg(`Pendaftaran berhasil! Kode verifikasi 6 digit telah dikirim ke ${cleanEmail}`);
    } catch (err: any) {
      console.error('Register error:', err);
      setErrorMsg('Gagal memproses pendaftaran. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  // 3. MINTA LOGIN DENGAN OTP GMAIL (STRICT SERVER API)
  const handleRequestOtpLogin = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      setErrorMsg('Masukkan alamat Gmail kamu terlebih dahulu di kolom email');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal mengirim kode OTP.');
      } else {
        setOtpType('email');
        setMode('otp');
        setResendCooldown(45);
        setSuccessMsg(data.message || `Kode OTP 6 digit telah dikirim ke ${cleanEmail}`);
      }
    } catch (err: any) {
      console.error('OTP Request error:', err);
      setErrorMsg('Gagal mengirim kode OTP. Periksa jaringan Anda.');
    } finally {
      setLoading(false);
    }
  };

  // 4. VERIFIKASI KODE OTP (STRICT SERVER API)
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = otpDigits.join('').trim();
    if (token.length !== 6) {
      setErrorMsg('Harap masukkan 6 digit kode OTP lengkap');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    const cleanEmail = email.toLowerCase().trim();

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          token,
          type: otpType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Kode OTP tidak valid atau sudah kedaluwarsa.');
        return;
      }

      if (data.user) {
        setUserSession(data.user);
        setSuccessMsg('Verifikasi berhasil! Mengalihkan ke dashboard akun...');
        setTimeout(() => router.push(redirectTo), 700);
      }
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      setErrorMsg('Gagal memverifikasi OTP. Periksa jaringan Anda.');
    } finally {
      setLoading(false);
    }
  };

  // Handler Input 6 Digit OTP (Auto-jump & Paste support)
  const handleOtpChange = (index: number, val: string) => {
    // Menangani paste teks utuh (misal "123456")
    if (val.length > 1) {
      const pasteNums = val.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasteNums.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasteNums.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const clean = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    // Auto-focus ke digit berikutnya jika ada angka yang diketik
    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 py-8">
      {/* Header Kembali ke Home */}
      <div className="w-full max-w-sm mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#635354] hover:text-[#C97A7E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        <span className="text-[10px] tracking-widest font-semibold text-[#C97A7E] uppercase">
          Portal Pelanggan
        </span>
      </div>

      {/* Card Utama Autentikasi */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#EBDCD5] space-y-5 relative">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-full bg-[#FAEDF0] border border-[#F1DADF] mx-auto flex items-center justify-center text-[#C97A7E] shadow-2xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-[#2D2424]">
            GRISELLA
          </h1>
          <p className="text-xs text-[#635354]">
            {mode === 'otp'
              ? 'Verifikasi Akun Pelanggan'
              : mode === 'register'
              ? 'Daftar Akun Baru Pelanggan'
              : 'Masuk ke Akun Pelanggan'}
          </p>
        </div>

        {/* Tab Switcher: Masuk vs Daftar (Hanya tampil saat bukan mode OTP) */}
        {mode !== 'otp' && (
          <div className="grid grid-cols-2 p-1 bg-[#FDFBF7] rounded-2xl border border-[#EBDCD5]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#C97A7E] text-white shadow-xs'
                  : 'text-[#635354] hover:text-[#2D2424]'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#C97A7E] text-white shadow-xs'
                  : 'text-[#635354] hover:text-[#2D2424]'
              }`}
            >
              Daftar Akun
            </button>
          </div>
        )}

        {/* Notifikasi Pesan Sukses / Error */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed flex-1">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 1: MASUK (LOGIN) */}
        {/* ============================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLoginWithPassword} className="space-y-4">
            <div className="space-y-3">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C97A7E]" />
                  <span>Alamat Gmail / Email</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@gmail.com"
                  className="w-full text-xs p-3 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#C97A7E]" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs p-3 pr-10 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#9C8E8F] hover:text-[#2D2424]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Tombol Submit Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-[#C97A7E] hover:bg-[#B5676B] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Pembatas Atau */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#F1DADF]"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold text-[#9C8E8F]">
                <span className="bg-white px-2">atau</span>
              </div>
            </div>

            {/* Tombol Masuk dengan OTP Gmail */}
            <button
              type="button"
              onClick={handleRequestOtpLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-2xl border border-[#EBDCD5] hover:border-[#C97A7E] bg-white hover:bg-[#FAEDF0]/40 text-[#2D2424] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#C97A7E]" />
              <span>Masuk Cepat dengan Kode OTP Gmail</span>
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* MODE 2: DAFTAR AKUN (REGISTER) */}
        {/* ============================================================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C97A7E]" />
                <span>Nama Lengkap</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Cth: Sarah Amanda"
                className="w-full text-xs p-3 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
              />
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C97A7E]" />
                <span>Nomor WhatsApp Aktif</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full text-xs p-3 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
              />
            </div>

            {/* Email Gmail */}
            <div>
              <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#C97A7E]" />
                <span>Alamat Gmail</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@gmail.com"
                className="w-full text-xs p-3 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#C97A7E]" />
                <span>Password (min. 6 karakter)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 pr-10 rounded-2xl border border-[#EBDCD5] bg-[#FDFBF7] text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#9C8E8F] hover:text-[#2D2424]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Info badge */}
            <div className="p-2.5 rounded-xl bg-[#FAEDF0]/50 border border-[#F1DADF] text-[11px] text-[#635354] leading-relaxed">
              🌸 Data booking & bukti transfer DP kamu akan otomatis tersimpan rapi di akun pelanggan ini.
            </div>

            {/* Tombol Daftar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-[#C97A7E] hover:bg-[#B5676B] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <>
                  <span>Daftar Akun & Dapatkan Kode OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* MODE 3: VERIFIKASI OTP (6 DIGIT) */}
        {/* ============================================================== */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[#2D2424]">
                Masukkan 6 Digit Kode OTP
              </p>
              <p className="text-[11px] text-[#635354]">
                Kode telah dikirimkan ke: <strong className="text-[#8C4247]">{email}</strong>
              </p>
            </div>

            {/* 6 Digit Input Boxes */}
            <div className="flex justify-center gap-2 pt-1">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-bold rounded-xl border-2 border-[#EBDCD5] focus:border-[#C97A7E] bg-[#FDFBF7] text-[#2D2424] focus:outline-none focus:ring-1 focus:ring-[#C97A7E] transition-all"
                />
              ))}
            </div>

            {/* Tombol Verifikasi */}
            <button
              type="submit"
              disabled={loading || otpDigits.join('').length !== 6}
              className="w-full py-3 px-4 rounded-2xl bg-[#C97A7E] hover:bg-[#B5676B] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Kode...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verifikasi & Masuk Sekarang</span>
                </>
              )}
            </button>

            {/* Kirim Ulang OTP / Kembali */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode(otpType === 'signup' ? 'register' : 'login');
                  setErrorMsg(null);
                }}
                className="text-[#635354] hover:text-[#2D2424] underline cursor-pointer text-[11px]"
              >
                ← Ubah Email
              </button>

              <button
                type="button"
                onClick={() => {
                  if (resendCooldown <= 0) {
                    if (otpType === 'signup') {
                      handleRegister({ preventDefault: () => {} } as any);
                    } else {
                      handleRequestOtpLogin();
                    }
                  }
                }}
                disabled={resendCooldown > 0}
                className="inline-flex items-center gap-1 font-semibold text-[#8C4247] hover:text-[#C97A7E] disabled:opacity-50 cursor-pointer text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>
                  {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim Ulang OTP'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Link Akses Admin Terpisah */}
        <div className="pt-3 border-t border-[#F1DADF] text-center">
          <p className="text-[11px] text-[#9C8E8F]">
            Kamu adalah MUA / Pemilik Grisella?{' '}
            <Link
              href="/admin/login"
              className="text-[#8C4247] hover:underline font-semibold"
            >
              Login Khusus Admin
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function UserAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#C97A7E]" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
