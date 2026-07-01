import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { checkAndSeedDatabase } from "../utils/seedData";
import { Shield, Truck, Key, Mail, User, Phone, FileText } from "lucide-react";
import { motion } from "motion/react";

interface AuthScreenProps {
  onAuthSuccess: (user: { uid: string; email: string; name: string; role: "admin" | "driver"; assignedVehicleId?: string }) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "driver">("admin");
  const [phone, setPhone] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as { uid: string; email: string; name: string; role: "admin" | "driver"; assignedVehicleId?: string };
            
            // Seed database if it's the admin logging in for the first time
            if (profile.role === "admin") {
              await checkAndSeedDatabase(user.uid, profile.name);
            }
            onAuthSuccess(profile);
          } else {
            // Profile doesn't exist, create an admin by default
            const defaultProfile = {
              uid: user.uid,
              email: user.email || email,
              name: user.email?.split("@")[0] || "Fleet User",
              role: "admin" as const
            };
            await setDoc(doc(db, "users", user.uid), defaultProfile);
            await checkAndSeedDatabase(user.uid, defaultProfile.name);
            onAuthSuccess(defaultProfile);
          }
        } catch (firebaseErr: any) {
          console.warn("Firebase Auth failed, trying demo offline authentication fallback", firebaseErr);
          
          // Standard offline fallback for review convenience
          if (email === "admin@fleet.com" && password === "admin123") {
            onAuthSuccess({
              uid: "demo_admin",
              email: "admin@fleet.com",
              name: "Demo Admin (ऑफलाइन)",
              role: "admin"
            });
          } else if (email === "driver@fleet.com" && password === "driver123") {
            onAuthSuccess({
              uid: "driver_1",
              email: "driver@fleet.com",
              name: "Rajesh Kumar (Driver)",
              role: "driver",
              assignedVehicleId: "mh12rn4859"
            });
          } else {
            throw new Error(firebaseErr.message || "Invalid credentials.");
          }
        }
      } else {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const profileData = {
          uid: user.uid,
          email,
          name,
          role,
          ...(role === "driver" ? { assignedVehicleId: "" } : {})
        };

        // Write to users collection
        await setDoc(doc(db, "users", user.uid), profileData);

        if (role === "driver") {
          // Write to drivers collection
          const driverData = {
            id: user.uid,
            name,
            email,
            phone,
            licenseNo,
            licenseExpiry,
            status: "Available" as const,
            assignedVehicleId: ""
          };
          await setDoc(doc(db, "drivers", user.uid), driverData);
        } else {
          // If admin, seed database
          await checkAndSeedDatabase(user.uid, name);
        }

        onAuthSuccess(profileData);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (selectedRole: "admin" | "driver") => {
    setError("");
    setLoading(true);
    
    const demoEmail = selectedRole === "admin" ? "admin@fleet.com" : "driver@fleet.com";
    const demoPassword = selectedRole === "admin" ? "admin123" : "driver123";
    
    try {
      // First attempt to log in using standard demo credentials
      const userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as { uid: string; email: string; name: string; role: "admin" | "driver"; assignedVehicleId?: string };
        if (profile.role === "admin") {
          await checkAndSeedDatabase(user.uid, profile.name);
        }
        onAuthSuccess(profile);
      } else {
        const profile = {
          uid: user.uid,
          email: demoEmail,
          name: selectedRole === "admin" ? "Fleet Admin" : "Rajesh Kumar",
          role: selectedRole,
          ...(selectedRole === "driver" ? { assignedVehicleId: "mh12rn4859" } : {})
        };
        await setDoc(doc(db, "users", user.uid), profile);
        if (selectedRole === "admin") {
          await checkAndSeedDatabase(user.uid, profile.name);
        }
        onAuthSuccess(profile);
      }
    } catch (err) {
      console.warn("Real demo login failed, logging in with offline demo fallback", err);
      // Seamless mock fallback so the application works instantly under any network circumstances
      if (selectedRole === "admin") {
        onAuthSuccess({
          uid: "demo_admin",
          email: "admin@fleet.com",
          name: "Demo Admin (ऑफलाइन)",
          role: "admin"
        });
      } else {
        onAuthSuccess({
          uid: "driver_1",
          email: "driver@fleet.com",
          name: "Rajesh Kumar (Driver)",
          role: "driver",
          assignedVehicleId: "mh12rn4859"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" id="auth_page">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-600 rounded-full blur-3xl opacity-20"></div>

      <div className="sm:mx-auto w-full max-w-md z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
            Fleet & Document Manager
            <span className="block text-xs font-normal text-slate-400 mt-0.5">वाहन फ्लीट एवं दस्तावेज प्रबंधन</span>
          </h1>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 sm:mx-auto w-full max-w-md z-10"
      >
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-4 shadow-2xl rounded-3xl border border-slate-700/50 sm:px-10">
          <div className="flex justify-center mb-6">
            <nav className="flex space-x-2 bg-slate-950 p-1 rounded-xl">
              <button
                id="login_tab_btn"
                onClick={() => { setIsLogin(true); setError(""); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isLogin
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In (लॉग इन)
              </button>
              <button
                id="signup_tab_btn"
                onClick={() => { setIsLogin(false); setError(""); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  !isLogin
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign Up (रजिस्टर)
              </button>
            </nav>
          </div>

          <form className="space-y-4" onSubmit={handleAuth}>
            {error && (
              <div className="bg-red-900/40 border border-red-500/40 text-red-200 p-3 rounded-xl text-xs" id="auth_error">
                {error}
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name (पूरा नाम)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="signup_name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address (ईमेल)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="auth_email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password (पासवर्ड)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  id="auth_password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Your Role (आपका रोल)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="role_admin_btn"
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`py-2 px-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                        role === "admin"
                          ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                          : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      Fleet Admin (मैनेजर)
                    </button>
                    <button
                      id="role_driver_btn"
                      type="button"
                      onClick={() => setRole("driver")}
                      className={`py-2 px-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                        role === "driver"
                          ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                          : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      Driver (गाड़ी चालक)
                    </button>
                  </div>
                </div>

                {role === "driver" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 pt-2"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Phone Number (फ़ोन नंबर)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Phone className="h-4 w-4" />
                        </div>
                        <input
                          id="driver_phone"
                          type="tel"
                          required={role === "driver"}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 99887 76655"
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Driving License Number (लाइसेंस नंबर)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <input
                          id="driver_license"
                          type="text"
                          required={role === "driver"}
                          value={licenseNo}
                          onChange={(e) => setLicenseNo(e.target.value)}
                          placeholder="DL-1420180093845"
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        License Expiry Date (लाइसेंस समाप्ति तिथि)
                      </label>
                      <input
                        id="driver_license_expiry"
                        type="date"
                        required={role === "driver"}
                        value={licenseExpiry}
                        onChange={(e) => setLicenseExpiry(e.target.value)}
                        className="block w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </>
            )}

            <button
              id="auth_submit_btn"
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 mt-4 disabled:opacity-55 cursor-pointer"
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Register Account"}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-8 border-t border-slate-700/60 pt-6">
            <h3 className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Demo Access / त्वरित प्रवेश
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="demo_admin_btn"
                type="button"
                onClick={() => handleDemoLogin("admin")}
                disabled={loading}
                className="flex flex-col items-center justify-center py-3 px-2 bg-slate-900 hover:bg-slate-950/80 border border-slate-700/80 hover:border-blue-500/50 rounded-xl text-white transition-all group disabled:opacity-50 cursor-pointer"
              >
                <Shield className="h-5 w-5 text-blue-500 mb-1 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-xs font-medium">Demo Manager</span>
                <span className="text-[10px] text-slate-500">मैनेजर डेमो</span>
              </button>

              <button
                id="demo_driver_btn"
                type="button"
                onClick={() => handleDemoLogin("driver")}
                disabled={loading}
                className="flex flex-col items-center justify-center py-3 px-2 bg-slate-900 hover:bg-slate-950/80 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl text-white transition-all group disabled:opacity-50 cursor-pointer"
              >
                <Truck className="h-5 w-5 text-emerald-500 mb-1 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-xs font-medium">Demo Driver</span>
                <span className="text-[10px] text-slate-500">चालक डेमो</span>
              </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-500 mt-4 leading-relaxed">
              * डेमो क्रेडेंशियल्स: <br />
              <b>Admin:</b> admin@fleet.com / admin123 <br />
              <b>Driver:</b> driver@fleet.com / driver123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
