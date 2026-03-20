import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Database, Brain, Home, Menu, X, Zap } from "lucide-react";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connected, dbName, clearDb } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // On chat pages the layout is fixed-height — treat as always "scrolled"
  const isChatPage = ["/nl2sql", "/copilot"].includes(location.pathname);

  useEffect(() => {
    if (isChatPage) return;
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isChatPage]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/",        label: "Home",        icon: <Home     className="w-3.5 h-3.5" /> },
    { path: "/nl2sql",  label: "NL2SQL",      icon: <Database className="w-3.5 h-3.5" /> },
    { path: "/copilot", label: "DataCopilot", icon: <Brain    className="w-3.5 h-3.5" /> },
  ];

  const elevated = scrolled || isChatPage;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          elevated
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg shadow-black/20"
            : "bg-background/80 backdrop-blur-sm border-b border-border/50"
        }`}
      >
        <div className="max-w-full px-4 h-12 flex items-center justify-between gap-4">

          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 group shrink-0"
          >
            <div className="relative w-7 h-7 rounded-md overflow-hidden border border-border/60 group-hover:border-primary/60 transition-all duration-200">
              <img src="/favicon.ico" alt="DataMind" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-base text-foreground group-hover:text-primary-light transition-colors duration-200">
              DataMind
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? "bg-primary/15 text-primary-light border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {link.icon}
                {link.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {connected ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-success/10 border border-success/25 px-2.5 py-1 rounded-full text-xs text-success font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  {dbName || "Connected"}
                </div>
                <button
                  onClick={clearDb}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/nl2sql")}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/80 transition-all duration-200"
              >
                <Zap className="w-3 h-3" />
                Get Started
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-80 border-t border-border" : "max-h-0"}`}>
          <div className="bg-background/98 backdrop-blur-md px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                  isActive(link.path)
                    ? "bg-primary/15 text-primary-light border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {link.icon}
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-border mt-2">
              {connected ? (
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    {dbName || "Connected"}
                  </div>
                  <button onClick={clearDb} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/nl2sql")}
                  className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/80 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer — only on non-chat pages since chat pages are fixed-height flex */}
      {!isChatPage && <div className="h-12" />}
    </>
  );
};