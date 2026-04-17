"use client";

import { useRef } from "react";

type BulkSelectControlsProps = {
  targetName: string;
  selectOptions?: Array<{
    label: string;
    value: string;
  }>;
  tagAttribute?: string;
};

export function BulkSelectControls({
  targetName,
  selectOptions = [],
  tagAttribute = "data-bulk-tags",
}: BulkSelectControlsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  function setChecked(checked: boolean, tag?: string) {
    const form = rootRef.current?.closest("form");

    if (!form) {
      return;
    }

    const checkboxes = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${targetName}"]`);

    checkboxes.forEach((checkbox) => {
      if (!tag) {
        checkbox.checked = checked;
        return;
      }

      const rawTags = checkbox.getAttribute(tagAttribute) ?? "";
      const tags = rawTags
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      checkbox.checked = checked ? tags.includes(tag) : false;
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
      {selectOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setChecked(true, option.value)}
          className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-500"
        >
          {option.label}
        </button>
      ))}
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
