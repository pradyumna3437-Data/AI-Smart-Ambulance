import React, { useState } from "react";
import { useEmergency } from "../../context/EmergencyContext";
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Shield,
  Truck,
  HeartPulse,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function AuthModal({ isOpen, onClose }) {
  const { loginUser, registerUser, currentUser, logoutUser } = useEmergency();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER"); // USER | DRIVER | ADMIN

  if (!isOpen) return null;

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await loginUser(email, password);
      setSuccess("Successfully signed in!");
      setTimeout(() => {
        onClose();
        resetMessages();
      }, 700);
    } catch (err) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!name.trim()) {
      setError("Please provide your full name");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name,
        email,
        phone: phone || null,
        password,
        role,
      });
      setSuccess("Account created successfully! Signing you in...");
      setTimeout(() => {
        onClose();
        resetMessages();
      }, 900);
    } catch (err) {
      setError(err.message || "Registration failed. Email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (demoRole) => {
    resetMessages();
    if (demoRole === "USER") {
      setEmail("citizen@example.com");
      setPassword("testpass123");
    } else if (demoRole === "DRIVER") {
      setEmail("driver1@example.com");
      setPassword("testpass123");
    } else if (demoRole === "ADMIN") {
      setEmail("admin@example.com");
      setPassword("testpass123");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 10, 20, 0.85)",
        backdropFilter: "blur(10px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "fade-in 0.25s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(11, 15, 25, 0.98))",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: "18px",
          padding: "2rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)",
          position: "relative",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "rgba(255, 255, 255, 0.08)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#94a3b8";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          }}
          title="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0284c7, #06b6d4)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.75rem",
              boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)",
            }}
          >
            <Shield size={26} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 0.3rem 0" }}>
            {mode === "login" ? "Sign In to AI Ambulance" : "Create New Account"}
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: 0 }}>
            {mode === "login"
              ? "Access your dispatch console, live tracking, and account"
              : "Register as a Citizen, Ambulance Driver, or Dispatcher"}
          </p>
        </div>

        {/* Mode Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "rgba(15, 23, 42, 0.6)",
            padding: "4px",
            borderRadius: "12px",
            marginBottom: "1.25rem",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("login");
              resetMessages();
            }}
            style={{
              padding: "0.55rem",
              border: "none",
              borderRadius: "9px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              background: mode === "login" ? "linear-gradient(135deg, #0284c7, #0369a1)" : "transparent",
              color: mode === "login" ? "#ffffff" : "#94a3b8",
              boxShadow: mode === "login" ? "0 2px 8px rgba(2, 132, 199, 0.4)" : "none",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              resetMessages();
            }}
            style={{
              padding: "0.55rem",
              border: "none",
              borderRadius: "9px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              background: mode === "register" ? "linear-gradient(135deg, #0284c7, #0369a1)" : "transparent",
              color: mode === "register" ? "#ffffff" : "#94a3b8",
              boxShadow: mode === "register" ? "0 2px 8px rgba(2, 132, 199, 0.4)" : "none",
            }}
          >
            New Account (Register)
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              padding: "0.65rem 0.85rem",
              borderRadius: "10px",
              fontSize: "0.8rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#6ee7b7",
              padding: "0.65rem 0.85rem",
              borderRadius: "10px",
              fontSize: "0.8rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Forms */}
        {mode === "login" ? (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <div>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  color="#64748b"
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: "36px" }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  color="#64748b"
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="form-input"
                  style={{ paddingLeft: "36px", paddingRight: "36px" }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "0.75rem",
                marginTop: "0.5rem",
                fontSize: "0.88rem",
                fontWeight: 600,
                justifyContent: "center",
                borderRadius: "10px",
              }}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>

            {/* Quick Demo Fill Buttons */}
            <div style={{ marginTop: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "0.75rem" }}>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.4rem", textAlign: "center" }}>
                QUICK DEMO ACCOUNTS (1-CLICK FILL):
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill("USER")}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "0.35rem", fontSize: "0.7rem", justifyContent: "center" }}
                >
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill("DRIVER")}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "0.35rem", fontSize: "0.7rem", justifyContent: "center" }}
                >
                  Driver
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill("ADMIN")}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "0.35rem", fontSize: "0.7rem", justifyContent: "center" }}
                >
                  Admin
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                FULL NAME
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={16}
                  color="#64748b"
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: "36px" }}
                  placeholder="Rahul Mohanty"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  color="#64748b"
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: "36px" }}
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                  PHONE NUMBER
                </label>
                <div style={{ position: "relative" }}>
                  <Phone
                    size={15}
                    color="#64748b"
                    style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type="tel"
                    className="form-input"
                    style={{ paddingLeft: "32px", fontSize: "0.8rem" }}
                    placeholder="+91 94370 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                  PASSWORD
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={15}
                    color="#64748b"
                    style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type="password"
                    required
                    className="form-input"
                    style={{ paddingLeft: "32px", fontSize: "0.8rem" }}
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                SELECT ACCOUNT ROLE
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => setRole("USER")}
                  style={{
                    padding: "0.5rem 0.3rem",
                    borderRadius: "10px",
                    border: role === "USER" ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
                    background: role === "USER" ? "rgba(56, 189, 248, 0.15)" : "rgba(15, 23, 42, 0.5)",
                    color: role === "USER" ? "#38bdf8" : "#94a3b8",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  <HeartPulse size={16} />
                  <span>Citizen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("DRIVER")}
                  style={{
                    padding: "0.5rem 0.3rem",
                    borderRadius: "10px",
                    border: role === "DRIVER" ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.1)",
                    background: role === "DRIVER" ? "rgba(16, 185, 129, 0.15)" : "rgba(15, 23, 42, 0.5)",
                    color: role === "DRIVER" ? "#10b981" : "#94a3b8",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  <Truck size={16} />
                  <span>Driver</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("ADMIN")}
                  style={{
                    padding: "0.5rem 0.3rem",
                    borderRadius: "10px",
                    border: role === "ADMIN" ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)",
                    background: role === "ADMIN" ? "rgba(245, 158, 11, 0.15)" : "rgba(15, 23, 42, 0.5)",
                    color: role === "ADMIN" ? "#f59e0b" : "#94a3b8",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  <Shield size={16} />
                  <span>Dispatcher</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "0.75rem",
                marginTop: "0.4rem",
                fontSize: "0.88rem",
                fontWeight: 600,
                justifyContent: "center",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                borderColor: "#10b981",
              }}
            >
              {loading ? "Creating Account..." : "Create Account & Sign In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
