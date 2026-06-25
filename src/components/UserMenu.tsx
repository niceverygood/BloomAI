"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserMenu({ name, role, color }: { name: string; role: string; color?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-bold text-plum">{name}</div>
          <div className="text-[11px] text-muted">{role}</div>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: color || "#FF6B81" }}
        >
          {name.slice(0, 1)}
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-line bg-white p-1.5 shadow-pop">
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-peach"
            >
              <span>↩</span> 로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}
