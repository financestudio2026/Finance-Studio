export type VehicleType = "Truck" | "Bus" | "Car" | "Van" | "Auto";
export type VehicleStatus = "Active" | "Maintenance" | "Inactive";
export type DriverStatus = "Available" | "On Trip" | "Off Duty";
export type ExpenseCategory = "EMI" | "Insurance" | "Tax" | "Fitness" | "Fuel" | "Maintenance" | "Toll" | "Fine" | "Other";
export type UserRole = "admin" | "driver";

export interface Vehicle {
  id: string;
  regNo: string;
  model: string;
  type: VehicleType;
  emiAmount: number;
  emiDueDate: string; // YYYY-MM-DD
  insuranceExpiry: string; // YYYY-MM-DD
  insuranceProvider: string;
  taxExpiry: string; // YYYY-MM-DD
  fitnessExpiry: string; // YYYY-MM-DD
  assignedDriverId?: string;
  assignedDriverName?: string;
  status: VehicleStatus;
  lat: number;
  lng: number;
  lastUpdated: string;
}

export interface Driver {
  id: string; // matches User uid
  name: string;
  email: string;
  phone: string;
  licenseNo: string;
  licenseExpiry: string; // YYYY-MM-DD
  assignedVehicleId?: string;
  assignedVehicleReg?: string;
  status: DriverStatus;
}

export interface Expense {
  id: string;
  vehicleId: string;
  vehicleReg: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  loggedBy: string; // user uid
  loggedByName: string;
  loggedByRole: UserRole;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  assignedVehicleId?: string;
}
