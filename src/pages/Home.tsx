import React from "react";
import { useNavigate } from "../components/Router";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Compass, Sparkles, ArrowRight } from "lucide-react";
import Logo from "../components/Logo";

export default function Home() {
  const { navigate } = useNavigate();
  const { user, profile } = useAuth();

  const handleModeNavigate = (path: string) => {
    if (!user) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  return (
    <div className="w-full bg-[#ffffff] dark:bg-gpt-dark-bg text-[#202123] dark:text-gpt-dark-text-primary transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24 space-y-16 flex flex-col justify-center min-h-[calc(100vh-3.5rem)] animate-fade-in">
        
        {/* Title Hero */}
        <div className="text-center space-y-5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f7f7f8] dark:bg-gpt-dark-card text-xs font-medium text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary border border-gpt-light-border dark:border-gpt-dark-border">
            <Sparkles className="h-3 w-3 text-gpt-accent" />
            <span>Next-Generation AI Assistance</span>
          </div>
          
          <Logo size="xl" className="justify-center py-2" />
          
          <p className="text-sm text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary max-w-lg mx-auto leading-relaxed">
            A premium intelligent workspace offering dedicated STEM academic doubt solving and general assistant sessions.
          </p>
        </div>

        {/* Two Main Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 w-full">
          
          {/* Academic Chat Card */}
          <div 
            onClick={() => handleModeNavigate("/academic")}
            className="group relative rounded-xl border border-gpt-light-border dark:border-gpt-dark-border bg-white dark:bg-gpt-dark-card hover:bg-[#fcfcfc] dark:hover:bg-[#222224] hover:-translate-y-1 hover:shadow-lg hover:border-gpt-accent/30 dark:hover:border-gpt-accent/30 active:scale-[0.98] cursor-pointer transition-all duration-300 p-8 flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="inline-flex p-3 rounded-lg bg-[#f7f7f8] dark:bg-[#171717] text-gpt-accent dark:text-blue-400 border border-gpt-light-border dark:border-gpt-dark-border group-hover:bg-gpt-accent/5 group-hover:block transition-colors duration-300">
                <GraduationCap className="h-5 w-5" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#202123] dark:text-white transition-colors group-hover:text-gpt-accent dark:group-hover:text-blue-400">
                  Academic Chat Mode
                </h3>
                <p className="text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary leading-relaxed">
                  Dedicated workspace for premium education tutoring, step-by-step rigorous proof setups, mathematical derivations, and STEM guidance.
                </p>
              </div>

              {/* Feature bullets */}
              <ul className="space-y-2.5 pt-2 text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-gpt-accent dark:bg-blue-400" />
                  <span>Rigorous step-by-step math breakdowns</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-gpt-accent dark:bg-blue-400" />
                  <span>Advanced LaTeX formula formatting</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-gpt-accent dark:bg-blue-400" />
                  <span>Exhaustive science, syntax & dev commentary</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gpt-accent dark:text-blue-400 pt-4 border-t border-gpt-light-border dark:border-gpt-dark-border">
              <span>Enter Workspace</span>
              <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1.5 transition-all duration-300 ease-out" />
            </div>
          </div>

          {/* Non-Academic Chat Card */}
          <div 
            onClick={() => handleModeNavigate("/non-academic")}
            className="group relative rounded-xl border border-gpt-light-border dark:border-gpt-dark-border bg-white dark:bg-gpt-dark-card hover:bg-[#fcfcfc] dark:hover:bg-[#222224] hover:-translate-y-1 hover:shadow-lg hover:border-gpt-accent/30 dark:hover:border-gpt-accent/30 active:scale-[0.98] cursor-pointer transition-all duration-300 p-8 flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="inline-flex p-3 rounded-lg bg-[#f7f7f8] dark:bg-[#171717] text-gpt-accent dark:text-blue-400 border border-gpt-light-border dark:border-gpt-dark-border group-hover:bg-gpt-accent/5 group-hover:block transition-colors duration-300">
                <Compass className="h-5 w-5" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#202123] dark:text-white transition-colors group-hover:text-gpt-accent dark:group-hover:text-blue-400">
                  General Assistant Mode
                </h3>
                <p className="text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary leading-relaxed">
                  Versatile multi-disciplinary chat workspace for premium copy composition, idea brainstorming, support utilities, planning, and task management.
                </p>
              </div>

              {/* Feature bullets */}
              <ul className="space-y-2.5 pt-2 text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-gpt-accent dark:bg-blue-400" />
                  <span>General knowledge and instant query solutions</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-gpt-accent dark:bg-blue-400" />
                  <span>Creative storyboarding, editing & drafts</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-gpt-accent dark:bg-blue-400" />
                  <span>Administrative outlines and productivity workflows</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gpt-accent dark:text-blue-400 pt-4 border-t border-gpt-light-border dark:border-gpt-dark-border">
              <span>Enter Session</span>
              <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1.5 transition-all duration-300 ease-out" />
            </div>
          </div>

        </div>

        {/* Dynamic metadata status footer note */}
        {user && profile && (
          <div className="text-center text-[10px] uppercase font-mono tracking-widest text-[#565869] dark:text-gpt-dark-text-muted max-w-md mx-auto py-2">
            Active Workspace: <span className="font-semibold text-gpt-accent">{profile.name}</span> on the <span className="underline">{profile.subscriptionPlan} Plan</span>.
          </div>
        )}
      </div>
    </div>
  );
}
