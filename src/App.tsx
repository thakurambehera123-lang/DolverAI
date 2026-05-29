import React from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RouterProvider, Route, useNavigate } from "./components/Router";
import Header from "./components/Header";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import LimitReached from "./pages/LimitReached";
import ChatView from "./pages/ChatView";

function MainAppLayout() {
  const { path, navigate } = useNavigate();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff] dark:bg-gpt-dark-bg transition-colors duration-200">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="h-8 w-8 border-3 border-gpt-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase text-gpt-light-text-secondary dark:text-gpt-dark-text-muted">
            Loading
          </span>
        </div>
      </div>
    );
  }

  const isLoginPage = path === "/login";
  const isChatPage = path === "/academic" || path === "/non-academic";

  return (
    <div className={`${isChatPage ? "h-screen" : "min-h-screen"} flex flex-col bg-[#ffffff] dark:bg-gpt-dark-bg text-[#202123] dark:text-[#ECECEC] transition-colors duration-200 overflow-hidden`}>
      {/* Hide header on login and chat views */}
      {!isLoginPage && !isChatPage && <Header />}

      <main className={`flex flex-col flex-1 ${isChatPage ? "h-full min-h-0 overflow-hidden" : ""}`}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/academic" element={<ChatView mode="academic" />} />
        <Route path="/non-academic" element={<ChatView mode="non-academic" />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/limit-reached" element={<LimitReached />} />
      </main>

      {/* Minimal responsive Footer (hidden on chat panels for neat layouts) */}
      {!isLoginPage && !isChatPage && (
        <footer className="border-t border-black/[0.04] dark:border-white/[0.04] py-6 text-xs text-[#565869] dark:text-[#A9A9A9] mt-auto bg-[#f7f7f8] dark:bg-[#171717] transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <span className="font-semibold text-[#202123] dark:text-white">dolver.ai</span>
              <span className="hidden sm:inline text-black/10 dark:text-white/10">|</span>
              <div className="flex gap-4 items-center">
                <button onClick={() => navigate("/")} className="hover:text-gpt-accent transition-colors cursor-pointer">Home</button>
                <button onClick={() => navigate("/academic")} className="hover:text-gpt-accent transition-colors cursor-pointer">Academic</button>
                <button onClick={() => navigate("/non-academic")} className="hover:text-gpt-accent transition-colors cursor-pointer">General</button>
                <button onClick={() => navigate("/pricing")} className="hover:text-gpt-accent transition-colors cursor-pointer">Pricing</button>
              </div>
            </div>
            <span className="text-[11px] text-[#A9A9A9] dark:text-[#7A7A7A]">© 2026 Dolver AI. All rights reserved.</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <AuthProvider>
          <MainAppLayout />
        </AuthProvider>
      </RouterProvider>
    </ThemeProvider>
  );
}
