"use client";

import { useRef } from "react";

type BulkSelectControlsProps = {
  targetName: string;
};

export function BulkSelectControls({ targetName }: BulkSelectControlsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  function setChecked(checked: boolean) {
    const form = rootRef.current?.closest("form");

    if (!form) {
      return;
    }

    const checkboxes = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${targetName}"]`);

    checkboxes.forEach((checkbox) => {
      checkbox.checked = checked;
    });
  }

  return (
    <div ref={rootRef} className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setChecked(true)}
        className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-500"
      >
        Select visible
      </button>
      <button
        type="button"
        onClick={() => setChecked(false)}
        className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500"
      >
        Clear
      </button>
    </div>
  );
}
