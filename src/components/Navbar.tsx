import { Button } from "@/components/ui/button";
import { Heart, Menu, User, Brain, Activity, Stethoscope, Truck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSession, signOut } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = path;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
              CareConnect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-wellness font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">
              Home
            </Link>
            <Link to="/symptom-checker" className="text-foreground hover:text-primary transition-wellness font-medium flex items-center gap-1.5 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">
              <Brain className="w-4 h-4" />
              Symptom Checker
            </Link>
            <Link to="/doctors" className="text-foreground hover:text-primary transition-wellness font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">
              Doctors
            </Link>
            <Link to="/consultation" className="text-foreground hover:text-primary transition-wellness font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">
              Consultation
            </Link>
            <Link to="/home-delivery" className="text-foreground hover:text-primary transition-wellness font-medium flex items-center gap-1.5 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">
              <Truck className="w-4 h-4" />
              Home Delivery
            </Link>
            <Link to="/health-assistant" className="text-foreground hover:text-primary transition-wellness font-medium flex items-center gap-1.5 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">
              <Brain className="w-4 h-4" />
              Health Assistant
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 transition-wellness hover:scale-105 glass-card">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="max-w-[120px] truncate">
                      {session.user.name || session.user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/symptom-checker" className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Symptom Checker
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/consultation" className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      Book Consultation
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      window.location.href = "/";
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="transition-wellness hover:scale-105 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNavigation("/signin");
                  }}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  className="transition-wellness hover:scale-105 hover:shadow-wellness cursor-pointer bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNavigation("/signup");
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2 transition-transform duration-300 hover:scale-110 rounded-lg hover:bg-muted"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border/50 animate-fade-up">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block py-2 text-foreground hover:text-primary transition-colors font-medium hover:translate-x-1 duration-300">
              Home
            </Link>
            <Link to="/symptom-checker" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2 text-foreground hover:text-primary transition-colors font-medium hover:translate-x-1 duration-300">
              <Brain className="w-4 h-4" />
              Symptom Checker
            </Link>
            <Link to="/doctors" onClick={() => setIsMenuOpen(false)} className="block py-2 text-foreground hover:text-primary transition-colors font-medium hover:translate-x-1 duration-300">
              Doctors
            </Link>
            <Link to="/consultation" onClick={() => setIsMenuOpen(false)} className="block py-2 text-foreground hover:text-primary transition-colors font-medium hover:translate-x-1 duration-300">
              Consultation
            </Link>
            <div className="pt-3 space-y-2">
              {session ? (
                <>
                  <Button variant="ghost" asChild className="w-full transition-wellness hover:scale-105">
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full transition-wellness hover:scale-105"
                    onClick={async () => {
                      await signOut();
                      window.location.href = "/";
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full transition-wellness hover:scale-105 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      handleNavigation("/signin");
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    className="w-full transition-wellness hover:scale-105 hover:shadow-wellness cursor-pointer bg-gradient-to-r from-primary to-teal-600"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      handleNavigation("/signup");
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
