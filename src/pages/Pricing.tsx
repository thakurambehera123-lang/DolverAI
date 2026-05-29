import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "../components/Router";
import { ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

export default function Pricing() {
  const { profile, upgradePlan, user } = useAuth();
  const { navigate } = useNavigate();

  const handleSelectPlan = async (plan: "Free" | "Pro IV" | "Pro V") => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    await upgradePlan(plan);
    navigate("/");
  };

  const plans = [
    {
      name: "Free" as const,
      price: "Rs. 0",
      period: "forever",
      description: "Ideal for basic assignments and quick consultations",
      features: [
        "20 academic messages per 4 hours",
        "15 non-academic messages per 4 hours",
        "Standard response speeds",
        "General model availability"
      ],
      cta: "Current Plan",
      highlight: false
    },
    {
      name: "Pro IV" as const,
      price: "Rs. 29",
      period: "per month",
      description: "Perfect for active students, coders, and developers",
      features: [
        "40 academic messages per 4 hours",
        "30 non-academic messages per 4 hours",
        "Accelerated response speeds",
        "High availability windows",
        "Priority educational guidance support"
      ],
      cta: "Upgrade to Pro IV",
      highlight: true
    },
    {
      name: "Pro V" as const,
      price: "Rs. 49",
      period: "per month",
      description: "Ultimate platform for master scholars and deep researchers",
      features: [
        "Unlimited usage (No limits)",
        "Highest priority, fastest response latency",
        "Access to advanced thinking reasoning levels",
        "First-look features and tool groundings"
      ],
      cta: "Upgrade to Pro V",
      highlight: false
    }
  ];

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-[#ffffff] dark:bg-gpt-dark-bg text-[#202123] dark:text-gpt-dark-text-primary px-4 py-16 md:py-24 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-16 animate-fade-in">
        
        {/* Title */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#202123] dark:text-white">
            Plans with Clear Pricing
          </h2>
          <p className="text-sm text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary leading-relaxed">
            Elevate your academic workflow and software engineering productivity with premium models and higher limits.
          </p>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto items-stretch">
          {plans.map((p, idx) => {
            const isCurrent = profile?.subscriptionPlan === p.name;
            
            return (
              <div 
                key={idx}
                className={`relative rounded-xl border p-8 flex flex-col justify-between transition-all duration-200 ${
                  p.highlight 
                    ? "border-gpt-accent bg-[#ffffff] dark:bg-gpt-dark-card shadow-sm dark:shadow-none" 
                    : "border-gpt-light-border dark:border-gpt-dark-border bg-white dark:bg-gpt-dark-card"
                }`}
              >
                {/* Highlight Badge */}
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-gpt-accent text-white text-[10px] uppercase font-bold px-3 py-0.5 rounded-full tracking-wider shadow-xs">
                    <Sparkles className="h-3 w-3" />
                    <span>Recommended</span>
                  </span>
                )}

                <div className="space-y-6">
                  {/* Plan Meta */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-[#202123] dark:text-white">{p.name}</h3>
                    <p className="text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary min-h-8 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Plan Price */}
                  <div>
                    <span className="text-3xl font-extrabold text-[#202123] dark:text-white">{p.price}</span>
                    <span className="text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-muted font-medium ml-1.5">/ {p.period}</span>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-3 text-xs text-[#202123]/90 dark:text-gpt-dark-text-secondary border-t border-gpt-light-border dark:border-gpt-dark-border pt-5">
                    {p.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-gpt-accent flex-shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Submit button */}
                <div className="pt-8">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2 text-xs font-semibold rounded-lg bg-[#f7f7f8] dark:bg-gpt-dark-panel text-gpt-light-text-secondary dark:text-[#7A7A7A] border border-gpt-light-border dark:border-gpt-dark-border cursor-default text-center"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(p.name)}
                      className={`w-full py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-150 text-center border ${
                        p.highlight
                          ? "bg-gpt-accent hover:bg-gpt-accent-hover text-white border-transparent"
                          : "bg-[#ffffff] hover:bg-[#f7f7f8] dark:bg-gpt-dark-input dark:hover:bg-[#383838] text-[#202123] dark:text-gpt-dark-text-primary border-gpt-light-border dark:border-gpt-dark-border"
                      }`}
                    >
                      {p.cta}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Upgrade alert info */}
        <div className="max-w-xl mx-auto p-4 rounded-xl border border-gpt-light-border dark:border-gpt-dark-border bg-[#f7f7f8] dark:bg-gpt-dark-panel flex gap-3 text-xs leading-normal text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary select-none">
          <AlertCircle className="h-4 w-4 text-gpt-accent mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            Upgrading immediately unlocks higher message limits and premium response priorities. 
            All billing is simulated for sandbox purposes; no actual financial details or cards are requested.
          </p>
        </div>

      </div>
    </div>
  );
}
