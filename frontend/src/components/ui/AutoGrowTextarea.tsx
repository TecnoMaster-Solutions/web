"use client";

import React, { useEffect, useRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
};

export default function AutoGrowTextarea({ value, ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      rows={1}
      onInput={(e) => {
        props.onInput?.(e);
        resize();
      }}
      className={["resize-none overflow-hidden", props.className ?? ""].join(
        " ",
      )}
    />
  );
}
