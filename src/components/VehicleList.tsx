import React, { useState } from "react";
import { Vehicle, VehicleType, VehicleStatus } from "../types";
import VehicleCard from "./VehicleCard";
import { Plus, Search, Filter, AlertCircle, X, ShieldAlert, Check } from "lucide-react";
import { getDocumentStatus } from "../utils/dateUtils";
import { collection, addDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

interface VehicleListProps {
  vehicles: Vehicle[];
  onLocate: (vehicle: Vehicle) => void;
  onAssignDriver: (vehicle: Vehicle) => void;
  isAdmin: boolean;
  onRefresh: () => void;
}

export default function VehicleList({ vehicles, onLocate, onAssignDriver, isAdmin, onRefresh }: VehicleListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add vehicle form state
  const [regNo, setRegNo] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState<VehicleType>("Truck");
  const [emiAmount, setEmiAmount] = useState<number>(15000);
  const [emiDueDate, setEmiDueDate] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [taxExpiry, setTaxExpiry] = useState("");
  const [fitnessExpiry, setFitnessExpiry] = useState("");
  const [status, setStatus] = useState<VehicleStatus>("Active");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = 
      v.regNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.assignedDriverName && v.assignedDriverName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === "All" || v.type === selectedType;
    
    // Document status filtering
    let matchesStatus = true;
    if (selectedStatus === "Expired") {
      matchesStatus = 
        getDocumentStatus(v.emiDueDate, 15).label === "Expired" ||
        getDocumentStatus(v.insuranceExpiry, 30).label === "Expired" ||
        getDocumentStatus(v.taxExpiry, 30).label === "Expired" ||
        getDocumentStatus(v.fitnessExpiry, 30).label === "Expired";
    } else if (selectedStatus === "DueSoon") {
      matchesStatus = 
        (getDocumentStatus(v.emiDueDate, 15).label === "Due Soon" ||
        getDocumentStatus(v.insuranceExpiry, 30).label === "Due Soon" ||
        getDocumentStatus(v.taxExpiry, 30).label === "Due Soon" ||
        getDocumentStatus(v.fitnessExpiry, 30).label === "Due Soon") && 
        // exclude already expired
        !(getDocumentStatus(v.emiDueDate, 15).label === "Expired" ||
          getDocumentStatus(v.insuranceExpiry, 30).label === "Expired" ||
          getDocumentStatus(v.taxExpiry, 30).label === "Expired" ||
          getDocumentStatus(v.fitnessExpiry, 30).label === "Expired");
    } else if (selectedStatus === "Compliant") {
      matchesStatus = 
        getDocumentStatus(v.emiDueDate, 15).label === "Valid" &&
        getDocumentStatus(v.insuranceExpiry, 30).label === "Valid" &&
        getDocumentStatus(v.taxExpiry, 30).label === "Valid" &&
        getDocumentStatus(v.fitnessExpiry, 30).label === "Valid";
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!regNo || !model || !emiDueDate || !insuranceExpiry || !insuranceProvider || !taxExpiry || !fitnessExpiry) {
      setFormError("सभी फ़ील्ड भरना अनिवार्य है (All fields are required).");
      return;
    }

    // Validate registration number format (MH-12-PQ-1234 or similar)
    const formattedRegNo = regNo.toUpperCase().trim();

    setSubmitting(true);
    try {
      const docId = formattedRegNo.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      
      const newVehicle: Vehicle = {
        id: docId,
        regNo: formattedRegNo,
        model,
        type,
        emiAmount: Number(emiAmount),
        emiDueDate,
        insuranceExpiry,
        insuranceProvider,
        taxExpiry,
        fitnessExpiry,
        status,
        lat: 20.5937 + (Math.random() - 0.5) * 5, // Random Indian coordinate
        lng: 78.9629 + (Math.random() - 0.5) * 5,
        lastUpdated: new Date().toISOString()
      };

      await setDoc(doc(db, "vehicles", docId), newVehicle);
      
      // Reset form
      setRegNo("");
      setModel("");
      setInsuranceProvider("");
      setEmiDueDate("");
      setInsuranceExpiry("");
      setTaxExpiry("");
      setFitnessExpiry("");
      
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || "Failed to add vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="vehicles_tab">
      {/* Search & Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="vehicle_search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search MH-12, Tata, Driver name..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-250 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Vehicle Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              id="vehicle_type_filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Vehicles (सभी गाड़ियां)</option>
              <option value="Truck">Trucks (ट्रक)</option>
              <option value="Bus">Buses (बस)</option>
              <option value="Car">Cars (कार)</option>
              <option value="Van">Vans (वैन)</option>
              <option value="Auto">Autos (ऑटो)</option>
            </select>
          </div>

          {/* Document Validity Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
            <select
              id="vehicle_doc_filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Documents (सभी दस्तावेज)</option>
              <option value="Expired">Expired Docs (समाप्त दस्तावेज)</option>
              <option value="DueSoon">Due Soon Docs (जल्द समाप्त)</option>
              <option value="Compliant">Fully Compliant (पूर्ण वैध)</option>
            </select>
          </div>

          {isAdmin && (
            <button
              id="add_vehicle_btn"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Grid of Vehicles */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-12 text-center border border-dashed border-slate-250">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No vehicles found</h4>
          <p className="text-xs text-slate-500 mt-1">आपकी खोज या फ़िल्टर के अनुसार कोई गाड़ी नहीं मिली।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="vehicles_grid">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onLocate={onLocate}
              onAssignDriver={onAssignDriver}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Add New Vehicle (नई गाड़ी जोड़ें)</h3>
                <p className="text-xs text-slate-500 font-medium">Add vehicle and document details to start tracking</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 bg-white hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200/55"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddVehicle} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex gap-2 items-center font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Reg. Number (गाड़ी नंबर) *
                  </label>
                  <input
                    id="new_vehicle_reg"
                    type="text"
                    required
                    placeholder="e.g. MH-12-PQ-9874"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Model (मॉडल नाम) *
                  </label>
                  <input
                    id="new_vehicle_model"
                    type="text"
                    required
                    placeholder="e.g. Tata Signa 2823"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    id="new_vehicle_type"
                    value={type}
                    onChange={(e) => setType(e.target.value as VehicleType)}
                    className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="Truck">Truck (ट्रक)</option>
                    <option value="Bus">Bus (बस)</option>
                    <option value="Car">Car (कार)</option>
                    <option value="Van">Van (वैन)</option>
                    <option value="Auto">Auto (ऑटो)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Status *
                  </label>
                  <select
                    id="new_vehicle_status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                    className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="Active">Active (सक्रिय)</option>
                    <option value="Maintenance">Maintenance (सर्विस)</option>
                    <option value="Inactive">Inactive (बंद)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-150 pt-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Loan EMI Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      EMI Amount (मासिक किश्त)
                    </label>
                    <input
                      id="new_vehicle_emi"
                      type="number"
                      value={emiAmount}
                      onChange={(e) => setEmiAmount(Number(e.target.value))}
                      className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      EMI Due Date (भुगतान तारीख) *
                    </label>
                    <input
                      id="new_vehicle_emi_due"
                      type="date"
                      required
                      value={emiDueDate}
                      onChange={(e) => setEmiDueDate(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-150 pt-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Insurance Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Insurance Provider *
                    </label>
                    <input
                      id="new_vehicle_ins_prov"
                      type="text"
                      required
                      placeholder="e.g. ICICI Lombard"
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Insurance Expiry *
                    </label>
                    <input
                      id="new_vehicle_ins_exp"
                      type="date"
                      required
                      value={insuranceExpiry}
                      onChange={(e) => setInsuranceExpiry(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-150 pt-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Other Clearances</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Road Tax Expiry *
                    </label>
                    <input
                      id="new_vehicle_tax_exp"
                      type="date"
                      required
                      value={taxExpiry}
                      onChange={(e) => setTaxExpiry(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Fitness Expiry *
                    </label>
                    <input
                      id="new_vehicle_fit_exp"
                      type="date"
                      required
                      value={fitnessExpiry}
                      onChange={(e) => setFitnessExpiry(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="border-t border-slate-150 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit_vehicle_btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
