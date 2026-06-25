"use client";

import { useState } from "react";

/** 호버 툴팁 (자식을 감싸면 위에 말풍선) */
export function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-plum px-2.5 py-1.5 text-xs font-medium text-white shadow-pop">
          {text}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-plum" />
        </span>
      )}
    </span>
  );
}

/** ⓘ 도움말 아이콘 — 호버하면 설명 (가이드 툴팁) */
export function InfoTip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex align-middle" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-line text-[10px] font-bold text-muted">
        ?
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 z-30 mb-1.5 w-56 -translate-x-1/2 rounded-lg bg-plum px-3 py-2 text-xs font-medium leading-relaxed text-white shadow-pop">
          {text}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-plum" />
        </span>
      )}
    </span>
  );
}
