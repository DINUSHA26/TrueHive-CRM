"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  ShoppingCart,
  Users,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("කරුණාකර ඔබගේ ඊමේල් ලිපිනය සහ මුරපදය ඇතුළත් කරන්න.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "පිවිසීම අසාර්ථකයි. කරුණාකර නැවත උත්සාහ කරන්න.");
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem("truehive_token", data.token);
        document.cookie = `truehive_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `truehive_auth_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      }

      if (rememberMe) {
        localStorage.setItem("truehive_user", JSON.stringify(data.user));
      } else {
        sessionStorage.setItem("truehive_user", JSON.stringify(data.user));
      }

      window.location.href = "/";
    } catch {
      setError("සම්බන්ධතා දෝෂයක් ඇති විය. කරුණාකර ජාල සම්බන්ධතාව පරීක්ෂා කරන්න.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-blue-600 selection:text-white">
      {/* Background radial gradient decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl bg-[#0a1120] border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-xl">
        {/* Left Hero / Brand Showcase (5 Columns on Desktop) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-950/40 via-[#0c1527] to-[#0a1120] p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between">
          <div>
            {/* Business Brand */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center p-1.5 shadow-lg shadow-amber-500/10">
                <img
                  src="/logo.png"
                  alt="TrueHive Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">TrueHive</h1>
                <p className="text-xs text-slate-400">Management Portal</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-snug">
                Powering Modern Business Operations
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized business portal integrating point of sale, customer engagement, stock management, and financial reporting.
              </p>
            </div>

            {/* Feature Points */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">Live Retail POS & Inventory</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Fast barcode scanning with instant recipe and stock synchronization.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">Customer Relationship Hub</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Lead pipelines, order histories, and automated customer communication.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">Financial & Ledger Insights</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Real-time cash flow records, profit tracking, and executive sync.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/60 mt-8 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Enterprise SSL Secured
            </span>
            <span>Version 2.0</span>
          </div>
        </div>

        {/* Right Authentication Form (7 Columns on Desktop) */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-[#0a1120]/95">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Sign In</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your registered work credentials to access your portal.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() =>
                      alert("කරුණාකර ඔබගේ මුරපදය නැවත සැකසීමට ප්‍රධාන පරිපාලක (Super Admin) අමතන්න.")
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs text-slate-400">Keep me signed in</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/25 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 text-center">
              <p className="text-[11px] text-slate-400">
                Need access or facing login issues? Contact your portal administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
