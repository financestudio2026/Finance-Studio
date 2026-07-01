import React from "react";
import { Vehicle } from "../types";
import { getDocumentStatus, formatDate, getDaysRemaining } from "../utils/dateUtils";
import { 
  Calendar, 
  ShieldCheck, 
  FileCheck, 
  HeartPulse, 
  TrendingUp, 
  MapPin, 
  User, 
  AlertTriangle 
} from "lucide-react";

interface VehicleCardProps {
  key?: string;
  vehicle: Vehicle;
  onLocate: (vehicle: Vehicle) => void;
  onAssignDriver?: (vehicle: Vehicle) => void;
  isAdmin: boolean;
}

export default function VehicleCard({ vehicle, onLocate, onAssignDriver, isAdmin }: VehicleCardProps) {
  // Get document statuses
  const emiStatus = getDocumentStatus(vehicle.emiDueDate, 15); // EMI warning threshold 15 days
  const insStatus = getDocumentStatus(vehicle.insuranceExpiry, 30); // Insurance warning threshold 30 days
  const taxStatus = getDocumentStatus(vehicle.taxExpiry, 30); // Tax warning threshold 30 days
  const fitStatus = getDocumentStatus(vehicle.fitnessExpiry, 30); // Fitness warning threshold 30 days

  // Calculate compliance rate (percentage of non-expired documents)
  const docs = [emiStatus, insStatus, taxStatus, fitStatus];
  const validDocsCount = docs.filter(d => d.label !== "Expired").length;
  const complianceRate = Math.round((validDocsCount / docs.length) * 100);

  // Status-based color for the vehicle border
  const statusBorderColor = 
    vehicle.status === "Active" 
      ? "border-l-emerald-500" 
      : vehicle.status === "Maintenance" 
      ? "border-l-amber-500" 
      : "border-l-slate-400";

  return (
    <div 
      id={`vehicle_card_${vehicle.id}`}
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${statusBorderColor} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      {/* Card Header */}
      <div className="p-5 border-b border-slate-150">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{vehicle.type}</span>
              <span className={`text-[10px] px-2 py-0.5 font-bold rounded-md ${
                vehicle.status === "Active" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
                  : vehicle.status === "Maintenance" 
                  ? "bg-amber-50 text-amber-700 border border-amber-200/50" 
                  : "bg-slate-100 text-slate-700 border border-slate-200/50"
              }`}>
                {vehicle.status === "Active" ? "Active (सक्रिय)" : vehicle.status === "Maintenance" ? "Maintenance (सर्विस)" : "Inactive (बंद)"}
              </span>
            </div>
            <h4 className="text-xl font-bold text-slate-900 tracking-tight font-sans mt-1">
              {vehicle.regNo}
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{vehicle.model}</p>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">Compliance</span>
            <span className={`text-lg font-extrabold block ${
              complianceRate === 100 
                ? "text-emerald-700" 
                : complianceRate >= 50 
                ? "text-amber-600" 
                : "text-rose-600"
            }`}>
              {complianceRate}%
            </span>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 ml-auto">
              <div 
                className={`h-full rounded-full ${
                  complianceRate === 100 
                    ? "bg-emerald-600" 
                    : complianceRate >= 50 
                    ? "bg-amber-500" 
                    : "bg-rose-500"
                }`}
                style={{ width: `${complianceRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="p-5 bg-slate-50/40 grid grid-cols-2 gap-3">
        {/* Loan EMI */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
              <span>EMI</span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${emiStatus.badgeClass}`}>
              {emiStatus.days < 0 ? "Expired" : `${emiStatus.days}d left`}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-slate-800 block">₹{vehicle.emiAmount.toLocaleString("en-IN")}</span>
            <span className="text-[10px] text-slate-400 block font-medium">Due: {formatDate(vehicle.emiDueDate)}</span>
          </div>
        </div>

        {/* Insurance */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Insurance</span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${insStatus.badgeClass}`}>
              {insStatus.days < 0 ? "Expired" : `${insStatus.days}d left`}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-slate-800 block truncate">{vehicle.insuranceProvider}</span>
            <span className="text-[10px] text-slate-400 block font-medium font-mono">Exp: {formatDate(vehicle.insuranceExpiry)}</span>
          </div>
        </div>

        {/* Road Tax */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <FileCheck className="h-3.5 w-3.5 text-purple-500" />
              <span>Road Tax</span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${taxStatus.badgeClass}`}>
              {taxStatus.days < 0 ? "Expired" : `${taxStatus.days}d left`}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-slate-800 block truncate">Tax Cert</span>
            <span className="text-[10px] text-slate-400 block font-medium font-mono">Exp: {formatDate(vehicle.taxExpiry)}</span>
          </div>
        </div>

        {/* Fitness Certificate */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
              <span>Fitness</span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${fitStatus.badgeClass}`}>
              {fitStatus.days < 0 ? "Expired" : `${fitStatus.days}d left`}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-slate-800 block truncate">Fitness Cert</span>
            <span className="text-[10px] text-slate-400 block font-medium font-mono">Exp: {formatDate(vehicle.fitnessExpiry)}</span>
          </div>
        </div>
      </div>

      {/* Driver info & Action bar */}
      <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-full text-slate-600">
            <User className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Driver (चालक)</span>
            <span className="font-bold text-slate-700 text-xs">
              {vehicle.assignedDriverName || "Not Assigned"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && onAssignDriver && (
            <button
              onClick={() => onAssignDriver(vehicle)}
              className="px-2.5 py-1.5 text-xs font-bold border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition-colors cursor-pointer"
            >
              Assign
            </button>
          )}
          <button
            onClick={() => onLocate(vehicle)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/40 rounded-lg transition-all cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5" />
            Track Live
          </button>
        </div>
      </div>
    </div>
  );
}
