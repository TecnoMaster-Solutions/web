import React from "react";

export function PageBtn({
  children,
  onClick,
  disabled,
  active,
  variant = "page",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  variant?: "page" | "arrow";
}) {
  const baseClasses =
    variant === "arrow"
      ? "h-8 w-8 rounded-md text-slate-600 hover:text-slate-800"
      : "h-8 min-w-8 rounded-md px-2 text-sm font-medium";

  const stateClasses =
    variant === "arrow"
      ? disabled
        ? "opacity-40 cursor-not-allowed"
        : "cursor-pointer hover:bg-gray-100"
      : active
      ? "bg-[#2A9781] text-white shadow-sm"
      : "text-slate-600 hover:bg-gray-100";

  return (
    <button
      {...rest}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-colors duration-150 ${baseClasses} ${stateClasses} ${className}`}
    >
      {children}
    </button>
  );
}
