import { forwardRef } from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const AcademyInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]/80">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-[#0e1b30] border text-gray-200 font-crimson text-base
              px-4 py-3 ${icon ? "pl-10" : ""}
              placeholder-gray-600 focus:outline-none transition-colors
              ${error
                ? "border-red-500/60 focus:border-red-500"
                : "border-white/10 focus:border-[#C5A059]/60"
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-red-400 text-xs font-crimson">{error}</p>
        )}
      </div>
    );
  }
);

AcademyInput.displayName = "AcademyInput";
export default AcademyInput;
