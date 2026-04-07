"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface Props {
  courseId: string;
  field: "notify_completion_user" | "notify_completion_admin" | "admin_notify_email";
  value: boolean | string;
  label: string;
}

export default function AdminNotifyToggle({ courseId, field, value: initialValue, label }: Props) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const isBoolean = typeof initialValue === "boolean";

  const handleToggle = async () => {
    if (!isBoolean) return;
    const next = !value;
    setSaving(true);
    setValue(next);
    const supabase = createClient();
    await supabase.from("courses").update({ [field]: next }).eq("id", courseId);
    setSaving(false);
  };

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("courses").update({ [field]: e.target.value }).eq("id", courseId);
    setSaving(false);
  };

  if (!isBoolean) {
    return (
      <div className="flex items-center gap-3">
        <label className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400 w-36 flex-shrink-0">
          {label}
        </label>
        <div className="flex items-center gap-2 flex-1">
          <input
            type="email"
            value={value as string}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            className="flex-1 bg-[#020d1f] border border-white/10 focus:border-[#C5A059]/60 text-gray-200 font-crimson text-sm px-3 py-1.5 outline-none transition-colors"
          />
          {saving && <Loader2 className="w-3 h-3 animate-spin text-[#C5A059]/60" />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="font-cinzel text-[10px] uppercase tracking-widest text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        {saving && <Loader2 className="w-3 h-3 animate-spin text-[#C5A059]/60" />}
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
            value ? "bg-[#C5A059]" : "bg-gray-700"
          }`}
          aria-label={label}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
              value ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
