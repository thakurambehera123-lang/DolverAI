import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "./Router";
import { X, Shield, Clock, GraduationCap, Compass, RefreshCw, LogOut, CreditCard } from "lucide-react";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { profile, logout, resetLimitsManually } = useAuth();
  const { navigate } = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState("04:00:00");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const interval = setInterval(() => {
      const resetTime = new Date(profile.lastUsageReset).getTime() + 4 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = resetTime - now;

      if (diff <= 0) {
        setTimeRemaining("00:00:00");
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, "0");
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, "0");
        const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, "0");
        setTimeRemaining(`${h}:${m}:${s}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [profile]);

  if (!isOpen || !profile) return null;

  const limits = {
    Free: { academic: 20, nonAcademic: 15 },
    "Pro IV": { academic: 40, nonAcademic: 30 },
    "Pro V": { academic: Infinity, nonAcademic: Infinity }
  };

  const planLimits = limits[profile.subscriptionPlan];

  const handleUpgradeClick = () => {
    onClose();
    navigate("/pricing");
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    onClose();
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Background overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-sm border-l border-gpt-light-border dark:border-gpt-dark-border bg-white dark:bg-gpt-dark-panel shadow-2xl flex flex-col animate-slide-in">
        
        {/* Header Drawer */}
        <div className="flex items-center justify-between border-b border-gpt-light-border dark:border-gpt-dark-border px-6 py-4">
          <div className="flex items-center gap-2">
            <UserCircle2Icon className="h-4.5 w-4.5 text-gpt-accent" />
            <h2 className="text-sm font-bold text-[#202123] dark:text-white">
              My Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#565869] hover:bg-black/5 dark:text-gpt-dark-text-secondary dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Main User Card info */}
          <div className="flex flex-col items-center text-center p-5 rounded-xl bg-[#f7f7f8] dark:bg-gpt-dark-card border border-gpt-light-border dark:border-gpt-dark-border">
            <img 
              src={profile.avatar} 
              alt={profile.name} 
              className="h-14 w-14 rounded-full border-2 border-gpt-accent object-cover shadow-xs"
            />
            <h3 className="mt-3 text-base font-bold text-[#202123] dark:text-white">
              {profile.name}
            </h3>
            <span className="text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary">
              {profile.email}
            </span>
            
            <div className={`mt-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
              profile.subscriptionPlan === "Pro V" 
                ? "bg-amber-100/50 text-amber-800 border border-amber-200/55 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/60"
                : profile.subscriptionPlan === "Pro IV"
                ? "bg-emerald-100/50 text-emerald-800 border border-emerald-200/55 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/60"
                : "bg-gray-100 text-gray-700 dark:bg-gpt-dark-input dark:text-gray-300 border border-gpt-light-border dark:border-gpt-dark-border"
            }`}>
              <Shield className="h-3 w-3" />
              <span>{profile.subscriptionPlan} Plan</span>
            </div>
          </div>

          {/* Usage Counters */}
          <div className="space-y-3">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-gpt-light-text-secondary dark:text-gpt-dark-text-muted">
              Usage Limits (This 4-Hour Reset window)
            </h4>

            {/* Academic stats */}
            <div className="p-4 rounded-xl bg-white dark:bg-gpt-dark-card border border-gpt-light-border dark:border-gpt-dark-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-[#202123]/90 dark:text-gpt-dark-text-secondary">
                  <GraduationCap className="h-4 w-4 text-gpt-accent" />
                  <span className="font-bold">Academic doubts</span>
                </div>
                <span className="font-mono text-[11px] text-gpt-light-text-secondary dark:text-gpt-dark-text-muted">
                  {profile.academicUsageCount} / {planLimits.academic === Infinity ? "∞" : planLimits.academic}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#f7f7f8] dark:bg-gpt-dark-input rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gpt-accent rounded-full transition-all duration-500"
                  style={{ width: `${planLimits.academic === Infinity ? 100 : Math.min(100, (profile.academicUsageCount / planLimits.academic) * 100)}%` }}
                />
              </div>
            </div>

            {/* Non-academic stats */}
            <div className="p-4 rounded-xl bg-white dark:bg-gpt-dark-card border border-gpt-light-border dark:border-gpt-dark-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-[#202123]/90 dark:text-gpt-dark-text-secondary">
                  <Compass className="h-4 w-4 text-gpt-accent" />
                  <span className="font-bold">General answers</span>
                </div>
                <span className="font-mono text-[11px] text-gpt-light-text-secondary dark:text-gpt-dark-text-muted">
                  {profile.nonAcademicUsageCount} / {planLimits.nonAcademic === Infinity ? "∞" : planLimits.nonAcademic}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#f7f7f8] dark:bg-gpt-dark-input rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gpt-accent rounded-full transition-all duration-500"
                  style={{ width: `${planLimits.nonAcademic === Infinity ? 100 : Math.min(100, (profile.nonAcademicUsageCount / planLimits.nonAcademic) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Reset Timer widget */}
          <div className="p-4 rounded-xl bg-[#f7f7f8] dark:bg-[#1a1a1a] border border-gpt-light-border dark:border-gpt-dark-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-white dark:bg-[#2c2c2c] border border-gpt-light-border dark:border-gpt-dark-border text-gpt-accent flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-gpt-light-text-secondary dark:text-gpt-dark-text-muted font-bold uppercase tracking-wider">Reset Countdown</p>
                <p className="text-base font-mono font-bold text-[#202123] dark:text-white leading-tight">{timeRemaining}</p>
              </div>
            </div>
            
            {/* Simulation reset */}
            <button
              onClick={resetLimitsManually}
              className="p-1 px-2 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-[#2c2c2c] hover:bg-[#f7f7f8] dark:hover:bg-[#343434] border border-gpt-light-border dark:border-gpt-dark-border text-gpt-light-text-secondary dark:text-gpt-dark-text-primary rounded cursor-pointer transition-colors"
              title="Reset Limits Simulator"
            >
              Reset
            </button>
          </div>

          {/* Pricing Upgrade */}
          {profile.subscriptionPlan !== "Pro V" && (
            <div className="pt-2">
              <button
                onClick={handleUpgradeClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gpt-accent hover:bg-gpt-accent-hover text-white rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Upgrade Plan</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer Drawer Action */}
        <div className="border-t border-gpt-light-border dark:border-gpt-dark-border px-6 py-4 bg-[#f7f7f8] dark:bg-gpt-dark-card flex items-center justify-between">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-2 text-xs text-red-500 hover:text-red-600 cursor-pointer font-bold uppercase tracking-wider transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
          <span className="text-[10px] text-gpt-light-text-secondary dark:text-gpt-dark-text-muted font-mono uppercase tracking-wider select-none">DOLVER AI v1.0</span>
        </div>

      </div>

      {/* Internal Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs rounded-xl border border-gpt-light-border dark:border-gpt-dark-border bg-white p-6 shadow-2xl dark:bg-gpt-dark-card">
            <h3 className="text-md font-bold text-[#202123] dark:text-white">
              Confirm Logout
            </h3>
            <p className="mt-1.5 text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary leading-relaxed">
              Are you sure you want to logout? This will terminate your secure session.
            </p>
            <div className="mt-5 flex justify-end gap-2 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-2 text-gpt-light-text-secondary hover:bg-black/5 rounded dark:text-gpt-dark-text-primary dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-3 py-2 text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UserCircle2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 21a6 6 0 0 0-12 0" />
      <circle cx="12" cy="10" r="4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
