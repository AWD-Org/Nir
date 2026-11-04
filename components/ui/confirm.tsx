"use client";

import * as A from "@radix-ui/react-alert-dialog";

export function Confirm({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  danger = true,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <A.Root open={open} onOpenChange={onOpenChange}>
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <A.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-2xl">
          <A.Title className="text-lg font-semibold">{title}</A.Title>
          <A.Description className="mt-2 text-ink-2">{description}</A.Description>
          <div className="mt-6 flex justify-end gap-2">
            <A.Cancel className="btn-secondary">Cancelar</A.Cancel>
            <A.Action className={danger ? "btn bg-bad text-white hover:bg-[#912018]" : "btn-primary"} onClick={onConfirm}>
              {confirmLabel}
            </A.Action>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}
