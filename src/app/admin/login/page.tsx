'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.toLowerCase().trim();

    try {
      // 1. Coba login melalui Supabase Auth
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.session) {
          localStorage.setItem('grisella_admin_session', JSON.stringify(data.session.user));
          router.push('/admin');
          return;
        }
      } catch {
        // Abaikan jika Supabase auth offline / belum terkonfigurasi
      }

      // 2. Akun resmi admin Grisella Makeup
      if (cleanEmail === 'grisellacarela@gmail.com' && password === 'taruna08') {
        localStorage.setItem(
          'grisella_admin_session',
          JSON.stringify({
            email: 'grisellacarela@gmail.com',
            name: 'Grisella Carela',
            role: 'owner',
            login_at: new Date().toISOString(),
          })
        );
        router.push('/admin');
        return;
      }

      setErrorMsg('Email atau password admin salah. Silakan coba kembali.');
      setLoading(false);
    } catch {
      setErrorMsg('Gagal terhubung ke layanan otentikasi. Silakan periksa koneksi.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#FAEDF0] border border-[#F1DADF] mx-auto flex items-center justify-center text-[#C97A7E] shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2D2424]">Dashboard Pemilik</h1>
          <p className="text-xs text-[#635354]">
            Masuk untuk mengelola reservasi, verifikasi DP, dan CRM Grisella Makeup.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#EBDCD5] rounded-3xl p-6 shadow-sm space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#C97A7E]" />
                <span>Email Admin</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="grisellacarela@gmail.com"
                className="w-full text-xs p-3 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2424] mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#C97A7E]" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-3 rounded-xl border border-[#EBDCD5] bg-white text-[#2D2424] focus:outline-none focus:border-[#C97A7E] focus:ring-1 focus:ring-[#C97A7E]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-[#9C8E8F] hover:text-[#2D2424] cursor-pointer"
          >
            &larr; Kembali ke Halaman Booking Klien
          </button>
        </div>
      </div>
    </main>
  );
}
