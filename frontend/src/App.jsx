import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/LandingPage";
import BrowseTreksPage from "./pages/BrowseTreksPage";
import TrekDetailsPage from "./pages/TrekDetailsPage";
import BrowseDestinationsPage from "./pages/BrowseDestinationsPage";
import DestinationDetailsPage from "./pages/DestinationDetailsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import AdminPage from "./pages/AdminPage";
import AdminDestinationFormPage from "./pages/AdminDestinationFormPage";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/treks"
          element={
            <RequireAuth>
              <BrowseTreksPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trek/:slug"
          element={
            <RequireAuth>
              <TrekDetailsPage />
            </RequireAuth>
          }
        />
        <Route path="/destinations" element={<BrowseDestinationsPage />} />
        <Route path="/destination/:slug" element={<DestinationDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/destinations/new"
          element={
            <RequireAdmin>
              <AdminDestinationFormPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/destinations/:slug/edit"
          element={
            <RequireAdmin>
              <AdminDestinationFormPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
