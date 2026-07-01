import React, { useState } from "react";
import { Driver, Vehicle } from "../types";
import { getDocumentStatus, formatDate } from "../utils/dateUtils";
import { 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Truck,
  Plus,
  AlertCircle
} from "lucide-react";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface DriverListProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export default function DriverList({ drivers, vehicles, isAdmin, onRefresh }: DriverListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // New driver form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Assign vehicle state
  const [assignVehicleId, setAssignVehicleId] = useState("");

  const filteredDrivers = drivers.filter((d) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm) ||
    d.licenseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.assignedVehicleReg && d.assignedVehicleReg.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name || !email || !phone || !licenseNo || !licenseExpiry) {
      setFormError("सभी फ़ील्ड भरना अनिवार्य है (All fields are required).");
      return;
    }

    setSubmitting(true);
    try {
      const docId = `driver_${Date.now()}`;
      const newDriver: Driver = {
        id: docId,
        name,
        email,
        phone,
        licenseNo,
        licenseExpiry,
        status: "Available",
      };

      await setDoc(doc(db, "drivers", docId), newDriver);
      
      // Also register as a user profile
      await setDoc(doc(db, "users", docId), {
        uid: docId,
        email,
        name,
        role: "driver"
      });

      setName("");
      setEmail("");
      setPhone("");
      setLicenseNo("");
      setLicenseExpiry("");
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || "Failed to add driver.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    setSubmitting(true);
    try {
      const vehicle = vehicles.find(v => v.id === assignVehicleId);
      const vehicleReg = vehicle ? vehicle.regNo : "";

      // 1. If driver had a previous vehicle, clear that vehicle's driver assignment
      if (selectedDriver.assignedVehicleId) {
        const prevVehicleRef = doc(db, "vehicles", selectedDriver.assignedVehicleId);
        await updateDoc(prevVehicleRef, {
          assignedDriverId: "",
          assignedDriverName: ""
        });
      }

      // 2. If the selected vehicle already has an assigned driver, update that driver's profile to remove the assignment
      if (assignVehicleId && vehicle && vehicle.assignedDriverId) {
        const prevDriverRef = doc(db, "drivers", vehicle.assignedDriverId);
        await updateDoc(prevDriverRef, {
          assignedVehicleId: "",
          assignedVehicleReg: ""
        });
        const prevDriverUserRef = doc(db, "users", vehicle.assignedDriverId);
        await updateDoc(prevDriverUserRef, {
          assignedVehicleId: ""
        });
      }

      // 3. Update the driver record with the new vehicle ID
      const driverRef = doc(db, "drivers", selectedDriver.id);
      await updateDoc(driverRef, {
        assignedVehicleId: assignVehicleId,
        assignedVehicleReg: vehicleReg,
        status: assignVehicleId ? "On Trip" : "Available"
      });

      // 4. Update the user profile
      const userRef = doc(db, "users", selectedDriver.id);
      await updateDoc(userRef, {
        assignedVehicleId: assignVehicleId
      });

      // 5. Update the vehicle record with the new driver ID
      if (assignVehicleId) {
        const vehicleRef = doc(db, "vehicles", assignVehicleId);
        await updateDoc(vehicleRef, {
          assignedDriverId: selectedDriver.id,
          assignedDriverName: selectedDriver.name
        });
      }

      setShowAssignModal(false);
      setSelectedDriver(null);
      setAssignVehicleId("");
      onRefresh();
    } catch (err: any) {
      alert("Failed to assign vehicle: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="drivers_tab">
      {/* Search and Action bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="driver_search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search driver name, phone, license..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-250 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>

        {isAdmin && (
          <button
            id="add_driver_btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Driver
          </button>
        )}
      </div>

      {/* Grid of drivers */}
      {filteredDrivers.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-12 text-center border border-dashed border-slate-250">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No drivers found</h4>
          <p className="text-xs text-slate-500 mt-1">आपकी खोज के अनुसार कोई गाड़ी चालक नहीं मिला।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="drivers_grid">
          {filteredDrivers.map((driver) => {
            const licenseStatus = getDocumentStatus(driver.licenseExpiry, 30);
            
            return (
              <div 
                key={driver.id} 
                id={`driver_card_${driver.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Driver Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 tracking-tight">{driver.name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 font-bold rounded-md mt-1 inline-block ${
                        driver.status === "Available" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/55" 
                          : driver.status === "On Trip" 
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/55" 
                          : "bg-slate-100 text-slate-700 border border-slate-200/55"
                      }`}>
                        {driver.status === "Available" ? "Available (खाली)" : driver.status === "On Trip" ? "On Trip (ड्यूटी)" : "Off Duty (छुट्टी)"}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <Truck className="h-5 w-5 text-slate-600" />
                    </div>
                  </div>

                  {/* Driver Details */}
                  <div className="space-y-2 mb-4 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400 font-medium" />
                      <span className="font-medium">{driver.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400 font-medium" />
                      <span className="truncate font-medium">{driver.email}</span>
                    </div>
                    
                    {/* License Expiry Status */}
                    <div className={`p-2.5 rounded-lg border flex items-center justify-between mt-3 ${licenseStatus.colorClass}`}>
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        <div>
                          <span className="font-bold block text-[11px]">DL: {driver.licenseNo}</span>
                          <span className="text-[10px] opacity-80 font-mono font-medium">Exp: {formatDate(driver.licenseExpiry)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold">
                        {licenseStatus.days < 0 ? "Expired" : `${licenseStatus.days}d left`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Vehicle */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs mt-auto">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Vehicle (गाड़ी)</span>
                    <span className="font-bold text-slate-700">
                      {driver.assignedVehicleReg || "No Vehicle Assigned"}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setAssignVehicleId(driver.assignedVehicleId || "");
                        setShowAssignModal(true);
                      }}
                      className="px-3 py-1.5 font-bold text-xs border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                    >
                      Assign Vehicle
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Add New Driver (नया चालक जोड़ें)</h3>
                <p className="text-xs text-slate-500 font-medium">Register a driver and licensing credentials</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/55 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddDriver} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex gap-2 items-center font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Driver Name (चालक का नाम) *
                </label>
                <input
                  id="new_driver_name"
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Email Address (ईमेल) *
                </label>
                <input
                  id="new_driver_email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Phone Number (मोबाइल नंबर) *
                </label>
                <input
                  id="new_driver_phone"
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    License Number *
                  </label>
                  <input
                    id="new_driver_license"
                    type="text"
                    required
                    placeholder="DL-14..."
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    License Expiry *
                  </label>
                  <input
                    id="new_driver_license_expiry"
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>
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
                  id="submit_driver_btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Add Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Vehicle Modal */}
      {showAssignModal && selectedDriver && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Assign Vehicle</h3>
                <p className="text-xs text-slate-500 font-semibold">Driver: {selectedDriver.name}</p>
              </div>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedDriver(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/55 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAssignVehicle} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Vehicle (गाड़ी का चुनाव करें)
                </label>
                <select
                  id="assign_vehicle_select"
                  value={assignVehicleId}
                  onChange={(e) => setAssignVehicleId(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm cursor-pointer"
                >
                  <option value="">No Vehicle Assigned (कोई नहीं)</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.regNo} — {v.model} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-150 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowAssignModal(false); setSelectedDriver(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit_assignment_btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
