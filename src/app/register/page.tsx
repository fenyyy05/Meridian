"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, User, Loader2, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const allChecksPassed = Object.values(passwordChecks).every(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!allChecksPassed) {
      setError("Please meet all password requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email.toLowerCase(), password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Sign in after successful registration
      const { signIn } = await import("next-auth/react");
      const result = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please log in.");
        setLoading(false);
      } else {
        router.push("/onboarding");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center px-4 py-8">
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
              Create your account
            </h1>
            <p className="text-sm text-[#6B6B6B]">
              Start your personalized study journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#D4756A]/10 border border-[#D4756A]/20 text-[#D4756A] text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#2D2D2D] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                  placeholder="Alex Chen"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E8E4DF] bg-white text-sm text-[#2D2D2D] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#B8A9C9] focus:ring-offset-1 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2D2D2D] mb-1.5">
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
              <label htmlFor="password" className="block text-sm font-medium text-[#2D2D2D] mb-1.5">
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
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E8E4DF] bg-white text-sm text-[#2D2D2D] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#B8A9C9] focus:ring-offset-1 transition-colors"
                />
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  {[
                    { key: "length" as const, label: "At least 8 characters" },
                    { key: "lowercase" as const, label: "One lowercase letter" },
                    { key: "uppercase" as const, label: "One uppercase letter" },
                    { key: "number" as const, label: "One number" },
                  ].map((check) => (
                    <div key={check.key} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          passwordChecks[check.key]
                            ? "bg-[#B5C9B3]"
                            : "bg-[#E8E4DF]"
                        }`}
                      >
                        {passwordChecks[check.key] && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <span
                        className={`text-xs ${
                          passwordChecks[check.key]
                            ? "text-[#7A9B77]"
                            : "text-[#9B9B9B]"
                        }`}
                      >
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#2D2D2D] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E8E4DF] bg-white text-sm text-[#2D2D2D] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#B8A9C9] focus:ring-offset-1 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !allChecksPassed}
              className="w-full h-11 bg-[#2D2D2D] text-white rounded-lg text-sm font-medium hover:bg-[#404040] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B6B6B]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#B8A9C9] font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
