import React, { createContext, useContext, useEffect, useState } from "react";

interface RouterContextType {
  path: string;
  navigate: (toPath: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return "/";
  });

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (toPath: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", toPath);
      setPath(toPath);
    }
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useNavigate must be used within a RouterProvider");
  }
  return context;
}

interface RouteProps {
  path: string;
  element: React.ReactNode;
}

export function Route({ path: routePath, element }: RouteProps) {
  const { path } = useNavigate();
  return path === routePath ? <>{element}</> : null;
}
