import { Link, useLocation } from "wouter";
import { Home, UserPlus, Camera, ClipboardList, Users } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/register", label: "Register", icon: UserPlus },
  { href: "/attendance", label: "Attendance", icon: Camera },
  { href: "/logs", label: "Logs", icon: ClipboardList },
  { href: "/people", label: "People", icon: Users },
];

export function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
          <Camera className="h-6 w-6 text-primary" />
          <span className="hidden font-semibold text-lg sm:inline-block">FaceAttend</span>
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover-elevate",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline-block">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <ThemeToggle />
      </div>
    </nav>
  );
}
