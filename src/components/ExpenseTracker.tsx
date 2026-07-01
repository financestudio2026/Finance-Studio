import React, { useState } from "react";
import { Expense, Vehicle, ExpenseCategory } from "../types";
import { formatDate } from "../utils/dateUtils";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  IndianRupee, 
  AlertCircle, 
  X,
  TrendingDown,
  Calendar,
  Layers,
  Sparkles,
  User
} from "lucide-react";
import { collection, setDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

interface ExpenseTrackerProps {
  expenses: Expense[];
  vehicles: Vehicle[];
  user: { uid: string; name: string; role: "admin" | "driver"; assignedVehicleId?: string };
  onRefresh: () => void;
}

export default function ExpenseTracker({ expenses, vehicles, user, onRefresh }: ExpenseTrackerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // New expense form state
  const [vehicleId, setVehicleId] = useState(user.role === "driver" ? user.assignedVehicleId || "" : "");
  const [category, setCategory] = useState<ExpenseCategory>("Fuel");
  const [amount, setAmount] = useState<number>(1000);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    // If user is a driver, they only see expenses they logged OR expenses for their assigned vehicle
    const isOwner = user.role === "admin" || e.loggedBy === user.uid || (user.assignedVehicleId && e.vehicleId === user.assignedVehicleId);
    if (!isOwner) return false;

    const matchesSearch = 
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.vehicleReg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.loggedByName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "All" || e.category === selectedCategory;
    const matchesVehicle = selectedVehicleId === "All" || e.vehicleId === selectedVehicleId;

    return matchesSearch && matchesCategory && matchesVehicle;
  });

  // Calculate stats
  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category distribution
  const categories: ExpenseCategory[] = ["EMI", "Insurance", "Tax", "Fitness", "Fuel", "Maintenance", "Toll", "Fine", "Other"];
  const categoryTotals = categories.reduce((acc, cat) => {
    acc[cat] = filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!vehicleId || !amount || !date || !description) {
      setFormError("सभी फ़ील्ड भरना अनिवार्य है (All fields are required).");
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (!selectedVehicle) {
      setFormError("कृपया एक वैध गाड़ी चुनें (Please select a valid vehicle).");
      return;
    }

    setSubmitting(true);
    try {
      const docId = `expense_${Date.now()}`;
      const newExpense: Expense = {
        id: docId,
        vehicleId,
        vehicleReg: selectedVehicle.regNo,
        category,
        amount: Number(amount),
        date,
        description,
        loggedBy: user.uid,
        loggedByName: user.name,
        loggedByRole: user.role
      };

      await setDoc(doc(db, "expenses", docId), newExpense);
      
      // Reset form
      setAmount(1000);
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || "Failed to log expense.");
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Export Report Generator
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert("No data available to export.");
      return;
    }

    const csvHeaders = ["Expense ID", "Date", "Vehicle Reg. No.", "Category", "Amount (INR)", "Description", "Logged By", "Role"];
    const csvRows = filteredExpenses.map((e) => [
      e.id,
      e.date,
      `"${e.vehicleReg}"`,
      e.category,
      e.amount,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.loggedByName}"`,
      e.loggedByRole
    ]);

    const csvContent = [csvHeaders.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Fleet_Expense_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="expenses_tab">
      {/* Category breakdown visual overview */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-600" />
          Expense Breakdown by Category (श्रेणी अनुसार खर्च)
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const catAmount = categoryTotals[cat];
            const percentage = totalExpenseAmount > 0 ? Math.round((catAmount / totalExpenseAmount) * 100) : 0;
            
            if (catAmount === 0) return null;

            return (
              <div key={cat} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-bold">{cat}</span>
                  <span className="font-bold text-indigo-600">{percentage}%</span>
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                  ₹{catAmount.toLocaleString("en-IN")}
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="expense_search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search description, vehicle..."
              className="pl-9 pr-3 py-2 border border-slate-250 rounded-lg text-xs w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <select
            id="expense_cat_filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 font-semibold cursor-pointer"
          >
            <option value="All">All Categories (सभी खर्चे)</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          {/* Vehicle Filter */}
          {user.role === "admin" && (
            <select
              id="expense_vehicle_filter"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 font-semibold cursor-pointer"
            >
              <option value="All">All Vehicles (सभी गाड़ियां)</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNo}</option>)}
            </select>
          )}
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            id="export_report_btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 rounded-lg font-bold text-xs transition-colors cursor-pointer bg-white"
          >
            <Download className="h-4 w-4" />
            Export Report (CSV)
          </button>

          <button
            id="log_expense_btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Log Expense
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="expenses_table_container">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div>
            <h4 className="text-base font-extrabold text-slate-900">Recent Expense Logs (खर्च सूची)</h4>
            <p className="text-xs text-slate-500 mt-0.5">Track real-time commercial expenses and bills</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Total Expense</span>
            <span className="text-lg font-black text-slate-900 block flex items-center justify-end font-mono">
              <TrendingDown className="h-4 w-4 text-rose-500 mr-1" />
              ₹{totalExpenseAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-150">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Vehicle / गाड़ी</th>
                <th className="px-6 py-3 text-left">Category / प्रकार</th>
                <th className="px-6 py-3 text-left">Date / तारीख</th>
                <th className="px-6 py-3 text-left">Description / विवरण</th>
                <th className="px-6 py-3 text-left">Logged By / द्वारा</th>
                <th className="px-6 py-3 text-right">Amount / राशि</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs text-slate-700" id="expenses_table_body">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic font-medium">
                    No matching expense reports logged.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-950">
                      {expense.vehicleReg}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                        expense.category === "Fuel" 
                          ? "bg-amber-50 text-amber-700 border border-amber-200/50" 
                          : expense.category === "EMI" 
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/50" 
                          : expense.category === "Maintenance" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
                          : "bg-slate-100 text-slate-700 border border-slate-200/50"
                      }`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium font-mono">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600 font-semibold">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 flex items-center gap-1.5 mt-1.5 font-medium">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{expense.loggedByName}</span>
                      <span className="text-[10px] text-slate-400">({expense.loggedByRole})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900 text-sm font-mono">
                      ₹{expense.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Log New Expense (नया खर्च दर्ज करें)</h3>
                <p className="text-xs text-slate-500 font-medium">Add operational and maintenance expenditures</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/55 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex gap-2 items-center font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Vehicle selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Select Vehicle (गाड़ी चुनें) *
                </label>
                {user.role === "driver" ? (
                  <input
                    type="text"
                    disabled
                    value={vehicles.find(v => v.id === user.assignedVehicleId)?.regNo || "No Assigned Vehicle"}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm font-bold"
                  />
                ) : (
                  <select
                    id="new_expense_vehicle"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="">Choose vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.regNo} — {v.model}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Expense Category *
                </label>
                <select
                  id="new_expense_cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Amount (खर्च राशि ₹) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold">
                    ₹
                  </div>
                  <input
                    id="new_expense_amount"
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-bold"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Date of Expense *
                </label>
                <input
                  id="new_expense_date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description (विवरण) *
                </label>
                <textarea
                  id="new_expense_desc"
                  required
                  rows={2}
                  placeholder="e.g. Fuel purchase or oil replacement detail"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>

              <div className="border-t border-slate-150 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit_expense_btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Log Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
