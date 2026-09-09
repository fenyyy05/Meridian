import Link from "next/link";
import {
  Brain,
  Target,
  Clock,
  BarChart3,
  BookOpen,
  Sparkles,
  ArrowRight,
  Zap,
  TrendingUp,
  Shield,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FBF8F3]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FBF8F3]/80 backdrop-blur-md border-b border-[#E8E4DF]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#B8A9C9] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#2D2D2D] tracking-tight">
              Meridian
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#6B6B6B] hover:text-[#2D2D2D] transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-[#2D2D2D] text-white px-5 py-2.5 rounded-lg hover:bg-[#404040] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main id="main-content">
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Decorative element */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-[#B8A9C9]/10 border border-[#B8A9C9]/20 rounded-full px-4 py-1.5">
                <Zap className="w-3.5 h-3.5 text-[#B8A9C9]" />
                <span className="text-xs font-medium text-[#8B7BA8]">
                  AI-Powered Academic Intelligence
                </span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#2D2D2D] tracking-tight leading-[1.1] mb-6">
              Find your direction.
              <br />
              <span className="text-[#B8A9C9]">Make your time count.</span>
            </h1>

            <p className="text-lg sm:text-xl text-[#6B6B6B] max-w-2xl mx-auto mb-10 leading-relaxed">
              Meridian learns how you study, predicts when you&apos;ll be
              distracted, identifies your struggle areas, and adapts your
              schedule — so every minute of study actually matters.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-[#2D2D2D] text-white px-8 py-3.5 rounded-xl text-base font-medium hover:bg-[#404040] transition-colors shadow-sm"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 text-[#6B6B6B] px-8 py-3.5 rounded-xl text-base font-medium hover:text-[#2D2D2D] hover:bg-white transition-colors border border-[#E8E4DF]"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </section>

        {/* Intelligence Loop */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-[#E8E4DF] p-8 sm:p-12">
              <p className="text-xs font-semibold text-[#B8A9C9] uppercase tracking-widest mb-3">
                The Intelligence Loop
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-8">
                Not another to-do app. A system that learns.
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                  { label: "Plan", icon: Target, color: "#A7C4D4" },
                  { label: "Focus", icon: Clock, color: "#B8A9C9" },
                  { label: "Track", icon: BarChart3, color: "#B5C9B3" },
                  { label: "Analyze", icon: TrendingUp, color: "#D4C5A9" },
                  { label: "Predict", icon: Brain, color: "#E8C4C4" },
                  { label: "Recommend", icon: BookOpen, color: "#A7C4D4" },
                  { label: "Adapt", icon: Sparkles, color: "#B8A9C9" },
                ].map((step, i) => (
                  <div key={step.label} className="flex flex-col items-center text-center">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${step.color}20` }}
                    >
                      <step.icon className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <span className="text-sm font-semibold text-[#2D2D2D]">
                      {step.label}
                    </span>
                    {i < 6 && (
                      <ArrowRight className="w-3 h-3 text-[#E8E4DF] mt-2 hidden lg:block rotate-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-semibold text-[#B8A9C9] uppercase tracking-widest mb-3 text-center">
              Core Capabilities
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-12 text-center">
              Everything a serious student needs
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Brain,
                  title: "Distraction Risk Prediction",
                  desc: "ML model predicts when you're likely to lose focus, based on your actual behavior patterns — not guesswork.",
                  color: "#E8C4C4",
                },
                {
                  icon: Target,
                  title: "Struggle Detection",
                  desc: "Identifies topics where your activity suggests difficulty. Recommends focused practice where you need it most.",
                  color: "#B8A9C9",
                },
                {
                  icon: BookOpen,
                  title: "Smart Resource Recommendations",
                  desc: "Personalized learning resources matched to your current topics, difficulty level, and struggle areas.",
                  color: "#A7C4D4",
                },
                {
                  icon: Sparkles,
                  title: "AI Task Decomposition",
                  desc: "Break large academic tasks into manageable subtasks with estimated durations and suggested order.",
                  color: "#D4C5A9",
                },
                {
                  icon: Clock,
                  title: "Adaptive Scheduling",
                  desc: "Generates study plans that respect your deadlines, productivity windows, and predicted distraction risk.",
                  color: "#B5C9B3",
                },
                {
                  icon: BarChart3,
                  title: "Behavioral Analytics",
                  desc: "Meaningful insights into your study patterns, focus quality, and productivity trends over time.",
                  color: "#B8A9C9",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl border border-[#E8E4DF] p-6 hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <feature.icon
                      className="w-5 h-5"
                      style={{ color: feature.color }}
                    />
                  </div>
                  <h3 className="text-base font-semibold text-[#2D2D2D] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Questions Meridian Answers */}
        <section className="py-20 px-6 bg-white border-y border-[#E8E4DF]">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold text-[#B8A9C9] uppercase tracking-widest mb-3 text-center">
              Built to Answer
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-12 text-center">
              The questions every student asks
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "What should I study right now?",
                "What should I study first?",
                "When am I most productive?",
                "How likely am I to get distracted?",
                "Which topics am I struggling with?",
                "How should tomorrow adapt to today?",
                "What resources will help me most?",
                "How do I break this task down?",
              ].map((q) => (
                <div
                  key={q}
                  className="flex items-start gap-3 bg-[#FBF8F3] rounded-xl p-4"
                >
                  <div className="w-6 h-6 rounded-full bg-[#B8A9C9]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowRight className="w-3 h-3 text-[#B8A9C9]" />
                  </div>
                  <span className="text-sm font-medium text-[#2D2D2D]">{q}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / Transparency */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#B5C9B3]/10 border border-[#B5C9B3]/20 rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-3.5 h-3.5 text-[#7A9B77]" />
              <span className="text-xs font-medium text-[#7A9B77]">
                Responsible AI
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
              Honest predictions. No false claims.
            </h2>
            <p className="text-[#6B6B6B] max-w-2xl mx-auto mb-8 leading-relaxed">
              Meridian uses real machine learning trained on behavioral data —
              not random numbers or hardcoded values. Predictions are clearly
              marked as estimates, and new accounts show &quot;not enough data
              yet&quot; until genuine patterns emerge.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#2D2D2D] rounded-2xl p-8 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Start studying smarter today
              </h2>
              <p className="text-[#A0A0A0] mb-8 max-w-md mx-auto">
                Create your free account and let Meridian learn how to help you
                study better.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-[#B8A9C9] text-white px-8 py-3.5 rounded-xl text-base font-medium hover:bg-[#A899B9] transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E4DF] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#B8A9C9] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-[#6B6B6B]">Meridian</span>
          </div>
          <p className="text-xs text-[#9B9B9B]">
            AI-Powered Adaptive Academic Productivity Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
