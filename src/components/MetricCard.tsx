import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  id: string;
  title: string;
  titleHindi?: string;
  value: string | number;
  icon: LucideIcon;
  iconColorClass?: string;
  subtitle?: string;
  subtitleHindi?: string;
  trendColorClass?: string;
}

export default function MetricCard({
  id,
  title,
  titleHindi,
  value,
  icon: Icon,
  iconColorClass = "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  subtitle,
  subtitleHindi,
  trendColorClass = "text-slate-500"
}: MetricCardProps) {
  return (
    <div
      id={id}
      className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">
            {title}
          </span>
          {titleHindi && (
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
              {titleHindi}
            </span>
          )}
          <h3 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${iconColorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {(subtitle || subtitleHindi) && (
        <div className="mt-4 pt-3 border-t border-slate-50 flex flex-col gap-0.5">
          {subtitle && (
            <span className={`text-xs font-medium ${trendColorClass}`}>
              {subtitle}
            </span>
          )}
          {subtitleHindi && (
            <span className="text-[10px] text-slate-400 font-normal">
              {subtitleHindi}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
