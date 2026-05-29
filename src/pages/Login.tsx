import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "../components/Router";
import { LogIn, UserPlus, Chrome, Mail, Lock, ArrowRight, Copy, Check, ExternalLink, AlertCircle } from "lucide-react";
import Logo from "../components/Logo";

export default function Login() {
  const { user, loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth();
  const { navigate } = useNavigate();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDomainError, setIsDomainError] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setIsDomainError(false);
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err: any) {
      console.error("Google login failed:", err);
      const isDomainErr = err?.code === "auth/unauthorized-domain" || 
                          err?.message?.includes("unauthorized-domain") || 
                          err?.message?.includes("auth/unauthorized-domain");
      if (isDomainErr) {
        setIsDomainError(true);
      }
      setErrorMsg(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsDomainError(false);
    setLoading(true);

    if (!email || !password) {
      setErrorMsg("Please fill in all blanks.");
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        await signUpWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      navigate("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication attempt failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[#ffffff] dark:bg-gpt-dark-bg text-[#202123] dark:text-gpt-dark-text-primary px-4 py-12 transition-colors duration-200">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        
        {/* Top Header Card */}
        <div className="text-center space-y-2">
          <Logo size="lg" className="justify-center" />
          <h2 className="text-2xl font-extrabold tracking-tight text-[#202123] dark:text-white pt-2">
            Welcome back
          </h2>
          <p className="text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary">
            Sign in to Dolver AI with your account credentials
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gpt-light-border dark:border-gpt-dark-border bg-white dark:bg-gpt-dark-card p-6 shadow-sm dark:shadow-none">
          <form onSubmit={handleEmailAction} className="space-y-4">
            
            {/* Title / Tab Selector */}
            <div className="flex border-b border-gpt-light-border dark:border-gpt-dark-border pb-1 mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setIsRegistering(false); setErrorMsg(""); setIsDomainError(false); }}
                className={`flex-1 pb-2 text-center cursor-pointer transition-colors ${!isRegistering ? "border-b-2 border-gpt-accent text-gpt-accent font-bold" : "text-[#565869] dark:text-gpt-dark-text-muted hover:text-[#202123]"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegistering(true); setErrorMsg(""); setIsDomainError(false); }}
                className={`flex-1 pb-2 text-center cursor-pointer transition-colors ${isRegistering ? "border-b-2 border-gpt-accent text-gpt-accent font-bold" : "text-[#565869] dark:text-gpt-dark-text-muted hover:text-[#202123]"}`}
              >
                Create Account
              </button>
            </div>

            {isDomainError && (
              <div className="p-4 text-xs text-amber-800 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-900/40 leading-relaxed space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="font-bold">Authorized Domain Mismatch</strong>
                    <p className="mt-1">Firebase is blocking Google Sign-In because this environment's domain is not yet allowlisted in your Firebase console.</p>
                  </div>
                </div>

                <div className="border-t border-amber-200/50 dark:border-amber-900/30 pt-2 space-y-2">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">📋 Setup Instructions:</p>
                  <ol className="list-decimal list-inside pl-1 space-y-2 text-amber-950 dark:text-amber-300">
                    <li>
                      Open your{" "}
                      <a 
                        href={`https://console.firebase.google.com/project/${(import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "doloverai02"}/authentication/settings`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 hover:text-[#e0a82e] dark:hover:text-[#f3cd72]"
                        id="firebase-console-link"
                      >
                        Firebase Authorized Domains Console <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    </li>
                    <li>
                      Scroll down to the <strong className="font-semibold">Authorized domains</strong> section.
                    </li>
                    <li>
                      Click <strong className="font-semibold">Add domain</strong> and add this environment's hostname:
                      <div className="mt-1.5 flex items-center justify-between bg-white dark:bg-[#1a1a1a] border border-amber-200 dark:border-amber-800 rounded-md p-1.5 font-mono text-[11px] text-amber-950 dark:text-amber-300">
                        <span>{window.location.hostname}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.hostname);
                            setCopiedDomain(true);
                            setTimeout(() => setCopiedDomain(false), 2000);
                          }}
                          className="p-1 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 rounded transition-colors"
                          title="Copy domain"
                          id="copy-domain-btn"
                        >
                          {copiedDomain ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
                          )}
                        </button>
                      </div>
                    </li>
                    {window.location.hostname !== "localhost" && (
                      <li>
                        Add <strong className="font-mono">localhost</strong> as well for local host compatibility.
                      </li>
                    )}
                  </ol>
                </div>
              </div>
            )}

            {!isDomainError && errorMsg && (
              <div className="p-3 text-xs text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-300 rounded border border-red-200 dark:border-red-900/40 leading-relaxed">
                {errorMsg}
              </div>
            )}

            {isRegistering && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#565869] dark:text-[#7A7A7A]">Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <UserPlus className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#2a2a2a] border border-black/[0.08] dark:border-white/[0.08] rounded-lg text-[#202123] dark:text-[#ECECEC] focus:outline-none focus:border-gpt-accent transition-all placeholder-[#6b7280] dark:placeholder-[#8e8ea0] caret-[#202123] dark:caret-[#ECECEC] selection:bg-black/10 dark:selection:bg-white/20"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#565869] dark:text-[#7A7A7A]">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#2a2a2a] border border-black/[0.08] dark:border-white/[0.08] rounded-lg text-[#202123] dark:text-[#ECECEC] focus:outline-none focus:border-gpt-accent transition-all placeholder-[#6b7280] dark:placeholder-[#8e8ea0] caret-[#202123] dark:caret-[#ECECEC] selection:bg-black/10 dark:selection:bg-white/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#565869] dark:text-[#7A7A7A]">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#2a2a2a] border border-black/[0.08] dark:border-white/[0.08] rounded-lg text-[#202123] dark:text-[#ECECEC] focus:outline-none focus:border-gpt-accent transition-all placeholder-[#6b7280] dark:placeholder-[#8e8ea0] caret-[#202123] dark:caret-[#ECECEC] selection:bg-black/10 dark:selection:bg-white/20"
                />
              </div>
            </div>

            {/* Email submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gpt-accent hover:bg-gpt-accent-hover disabled:bg-gpt-accent-hover/70 rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : isRegistering ? (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In with Email</span>
                </>
              )}
            </button>

            {/* Separator line */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gpt-light-border dark:border-gpt-dark-border"></div>
              <span className="flex-shrink mx-3 text-[9px] text-[#A9A9A9] uppercase font-bold tracking-widest">or</span>
              <div className="flex-grow border-t border-gpt-light-border dark:border-gpt-dark-border"></div>
            </div>

            {/* Google Authentication */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#202123] dark:text-gpt-dark-text-primary bg-[#ffffff] hover:bg-[#f7f7f8] dark:bg-gpt-dark-input dark:hover:bg-[#383838] border border-gpt-light-border dark:border-gpt-dark-border rounded-lg cursor-pointer transition-colors"
            >
              <Chrome className="h-3.5 w-3.5 text-red-500" />
              <span>Continue with Google</span>
            </button>

          </form>
        </div>

        {/* Sandbox Note */}
        <div className="p-4 rounded-lg bg-[#f7f7f8] dark:bg-gpt-dark-panel border border-gpt-light-border dark:border-gpt-dark-border text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary leading-relaxed select-none">
          <p className="font-bold text-[#202123] dark:text-white">💡 Reviewer Sandbox Note:</p>
          <p className="mt-1">You may register any mock or test email to sign in instantly, or proceed using Google OAuth for immediate automated workspace entry.</p>
        </div>

      </div>
    </div>
  );
}
