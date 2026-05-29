import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "./Router";
import { Sun, Moon, GraduationCap, MessageSquare, Compass, LogOut, UserCircle2, ShieldCheck, HelpCircle } from "lucide-react";
import ProfileDrawer from "./ProfileDrawer";
import Logo from "./Logo";

export default function Header() {
  const { profile, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { path, navigate } = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-black/[0.04] dark:border-white/[0.04] bg-white/80 backdrop-blur-md dark:bg-[#212121]/80 transition-colors duration-200">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Logo 
            size="md" 
            className="cursor-pointer group"
            onClick={() => navigate("/")} 
          />

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium tracking-normal">
            <button
              onClick={() => navigate("/")}
              className={`transition-all duration-200 cursor-pointer ${
                path === "/" 
                  ? "text-gpt-accent dark:text-blue-400 font-semibold" 
                  : "text-[#565869] hover:text-[#202123] dark:text-[#A9A9A9] dark:hover:text-blue-300"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate("/academic")}
              className={`flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                path === "/academic" 
                  ? "text-gpt-accent dark:text-blue-400 font-semibold" 
                  : "text-[#565869] hover:text-[#202123] dark:text-[#A9A9A9] dark:hover:text-blue-300"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Academic</span>
            </button>
            <button
              onClick={() => navigate("/non-academic")}
              className={`flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                path === "/non-academic" 
                  ? "text-gpt-accent dark:text-blue-400 font-semibold" 
                  : "text-[#565869] hover:text-[#202123] dark:text-[#A9A9A9] dark:hover:text-blue-300"
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>General</span>
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className={`transition-all duration-200 cursor-pointer ${
                path === "/pricing" 
                  ? "text-gpt-accent dark:text-blue-400 font-semibold" 
                  : "text-[#565869] hover:text-[#202123] dark:text-[#A9A9A9] dark:hover:text-blue-300"
              }`}
            >
              Pricing
            </button>
          </nav>

          {/* Right Section Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-[#565869] hover:text-[#202123] dark:text-[#A9A9A9] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer transition-all"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Session Profile Details */}
            {user && profile ? (
              <div className="flex items-center gap-2">
                {/* Subscription Badge */}
                <span className={`hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                  profile.subscriptionPlan === "Pro V" 
                    ? "bg-amber-100/50 text-amber-800 border border-amber-200/50 dark:bg-amber-950/25 dark:text-amber-300 dark:border-amber-900/30"
                    : profile.subscriptionPlan === "Pro IV"
                    ? "bg-emerald-100/50 text-emerald-800 border border-emerald-200/50 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/30"
                    : "bg-gray-100 text-[#565869] dark:bg-[#2a2a2a] dark:text-[#A9A9A9] border border-black/[0.04] dark:border-white/[0.04]"
                }`}>
                  {profile.subscriptionPlan}
                </span>

                {/* Avatar */}
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center h-7 w-7 rounded-lg border border-transparent hover:border-gpt-accent dark:hover:border-gpt-accent overflow-hidden cursor-pointer transition-all"
                >
                  <img 
                    src={profile.avatar} 
                    alt={profile.name} 
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </button>

                {/* Quick LogOut Button */}
                <button
                  onClick={handleLogoutClick}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-gpt-accent hover:bg-gpt-accent-hover rounded-lg cursor-pointer transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Profile Drawer */}
      {isDrawerOpen && <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-[#161a20]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Confirm Logout
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to end your session on Dolver AI?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-[#0d0f12] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
