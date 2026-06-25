"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "대시보드", icon: "▦" },
  { href: "/patients", label: "환자", icon: "❤" },
  { href: "/consultations/new", label: "AI 상담요약", icon: "✨", badge: "AI" },
  { href: "/messages", label: "메시지", icon: "✉" },
  { href: "/settings", label: "설정", icon: "⚙" },
];

export function Sidebar({ tenantName, plan }: { tenantName: string; plan: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-white">
      <div className="px-5 py-5">
        <Wordmark size={28} />
      </div>

      <nav className="flex-1 px-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active ? "bg-coral-soft text-coral-deep" : "text-muted hover:bg-peach hover:text-ink"
              )}
            >
              <span className="w-4 text-center text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-md bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl bg-peach p-3">
        <div className="text-xs font-bold text-plum">{tenantName}</div>
        <div className="mt-0.5 text-[11px] capitalize text-muted">{plan} 플랜</div>
      </div>
    </aside>
  );
}
