import { useState } from "react";
import { Moon, Sun, MessageCircle, Zap, Lock, Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import AuthModal from "../components/AuthModal";

function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const openAuth = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-lavender-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-lavender-950/30 relative overflow-hidden">
      {/* Minimal Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-lavender-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/15 to-pink-500/15 rounded-full blur-3xl"></div>
      </div>

      {/* Clean Header */}
      <header className="container mx-auto px-6 py-6 relative z-10">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-lavender-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ChatraX
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => openAuth("login")}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-lavender-600 dark:hover:text-lavender-400 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto pt-20 pb-24 sm:pt-28 sm:pb-32">
          {/* Main Heading */}
          <div className="text-center space-y-8 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lavender-100/50 dark:bg-lavender-900/20 border border-lavender-200/50 dark:border-lavender-800/30">
              <Sparkles className="w-4 h-4 text-lavender-600 dark:text-lavender-400" />
              <span className="text-sm font-medium text-lavender-700 dark:text-lavender-300">
                Simple. Private. Fast.
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
              Chat without
              <span className="block mt-2 bg-gradient-to-r from-lavender-600 to-purple-600 dark:from-lavender-400 dark:to-purple-400 bg-clip-text text-transparent">
                the noise with bholiyaaa
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Connect with friends through clean, real-time conversations. No
              ads. No distractions. Just pure messaging.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={() => openAuth("register")}
                className="px-8 py-4 bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-lavender-500/25 hover:shadow-xl hover:shadow-lavender-500/30 transition-all duration-200 hover:-translate-y-0.5"
              >
                Start chatting for free
              </button>
              <button
                onClick={() => openAuth("login")}
                className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
              >
                I have an account
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-24">
            <div className="group p-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-800/50 hover:border-lavender-300 dark:hover:border-lavender-700 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-lavender-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Instant messaging
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Messages arrive in real-time. See when friends are typing. Stay
                connected effortlessly.
              </p>
            </div>

            <div className="group p-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-800/50 hover:border-lavender-300 dark:hover:border-lavender-700 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Find friends easily
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Search by unique codename. Send requests. Build your circle.
                It's that simple.
              </p>
            </div>

            <div className="group p-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-800/50 hover:border-lavender-300 dark:hover:border-lavender-700 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Privacy first
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Your conversations stay private. Chat with confidence in a
                secure environment.
              </p>
            </div>
          </div>

          {/* Simple Footer Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-20 pt-12 border-t border-gray-200/50 dark:border-gray-800/50">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                100%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Free forever
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                0
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Ads or tracking
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ∞
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Messages
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal mode={authMode} onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

export default LandingPage;
