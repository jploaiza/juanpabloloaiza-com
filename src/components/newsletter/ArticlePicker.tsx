"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import type { BlogPost } from "@/lib/blog-data";

interface Props {
  posts: BlogPost[];
  value: BlogPost | null;
  onChange: (post: BlogPost | null) => void;
  disabled?: boolean;
}

export default function ArticlePicker({ posts, value, onChange, disabled }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? posts.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()) || (p.tags ?? []).some((t) => t.toLowerCase().includes(query.toLowerCase())))
    : posts.slice(0, 8);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-3 bg-[#0a1628] border border-[#C5A059]/30 px-3 py-2.5">
        {value.imageUrl && (
          <img src={value.imageUrl} alt={value.title} className="w-12 h-8 object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-crimson text-sm text-gray-200 truncate">{value.title}</p>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600">{value.category}</p>
        </div>
        {!disabled && (
          <button type="button" onClick={() => onChange(null)} className="text-gray-500 hover:text-red-400 transition flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 bg-[#0a1628] border border-[#C5A059]/20 px-3 py-2.5">
        <Search className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder="Buscar artículo..."
          className="flex-1 bg-transparent text-gray-300 font-crimson text-sm focus:outline-none placeholder-gray-600 disabled:opacity-50"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 bg-[#16213e] border border-[#C5A059]/20 shadow-xl max-h-60 overflow-y-auto">
          {filtered.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => { onChange(post); setOpen(false); setQuery(""); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#C5A059]/10 transition text-left"
            >
              {post.imageUrl && (
                <img src={post.imageUrl} alt={post.title} className="w-10 h-7 object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-crimson text-sm text-gray-200 truncate">{post.title}</p>
                <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600">{post.category} · {new Date(post.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
