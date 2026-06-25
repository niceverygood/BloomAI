"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEMO = [
  { label: "코디네이터", email: "coord@bloom.kr" },
  { label: "간호사", email: "nurse@bloom.kr" },
  { label: "의사", email: "doctor@bloom.kr" },
  { label: "원장", email: "admin@bloom.kr" },
];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("coord@bloom.kr");
  const [password, setPassword] = useState("bloom1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "로그인 실패");
      const from = params.get("from");
      router.push(from && from.startsWith("/") ? from : "/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-bold text-plum">이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-coral"
          placeholder="you@clinic.kr"
          autoComplete="username"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-bold text-plum">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-coral"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      {error && <div className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral-deep">{error}</div>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "로그인 중…" : "로그인"}
      </button>

      <div className="rounded-xl bg-peach p-3">
        <div className="mb-2 text-xs font-bold text-muted">데모 계정 (클릭하면 자동입력 · 비번 bloom1234)</div>
        <div className="flex flex-wrap gap-1.5">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => { setEmail(d.email); setPassword("bloom1234"); }}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-coral-deep hover:bg-coral-soft"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
