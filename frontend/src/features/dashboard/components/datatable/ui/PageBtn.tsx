import React from "react";
import Colors from "@/shared/theme/colors";

export function PageBtn({
  children,
  onClick,
  disabled,
  active,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...rest}
      onClick={onClick}
      disabled={disabled}
      className={`min-w-6 sm:min-w-8 rounded-md px-1 sm:px-2 py-1 text-xs border text-black
        transition-all duration-200 ease-in-out
        ${
          active
            ? "bg-white shadow-md scale-105"
            : "hover:shadow-sm hover:scale-105"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${className}`}
      style={{
        backgroundColor: active ? "white" : Colors.table.header,
        borderColor: Colors.table.lines,
      }}
    >
      {children}
    </button>
  );
}
