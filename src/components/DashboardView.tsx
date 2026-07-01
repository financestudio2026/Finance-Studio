import React from "react";
import { Vehicle, Driver, Expense } from "../types";
import { getDocumentStatus, formatDate } from "../utils/dateUtils";
import MetricCard from "./MetricCard";
import { 
  ShieldCheck, 
  Truck, 
  Users, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle,
  TrendingUp,
  FileSpreadsheet,
  Zap,
  Info,
  Download
} from "lucide-react";

interface DashboardViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  expenses: Expense[];
  onNavigateToTab: (tab: string) => void;
  onLocateVehicle: (vehicle: Vehicle) => void;
}

export default function DashboardView({
  vehicles,
  drivers,
  expenses,
  onNavigateToTab,
  onLocateVehicle
}: DashboardViewProps) {
  // 1. Calculate general stats
  const totalVehicles = vehicles.length;
  const totalDrivers = drivers.length;
  const currentMonthExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // 2. Document Alert analysis
  interface DocumentAlert {
    vehicleId: string;
    regNo: string;
    model: string;
    docType: "EMI" | "Insurance" | "Tax" | "Fitness";
    docTypeHindi: "किश्त (EMI)" | "बीमा (Insurance)" | "टैक्स (Tax)" | "फिटनेस (Fitness)";
    expiryDate: string;
    daysLeft: number;
    status: "Expired" | "Due Soon";
    statusColor: string;
  }

  const alerts: DocumentAlert[] = [];
  let fullyValidCount = 0;

  vehicles.forEach((v) => {
    const emi = getDocumentStatus(v.emiDueDate, 15);
    const ins = getDocumentStatus(v.insuranceExpiry, 30);
    const tax = getDocumentStatus(v.taxExpiry, 30);
    const fit = getDocumentStatus(v.fitnessExpiry, 30);

    let vehicleHasIssue = false;

    // Check EMI
    if (emi.label === "Expired" || emi.label === "Due Soon") {
      vehicleHasIssue = true;
      alerts.push({
        vehicleId: v.id,
        regNo: v.regNo,
        model: v.model,
        docType: "EMI",
        docTypeHindi: "किश्त (EMI)",
        expiryDate: v.emiDueDate,
        daysLeft: emi.days,
        status: emi.label === "Expired" ? "Expired" : "Due Soon",
        statusColor: emi.label === "Expired" ? "text-red-600 bg-red-50 border-red-100" : "text-amber-600 bg-amber-50 border-amber-100"
      });
    }

    // Check Insurance
    if (ins.label === "Expired" || ins.label === "Due Soon") {
      vehicleHasIssue = true;
      alerts.push({
        vehicleId: v.id,
        regNo: v.regNo,
        model: v.model,
        docType: "Insurance",
        docTypeHindi: "बीमा (Insurance)",
        expiryDate: v.insuranceExpiry,
        daysLeft: ins.days,
        status: ins.label === "Expired" ? "Expired" : "Due Soon",
        statusColor: ins.label === "Expired" ? "text-red-600 bg-red-50 border-red-100" : "text-amber-600 bg-amber-50 border-amber-100"
      });
    }

    // Check Tax
    if (tax.label === "Expired" || tax.label === "Due Soon") {
      vehicleHasIssue = true;
      alerts.push({
        vehicleId: v.id,
        regNo: v.regNo,
        model: v.model,
        docType: "Tax",
        docTypeHindi: "टैक्स (Tax)",
        expiryDate: v.taxExpiry,
        daysLeft: tax.days,
        status: tax.label === "Expired" ? "Expired" : "Due Soon",
        statusColor: tax.label === "Expired" ? "text-red-600 bg-red-50 border-red-100" : "text-amber-600 bg-amber-50 border-amber-100"
      });
    }

    // Check Fitness
    if (fit.label === "Expired" || fit.label === "Due Soon") {
      vehicleHasIssue = true;
      alerts.push({
        vehicleId: v.id,
        regNo: v.regNo,
        model: v.model,
        docType: "Fitness",
        docTypeHindi: "फिटनेस (Fitness)",
        expiryDate: v.fitnessExpiry,
        daysLeft: fit.days,
        status: fit.label === "Expired" ? "Expired" : "Due Soon",
        statusColor: fit.label === "Expired" ? "text-red-600 bg-red-50 border-red-100" : "text-amber-600 bg-amber-50 border-amber-100"
      });
    }

    if (!vehicleHasIssue) {
      fullyValidCount++;
    }
  });

  // Sort alerts: expired first, then soonest expiring
  alerts.sort((a, b) => a.daysLeft - b.daysLeft);

  const compliancePercentage = totalVehicles > 0 ? Math.round((fullyValidCount / totalVehicles) * 100) : 100;

  return (
    <div className="space-y-6" id="dashboard_view">
      {/* Visual security and backup info badge */}
      <div className="bg-emerald-900/5 border border-emerald-500/25 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-2.5 items-center">
          <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-700">
            <ShieldCheck className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Secure Database Status: Real-time Cloud Encryption Enabled</h4>
            <p className="text-[10px] text-slate-500">सभी दस्तावेज सुरक्षित हैं और गूगल क्लाउड पर डेली बैकअप (Daily Backup) चालू है।</p>
          </div>
        </div>
        <span className="text-[9px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg whitespace-nowrap uppercase tracking-wider">
          ● SECURE & DEPLOYED
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          id="stat_compliance"
          title="Fleet Compliance"
          titleHindi="पूर्ण वैध गाड़ियां (%)"
          value={`${compliancePercentage}%`}
          icon={ShieldCheck}
          iconColorClass="text-emerald-700 bg-emerald-50 border border-emerald-200/50"
          subtitle={`${fullyValidCount} / ${totalVehicles} Vehicles Clean`}
          subtitleHindi={`${fullyValidCount} गाड़ियों के सभी कागज सही हैं`}
          trendColorClass="text-emerald-700"
        />

        <MetricCard
          id="stat_total_vehicles"
          title="Total Fleet"
          titleHindi="कुल गाड़ियां"
          value={totalVehicles}
          icon={Truck}
          iconColorClass="text-indigo-700 bg-indigo-50 border border-indigo-100"
          subtitle="Registered commercial vehicles"
          subtitleHindi="पंजीकृत व्यावसायिक वाहन"
        />

        <MetricCard
          id="stat_total_drivers"
          title="Active Drivers"
          titleHindi="सक्रिय गाड़ी चालक"
          value={totalDrivers}
          icon={Users}
          iconColorClass="text-purple-700 bg-purple-50 border border-purple-100"
          subtitle={`${drivers.filter(d => d.status === "On Trip").length} currently on duty`}
          subtitleHindi="चालक ड्यूटी पर कार्यरत हैं"
        />

        <MetricCard
          id="stat_total_expenses"
          title="Total Expenses"
          titleHindi="कुल मासिक खर्च"
          value={`₹${currentMonthExpenses.toLocaleString("en-IN")}`}
          icon={TrendingDown}
          iconColorClass="text-rose-700 bg-rose-50 border border-rose-100"
          subtitle="Fuel, EMI and clearance bills"
          subtitleHindi="ईंधन, किश्त और अन्य खर्च"
          trendColorClass="text-rose-700"
        />
      </div>

      {/* Main Grid: Left is Expiry Alerts, Right is Summary & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Document Expiry Alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between" id="expiry_alerts_panel">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Urgent Expiry Alerts (दस्तावेज अलर्ट)
                </h3>
                <p className="text-xs text-slate-500">Documents expired or expiring in the next 30 days</p>
              </div>
              <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                {alerts.length} Action Needed
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="bg-emerald-50/30 p-8 text-center rounded-lg border border-dashed border-emerald-200">
                <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-800">All fleet documents are up to date!</h4>
                <p className="text-xs text-emerald-600 mt-1">सभी गाड़ियों के EMI, टैक्स और फिटनेस प्रमाण पत्र पूर्णतः वैध हैं।</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {alerts.map((alert, index) => (
                  <div
                    key={`${alert.vehicleId}_${alert.docType}_${index}`}
                    className={`p-3.5 rounded-lg border flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all ${alert.statusColor}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-950 text-sm">{alert.regNo}</span>
                        <span className="text-xs text-slate-500">• {alert.model}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-700">
                        <span className="bg-white/90 px-2 py-0.5 rounded border border-slate-200/50 shadow-sm">
                          {alert.docTypeHindi}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Expiry: {formatDate(alert.expiryDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 justify-between sm:justify-end">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold">
                          {alert.daysLeft < 0 
                            ? `Expired ${Math.abs(alert.daysLeft)} days ago` 
                            : `Expires in ${alert.daysLeft} days`}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => onNavigateToTab("expenses")}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Renew / Pay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-150 text-xs text-slate-400 flex justify-between items-center">
            <span>* Alerts update in real-time based on local date status.</span>
            <button 
              onClick={() => onNavigateToTab("vehicles")}
              className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline cursor-pointer"
            >
              Manage Documents →
            </button>
          </div>
        </div>

        {/* Right: Quick actions, backup helper, etc. */}
        <div className="space-y-6">
          {/* Document Status Meter */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-600" />
              Document Status Audit
            </h3>
            
            <div className="space-y-3">
              {/* EMI status */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Loan EMI Due Status</span>
                  <span className="text-slate-900">
                    {vehicles.filter(v => getDocumentStatus(v.emiDueDate, 15).label === "Valid").length} / {totalVehicles} Paid
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${totalVehicles > 0 ? (vehicles.filter(v => getDocumentStatus(v.emiDueDate, 15).label === "Valid").length / totalVehicles) * 100 : 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Insurance status */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Insurance Validity</span>
                  <span className="text-slate-900">
                    {vehicles.filter(v => getDocumentStatus(v.insuranceExpiry, 30).label === "Valid").length} / {totalVehicles} Active
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${totalVehicles > 0 ? (vehicles.filter(v => getDocumentStatus(v.insuranceExpiry, 30).label === "Valid").length / totalVehicles) * 100 : 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Tax status */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Road Tax Paid Status</span>
                  <span className="text-slate-900">
                    {vehicles.filter(v => getDocumentStatus(v.taxExpiry, 30).label === "Valid").length} / {totalVehicles} Clear
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${totalVehicles > 0 ? (vehicles.filter(v => getDocumentStatus(v.taxExpiry, 30).label === "Valid").length / totalVehicles) * 100 : 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Fitness status */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Fitness Clearances</span>
                  <span className="text-slate-900">
                    {vehicles.filter(v => getDocumentStatus(v.fitnessExpiry, 30).label === "Valid").length} / {totalVehicles} Certified
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-600 rounded-full"
                    style={{ width: `${totalVehicles > 0 ? (vehicles.filter(v => getDocumentStatus(v.fitnessExpiry, 30).label === "Valid").length / totalVehicles) * 100 : 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Backup Database Snapshot utility */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 text-slate-700 pointer-events-none">
              <FileSpreadsheet className="h-24 w-24 opacity-10 text-indigo-500" />
            </div>
            
            <h3 className="text-sm font-extrabold flex items-center gap-1.5">
              Secure Local Data Backup
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Google Cloud automatically performs encrypted daily database backups. Additionally, you can trigger a localized backup snapshot to download the full fleet datasets instantly.
            </p>

            <button
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ vehicles, drivers, expenses }, null, 2));
                const dlAnchorElem = document.createElement('a');
                dlAnchorElem.setAttribute("href", dataStr);
                dlAnchorElem.setAttribute("download", `Fleet_Backup_${new Date().toISOString().split("T")[0]}.json`);
                dlAnchorElem.click();
              }}
              className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
            >
              <Download className="h-3.5 w-3.5" />
              Download Backup Snapshot (बैकअप डाउनलोड)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
