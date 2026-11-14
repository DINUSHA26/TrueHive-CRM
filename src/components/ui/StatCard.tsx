import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number; // e.g., +12.5 or -4.2
  changePeriod?: string; // e.g., "vs last week"
  icon: React.ReactNode;
  iconBg?: string; // e.g. "bg-blue-600/20 text-blue-400"
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "danger" | "neutral" | "primary";
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changePeriod = "vs last month",
  icon,
  iconBg = "bg-blue-600/20 text-blue-400 border border-blue-500/20",
  badgeText,
  badgeVariant = "primary",
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl shadow-black/20 hover:border-slate-700/80 transition duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <h4 className="text-2xl font-bold text-white tracking-tight mt-1">{value}</h4>
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>{icon}</div>
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
        {change !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`flex items-center font-semibold text-xs ${
                isPositive
                  ? "text-emerald-400"
                  : isNegative
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              ) : isNegative ? (
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <Minus className="w-3.5 h-3.5 mr-0.5" />
              )}
              {change > 0 ? `+${change}%` : `${change}%`}
            </span>
            <span className="text-[11px] text-slate-400">{changePeriod}</span>
          </div>
        ) : subtitle ? (
          <span className="text-[11px] text-slate-400">{subtitle}</span>
        ) : (
          <span />
        )}

        {badgeText && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}

