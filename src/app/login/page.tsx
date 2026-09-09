"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { signIn } = await import("next-auth/react");
      const result = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#B8A9C9] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[#2D2D2D] tracking-tight">
            Meridian
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E8E4DF] p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#2D2D2D] mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-[#6B6B6B]">
              Sign in to continue your study journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#D4756A]/10 border border-[#D4756A]/20 text-[#D4756A] text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#2D2D2D] mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@university.edu"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E8E4DF] bg-white text-sm text-[#2D2D2D] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#B8A9C9] focus:ring-offset-1 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#2D2D2D] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E8E4DF] bg-white text-sm text-[#2D2D2D] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#B8A9C9] focus:ring-offset-1 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#2D2D2D] text-white rounded-lg text-sm font-medium hover:bg-[#404040] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B6B6B]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[#B8A9C9] font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
