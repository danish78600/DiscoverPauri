import { Navigate, useLocation } from "react-router-dom";

function decodeJwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length < 2) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const RequireAdmin = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("dp_token");

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const payload = decodeJwtPayload(token);
  const role = payload && typeof payload === "object" ? payload.role : null;

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAdmin;
