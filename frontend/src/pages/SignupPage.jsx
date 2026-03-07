import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout, signup } from "../api/auth";

import { Lock, Mail, User } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";
import AuthButton from "../components/auth/AuthButton";

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("dp_token"));
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [didSubmit, setDidSubmit] = useState(false);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const trimmedEmail = useMemo(() => email.trim(), [email]);

  const nameError = didSubmit && !trimmedName ? "Name is required" : "";
  const emailError = didSubmit && !trimmedEmail ? "Email is required" : "";
  const passwordError =
    didSubmit && (!password || password.length < 8)
      ? "Password must be at least 8 characters"
      : "";

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

    if (!trimmedName) {
      toast.error("Please enter your name");
      return;
    }

    if (!trimmedEmail) {
      toast.error("Please enter your email");
      return;
    }

    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await signup({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      if (result?.token) {
        localStorage.setItem("dp_token", result.token);
      }

      toast.success("Account created");
      const redirectTo = location.state?.from?.pathname || "/treks";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
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
            to="/login"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur-xl transition hover:bg-white"
          >
            Log in
          </Link>
        )
      }
      title="Create your account"
      subtitle="Sign up to save plans and come back anytime."
      footer={
        <p className="text-center text-xs leading-relaxed text-slate-500">
          By continuing, you agree to a simple, respectful travel experience.
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthField
          id="signup-name"
          type="text"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
          icon={User}
          errorText={nameError}
          placeholder="Your name"
        />

        <AuthField
          id="signup-email"
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

        <AuthField
          id="signup-password"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          icon={Lock}
          allowReveal
          errorText={passwordError}
          helperText="Use at least 8 characters."
          placeholder="Create a password"
        />

        <div className="pt-1">
          <AuthButton
            isLoading={isSubmitting}
            disabled={Boolean(nameError || emailError || passwordError)}
          >
            {isSubmitting ? "Creating…" : "Create account"}
          </AuthButton>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            You’ll be redirected after signup.
          </p>
        </div>

        <p className="pt-2 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-500"
          >
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default SignupPage;
