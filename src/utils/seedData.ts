import { doc, writeBatch, collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../firebase";
import { getDateWithOffset } from "./dateUtils";
import { Vehicle, Driver, Expense, UserProfile } from "../types";

// Standard sample vehicles
export const SAMPLE_VEHICLES = (adminId: string): Omit<Vehicle, "id">[] => [
  {
    regNo: "MH-12-RN-4859",
    model: "Tata Signa 2823.K",
    type: "Truck",
    emiAmount: 42500,
    emiDueDate: getDateWithOffset(4), // Expiring / due soon
    insuranceExpiry: getDateWithOffset(12), // Expiring soon
    insuranceProvider: "ICICI Lombard",
    taxExpiry: getDateWithOffset(150), // Valid
    fitnessExpiry: getDateWithOffset(-5), // Expired
    status: "Active",
    lat: 18.5204, // Pune center
    lng: 73.8567,
    lastUpdated: new Date().toISOString()
  },
  {
    regNo: "DL-1G-AA-4920",
    model: "Mahindra Bolero Maxi Truck",
    type: "Van",
    emiAmount: 18200,
    emiDueDate: getDateWithOffset(20), // Valid
    insuranceExpiry: getDateWithOffset(-2), // Expired
    insuranceProvider: "HDFC ERGO",
    taxExpiry: getDateWithOffset(15), // Expiring soon
    fitnessExpiry: getDateWithOffset(45), // Valid
    status: "Active",
    lat: 28.6139, // Delhi center
    lng: 77.2090,
    lastUpdated: new Date().toISOString()
  },
  {
    regNo: "KA-03-MM-7832",
    model: "Ashok Leyland Oyster Bus",
    type: "Bus",
    emiAmount: 55000,
    emiDueDate: getDateWithOffset(15), // Valid
    insuranceExpiry: getDateWithOffset(95), // Valid
    insuranceProvider: "Tata AIG",
    taxExpiry: getDateWithOffset(-12), // Expired
    fitnessExpiry: getDateWithOffset(180), // Valid
    status: "Maintenance",
    lat: 12.9716, // Bangalore center
    lng: 77.5946,
    lastUpdated: new Date().toISOString()
  },
  {
    regNo: "GJ-01-XX-9012",
    model: "Maruti Suzuki Eeco Cargo",
    type: "Van",
    emiAmount: 8500,
    emiDueDate: getDateWithOffset(8), // Valid
    insuranceExpiry: getDateWithOffset(220), // Valid
    insuranceProvider: "National Insurance",
    taxExpiry: getDateWithOffset(40), // Valid
    fitnessExpiry: getDateWithOffset(9), // Expiring soon
    status: "Active",
    lat: 23.0225, // Ahmedabad
    lng: 72.5714,
    lastUpdated: new Date().toISOString()
  }
];

// Standard sample drivers
export const SAMPLE_DRIVERS = (assignedVehicles: string[]): Omit<Driver, "id">[] => [
  {
    name: "Rajesh Kumar",
    email: "rajesh@fleet.com",
    phone: "+91 98765 43210",
    licenseNo: "DL-1420180093845",
    licenseExpiry: getDateWithOffset(350),
    status: "On Trip",
    assignedVehicleId: assignedVehicles[0] || "",
    assignedVehicleReg: "MH-12-RN-4859"
  },
  {
    name: "Suresh Yadav",
    email: "suresh@fleet.com",
    phone: "+91 99887 76655",
    licenseNo: "HR-2620150048291",
    licenseExpiry: getDateWithOffset(-15), // Expired License!
    status: "Available",
    assignedVehicleId: assignedVehicles[1] || "",
    assignedVehicleReg: "DL-1G-AA-4920"
  },
  {
    name: "Amit Sharma",
    email: "amit@fleet.com",
    phone: "+91 91234 56789",
    licenseNo: "KA-0120190028345",
    licenseExpiry: getDateWithOffset(120),
    status: "Off Duty",
    assignedVehicleId: assignedVehicles[2] || "",
    assignedVehicleReg: "KA-03-MM-7832"
  },
  {
    name: "Vikrant Patil",
    email: "vikrant@fleet.com",
    phone: "+91 88776 65544",
    licenseNo: "MH-1220200012345",
    licenseExpiry: getDateWithOffset(45), // Expiring soon
    status: "On Trip",
    assignedVehicleId: assignedVehicles[3] || "",
    assignedVehicleReg: "GJ-01-XX-9012"
  }
];

// Standard sample expenses
export const SAMPLE_EXPENSES = (vehicleIds: string[], vehicleRegs: string[], adminId: string): Omit<Expense, "id">[] => [
  {
    vehicleId: vehicleIds[0] || "v1",
    vehicleReg: vehicleRegs[0] || "MH-12-RN-4859",
    category: "Fuel",
    amount: 8500,
    date: getDateWithOffset(-2),
    description: "Diesel top-up at highway Indian Oil pump.",
    loggedBy: adminId,
    loggedByName: "Fleet Admin",
    loggedByRole: "admin"
  },
  {
    vehicleId: vehicleIds[1] || "v2",
    vehicleReg: vehicleRegs[1] || "DL-1G-AA-4920",
    category: "EMI",
    amount: 18200,
    date: getDateWithOffset(-10),
    description: "June Month EMI paid automatically.",
    loggedBy: adminId,
    loggedByName: "Fleet Admin",
    loggedByRole: "admin"
  },
  {
    vehicleId: vehicleIds[2] || "v3",
    vehicleReg: vehicleRegs[2] || "KA-03-MM-7832",
    category: "Maintenance",
    amount: 12400,
    date: getDateWithOffset(-5),
    description: "Engine oil change and brake pad service.",
    loggedBy: adminId,
    loggedByName: "Fleet Admin",
    loggedByRole: "admin"
  },
  {
    vehicleId: vehicleIds[0] || "v1",
    vehicleReg: vehicleRegs[0] || "MH-12-RN-4859",
    category: "Toll",
    amount: 1200,
    date: getDateWithOffset(-1),
    description: "FASTag recharge for NH4 journey.",
    loggedBy: adminId,
    loggedByName: "Fleet Admin",
    loggedByRole: "admin"
  },
  {
    vehicleId: vehicleIds[3] || "v4",
    vehicleReg: vehicleRegs[3] || "GJ-01-XX-9012",
    category: "Insurance",
    amount: 14500,
    date: getDateWithOffset(-25),
    description: "Annual insurance renewal paid.",
    loggedBy: adminId,
    loggedByName: "Fleet Admin",
    loggedByRole: "admin"
  }
];

/**
 * Checks if the fleet database is empty and seeds initial data if so.
 */
export async function checkAndSeedDatabase(uid: string, adminName: string): Promise<boolean> {
  try {
    const vehiclesCol = collection(db, "vehicles");
    const snapshot = await getDocs(query(vehiclesCol, limit(1)));
    
    if (!snapshot.empty) {
      console.log("Database already has vehicles. Skipping seeding.");
      return false; // Already seeded
    }
    
    console.log("Seeding initial fleet and document data...");
    const batch = writeBatch(db);
    
    // Create admin profile in users
    const userRef = doc(db, "users", uid);
    const adminProfile: UserProfile = {
      uid,
      email: "financestudio2026@gmail.com",
      name: adminName || "Fleet Admin",
      role: "admin"
    };
    batch.set(userRef, adminProfile);
    
    // Create vehicles
    const vehicleIds: string[] = [];
    const vehicleRegs: string[] = [];
    const sampleV = SAMPLE_VEHICLES(uid);
    
    sampleV.forEach((v) => {
      // Use regNo slug as document ID to avoid duplicates and have clean IDs
      const docId = v.regNo.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const ref = doc(db, "vehicles", docId);
      const vehicleData: Vehicle = {
        ...v,
        id: docId
      };
      batch.set(ref, vehicleData);
      vehicleIds.push(docId);
      vehicleRegs.push(v.regNo);
    });
    
    // Create drivers
    const sampleD = SAMPLE_DRIVERS(vehicleIds);
    sampleD.forEach((d, index) => {
      // Create a specific id for the driver
      const docId = `driver_${index + 1}`;
      const ref = doc(db, "drivers", docId);
      
      const driverData: Driver = {
        ...d,
        id: docId,
        assignedVehicleId: vehicleIds[index] || ""
      };
      batch.set(ref, driverData);
      
      // Update vehicle with assigned driver details
      const vehicleRef = doc(db, "vehicles", vehicleIds[index]);
      batch.update(vehicleRef, {
        assignedDriverId: docId,
        assignedDriverName: d.name
      });

      // Also register driver in users collection with default credentials
      const driverUserRef = doc(db, "users", docId);
      const driverProfile: UserProfile = {
        uid: docId,
        email: d.email,
        name: d.name,
        role: "driver",
        assignedVehicleId: vehicleIds[index] || ""
      };
      batch.set(driverUserRef, driverProfile);
    });
    
    // Create expenses
    const sampleE = SAMPLE_EXPENSES(vehicleIds, vehicleRegs, uid);
    sampleE.forEach((e, index) => {
      const docId = `expense_${index + 1}`;
      const ref = doc(db, "expenses", docId);
      const expenseData: Expense = {
        ...e,
        id: docId
      };
      batch.set(ref, expenseData);
    });
    
    await batch.commit();
    console.log("Initial seed successful!");
    return true;
  } catch (error) {
    console.error("Failed to seed database:", error);
    return false;
  }
}
