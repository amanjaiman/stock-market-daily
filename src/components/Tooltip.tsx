import { useState, ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  className?: string;
}

function Tooltip({ children, content, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleToggle = () => {
    setIsVisible(!isVisible);
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <span className={`relative inline ${className}`}>
      <span
        className="cursor-help underline decoration-dotted decoration-emerald-500 decoration-2 underline-offset-2 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleToggle}
        onTouchStart={handleToggle}
        role="button"
        tabIndex={0}
        aria-describedby={`tooltip-${content
          .replace(/\s+/g, "-")
          .toLowerCase()}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        {children}
      </span>

      {isVisible && (
        <span
          id={`tooltip-${content.replace(/\s+/g, "-").toLowerCase()}`}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-slate-800 dark:bg-slate-700 rounded-lg shadow-lg whitespace-nowrap z-50 animate-in fade-in-0 zoom-in-95 duration-200"
          role="tooltip"
        >
          {content}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></span>
        </span>
      )}
    </span>
  );
}

export default Tooltip;
