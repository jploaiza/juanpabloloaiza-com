import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  gold: "bg-[#C5A059] text-[#020617] hover:bg-[#d4b06a] active:bg-[#b08a45] font-semibold shadow-[0_0_20px_rgba(197,160,89,0.2)]",
  ghost: "bg-transparent text-[#C5A059] hover:bg-[#C5A059]/10 border border-transparent",
  outline: "bg-transparent text-[#C5A059] border border-[#C5A059]/40 hover:border-[#C5A059] hover:bg-[#C5A059]/5",
  danger: "bg-red-900/20 text-red-400 border border-red-800/40 hover:bg-red-900/40",
};

const sizes = {
  sm: "px-4 py-2 text-xs tracking-widest",
  md: "px-6 py-2.5 text-xs tracking-widest",
  lg: "px-8 py-3.5 text-sm tracking-widest",
};

const AcademyButton = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "gold", size = "md", loading, fullWidth, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          font-cinzel uppercase transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);

AcademyButton.displayName = "AcademyButton";
export default AcademyButton;
