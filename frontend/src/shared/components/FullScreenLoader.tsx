"use client";

import React from "react";

export default function FullScreenLoader({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[99999]">
      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}