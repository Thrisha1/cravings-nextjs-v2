"use client";

import { useState } from "react";

interface FontOption {
  value: string;
  label: string;
  className: string;
}

interface FontSelectProps {
  options: FontOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FontSelect({ options, value, onChange }: FontSelectProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            className={`p-2 sm:p-3 border rounded-lg text-left transition-all text-sm sm:text-base ${option.className} ${
              value === option.value
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "border-muted hover:border-primary/40 hover:bg-gray-50"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}