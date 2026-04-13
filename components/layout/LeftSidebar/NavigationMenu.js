"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavigationMenu = () => {
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: "Trending", icon: "📈" },
    { href: "/pumpfun", label: "Pump.fun Tokens", icon: "🚀" },
    { href: "/portfolio", label: "Portfolio", icon: "💼" },
  ];

  return (
    <div className="mt-8">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">Navigation</h3>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex items-center px-4 py-2.5 text-sm rounded transition-colors ${isActive ? "bg-dex-bg-highlight text-dex-text-primary" : "text-dex-text-secondary hover:bg-dex-bg-highlight hover:text-dex-text-primary"}`}>
              <span className="mr-3 w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default NavigationMenu;
