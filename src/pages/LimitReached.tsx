import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "../components/Router";
import { Clock, ShieldAlert, ArrowRight, Sparkles } from "lucide-react";

export default function LimitReached() {
  const { profile } = useAuth();
  const { navigate } = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState("04:00:00");

  useEffect(() => {
    if (!profile) return;

    const interval = setInterval(() => {
      const resetTime = new Date(profile.lastUsageReset).getTime() + 4 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = resetTime - now;

      if (diff <= 0) {
        setTimeRemaining("00:00:00");
        clearInterval(interval);
        navigate("/");
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, "0");
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, "0");
        const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, "0");
        setTimeRemaining(`${h}:${m}:${s}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [profile]);

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-[#ffffff] dark:bg-gpt-dark-bg text-[#202123] dark:text-gpt-dark-text-primary px-4 py-16 flex items-center justify-center transition-colors duration-200">
      <div className="w-full max-w-sm rounded-xl border border-gpt-light-border dark:border-gpt-dark-border bg-white dark:bg-gpt-dark-card p-6 shadow-sm dark:shadow-none text-center space-y-6 animate-fade-in">
        
        {/* Warning Badge / Icon */}
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3.5 rounded-lg bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-400 border border-red-100/50 dark:border-red-900/40">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#202123] dark:text-white">
            Usage Limit Reached
          </h2>
          <p className="text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary max-w-[280px] mx-auto leading-relaxed">
            You have exhausted your active plan message allowance for this 4-hour window.
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="p-4 rounded-lg bg-[#f7f7f8] border border-gpt-light-border dark:bg-gpt-dark-panel dark:border-gpt-dark-border max-w-[280px] mx-auto space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#565869] dark:text-gpt-dark-text-secondary">
            Remaining Reset Time
          </p>
          <div className="flex items-center justify-center gap-2 font-mono text-2xl font-bold text-[#202123] dark:text-white">
            <Clock className="h-4 w-4 text-gpt-accent animate-pulse" />
            <span>{timeRemaining}</span>
          </div>
        </div>

        {/* Upgrade Call-to-Action Card */}
        <div className="p-4 rounded-lg border border-gpt-light-border dark:border-gpt-dark-border bg-white dark:bg-gpt-dark-card max-w-md mx-auto space-y-3">
          <div className="space-y-1">
            <h4 className="text-xs font-bold flex items-center justify-center gap-1.5 text-[#202123] dark:text-white">
              <Sparkles className="h-3.5 w-3.5 text-gpt-accent" />
              <span>Unlock Higher Priority Usage</span>
            </h4>
            <p className="text-[11px] text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary leading-relaxed px-1">
              Upgrade to Pro IV for 40/30 message thresholds, or go Pro V for absolute unlimited usage!
            </p>
          </div>
          
          <button
            onClick={() => navigate("/pricing")}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-gpt-accent hover:bg-gpt-accent-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <span>Upgrade Subscription Plans</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Back link */}
        <div className="pt-2">
          <button
            onClick={() => navigate("/")}
            className="text-xs font-semibold text-[#565869] hover:text-gpt-accent dark:text-gpt-dark-text-muted dark:hover:text-gpt-accent cursor-pointer transition-colors"
          >
            Back to Home Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
