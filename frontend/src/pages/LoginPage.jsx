import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login, logout } from "../api/auth";

import { Lock, Mail } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";
import AuthButton from "../components/auth/AuthButton";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("dp_token"));
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [didSubmit, setDidSubmit] = useState(false);

  const trimmedEmail = useMemo(() => email.trim(), [email]);
  const emailError = didSubmit && !trimmedEmail ? "Email is required" : "";
  const passwordError = didSubmit && !password ? "Password is required" : "";

  async function onLogout() {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      if (token) {
        await logout(token);
      }

      toast.success("Logged out");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Logout failed");
    } finally {
      localStorage.removeItem("dp_token");
      setToken(null);
      setIsLoggingOut(false);
      navigate("/");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();

    setDidSubmit(true);

    if (!trimmedEmail) {
      toast.error("Please enter your email");
      return;
    }

    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login({ email: trimmedEmail, password });

      if (result?.token) {
        localStorage.setItem("dp_token", result.token);
      }

      toast.success("Logged in");
      const redirectTo = location.state?.from?.pathname || "/treks";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      token={token}
      headerRight={() =>
        token ? (
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur-xl transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoggingOut ? "Logging out…" : "Logout"}
          </button>
        ) : (
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur-xl transition hover:bg-white"
          >
            Create account
          </Link>
        )
      }
      title="Welcome back"
      subtitle="Log in to continue planning your Pauri trip."
      footer={
        <p className="text-center text-sm text-slate-600">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-500"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthField
          id="login-email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          icon={Mail}
          errorText={emailError}
          placeholder="you@example.com"
        />

        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">Password</p>
            <button
              type="button"
              disabled
              className="text-xs font-semibold text-slate-500 opacity-70"
            >
              Forgot password?
            </button>
          </div>
          <div className="mt-2">
            <AuthField
              id="login-password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              icon={Lock}
              allowReveal
              errorText={passwordError}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="pt-1">
          <AuthButton
            isLoading={isSubmitting}
            disabled={Boolean(emailError || passwordError)}
          >
            {isSubmitting ? "Logging in…" : "Log in"}
          </AuthButton>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            You’ll be redirected after login.
          </p>
        </div>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
