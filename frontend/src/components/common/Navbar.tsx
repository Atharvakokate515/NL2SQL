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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home", icon: <Home className="w-3.5 h-3.5" /> },
    { path: "/nl2sql", label: "NL2SQL", icon: <Database className="w-3.5 h-3.5" /> },
    { path: "/copilot", label: "DataCopilot", icon: <Brain className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg shadow-black/20"
            : "bg-background/80 backdrop-blur-sm border-b border-border/50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-border/60 group-hover:border-primary/60 transition-all duration-200 shadow-sm group-hover:shadow-primary/20 group-hover:shadow-md">
              <img
                src="/favicon.ico"
                alt="DataMind Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-display text-lg text-foreground group-hover:text-primary-light transition-colors duration-200 tracking-wide">
              DataMind
            </span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
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

          {/* Right side — DB status + CTA */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {connected ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-success/10 border border-success/25 px-3 py-1.5 rounded-full text-xs text-success font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  {dbName || "Connected"}
                </div>
                <button
                  onClick={clearDb}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5 rounded-lg hover:bg-destructive/10"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/nl2sql")}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/80 transition-all duration-200 hover:shadow-glow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                Get Started
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            menuOpen ? "max-h-80 border-t border-border" : "max-h-0"
          }`}
        >
          <div className="bg-background/98 backdrop-blur-md px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
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
                  <div className="flex items-center gap-2 text-xs text-success font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    {dbName || "Connected"}
                  </div>
                  <button
                    onClick={clearDb}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
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

      {/* Spacer so content doesn't hide under fixed navbar */}
      <div className="h-14" />
    </>
  );
};