"use client";

import * as S from "@radix-ui/react-switch";

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  tone = "ok",
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  tone?: "ok" | "brand";
}) {
  return (
    <S.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent transition-colors disabled:opacity-50 ${
        checked ? (tone === "ok" ? "bg-ok" : "bg-brand-strong") : "bg-line-2"
      }`}
    >
      <S.Thumb className="block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[22px]" />
    </S.Root>
  );
}
