"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { FaEye, FaEyeSlash, FaSyncAlt } from "react-icons/fa";
import { toast } from "react-toastify";

import AuthFormWrapper from "@/components/AuthFormWrapper";
import SocialAuth from "@/components/SocialAuth";
import { createAuthCookie, LOGIN_EMAIL, LOGIN_PASSWORD } from "@/lib/auth";
import { generateCaptcha } from "@/lib/captcha";

type LoginFormData = {
  email: string;
  password: string;
  captchaInput: string;
  rememberMe: boolean;
};

type LoginErrors = {
  email?: string;
  password?: string;
  captchaInput?: string;
};

const MAX_LOGIN_ATTEMPTS = 3;
const darkToastOptions = {
  position: "top-right" as const,
  style: {
    background: "#111111",
    color: "#ffffff",
  },
};
const loginErrorToastOptions = {
  ...darkToastOptions,
  progressClassName: "toast-progress-error",
};
const loginSuccessToastOptions = {
  ...darkToastOptions,
  progressClassName: "toast-progress-success",
};
const loginResetToastOptions = {
  ...darkToastOptions,
  progressClassName: "toast-progress-success",
};

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    captchaInput: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_LOGIN_ATTEMPTS);
  const [captchaText, setCaptchaText] = useState(() => generateCaptcha());
  const [showPassword, setShowPassword] = useState(false);
  const isLoginLocked = remainingAttempts === 0;

  const validateLoginForm = () => {
    const newErrors: LoginErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email tidak boleh kosong";
    } else if (formData.email.trim().toLowerCase() !== LOGIN_EMAIL) {
      newErrors.email = `Email harus sesuai NPM kalian (${LOGIN_EMAIL}).`;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password tidak boleh kosong";
    } else if (formData.password !== LOGIN_PASSWORD) {
      newErrors.password = `Password harus sesuai NPM kalian (${LOGIN_PASSWORD}).`;
    }

    if (!formData.captchaInput.trim()) {
      newErrors.captchaInput = "Captcha belum diisi";
    } else if (formData.captchaInput !== captchaText) {
      newErrors.captchaInput = "Captcha harus sesuai dengan yang ditampilkan.";
    }

    return newErrors;
  };

  const showLoginFailedToast = (nextAttempts: number) => {
    if (nextAttempts === 0) {
      toast.error("Login Gagal! Kesempatan login habis!", loginErrorToastOptions);
      return;
    }

    toast.error(
      `Login Gagal! Sisa kesempatan login: ${nextAttempts}`,
      loginErrorToastOptions,
    );
  };

  const handleFailedLogin = (newErrors: LoginErrors) => {
    setErrors(newErrors);

    const nextAttempts = Math.max(remainingAttempts - 1, 0);
    setRemainingAttempts(nextAttempts);
    showLoginFailedToast(nextAttempts);
  };

  const refreshCaptcha = () => {
    setCaptchaText(generateCaptcha());
    setFormData((previousData) => ({
      ...previousData,
      captchaInput: "",
    }));
    setErrors((previousErrors) => ({
      ...previousErrors,
      captchaInput: undefined,
    }));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: undefined,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoginLocked) {
      toast.error("Login Gagal! Kesempatan login habis!", loginErrorToastOptions);
      return;
    }

    const newErrors = validateLoginForm();

    if (Object.keys(newErrors).length > 0) {
      handleFailedLogin(newErrors);
      return;
    }

    setErrors({});
    document.cookie = createAuthCookie();
    toast.success("Login Berhasil!", loginSuccessToastOptions);
    router.push("/home");
  };

  const handleSocialLogin = () => {
    if (isLoginLocked) {
      toast.error("Login Gagal! Kesempatan login habis!", loginErrorToastOptions);
      return;
    }

    const newErrors = validateLoginForm();

    if (Object.keys(newErrors).length > 0) {
      handleFailedLogin(newErrors);
      return;
    }

    setErrors({});
  };

  const handleResetAttempts = () => {
    if (!isLoginLocked) {
      return;
    }

    setRemainingAttempts(MAX_LOGIN_ATTEMPTS);
    toast.success("Kesempatan login berhasil direset!", loginResetToastOptions);
  };

  return (
    <AuthFormWrapper title="Login">
      <form onSubmit={handleSubmit} className="space-y-5 w-full">
        <p className="text-center text-sm text-slate-500">
          Sisa kesempatan: {remainingAttempts}
        </p>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`input-field ${errors.email ? "border-red-500" : ""}`}
            placeholder="Masukan email"
          />
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`input-field pr-12 ${errors.password ? "border-red-500" : ""}`}
              placeholder="Masukan password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((previousValue) => !previousValue)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-slate-700"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && <p className="error-message">{errors.password}</p>}
          <div className="mt-2 flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="mr-2 h-4 w-4 rounded border-gray-300"
              />
              Ingat Saya
            </label>

            <Link
              href="/auth/forgot-password"
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Captcha:</span>
            <span className="rounded bg-gray-100 px-3 py-1.5 font-mono text-lg font-bold text-gray-800">
              {captchaText}
            </span>
            <button
              type="button"
              onClick={refreshCaptcha}
              className="text-blue-600 transition hover:text-blue-800"
              aria-label="Refresh captcha"
            >
              <FaSyncAlt />
            </button>
          </div>
          <input
            type="text"
            name="captchaInput"
            value={formData.captchaInput}
            onChange={handleChange}
            className={`input-field ${errors.captchaInput ? "border-red-500" : ""}`}
            placeholder="Masukan captcha"
          />
          {errors.captchaInput && (
            <p className="error-message">{errors.captchaInput}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoginLocked}
          className={`w-full rounded-lg px-4 py-2.5 font-semibold text-white transition ${
            isLoginLocked
              ? "cursor-not-allowed bg-slate-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Sign In
        </button>

        <button
          type="button"
          disabled={!isLoginLocked}
          onClick={handleResetAttempts}
          className={`w-full rounded-lg px-4 py-2.5 font-semibold text-white transition ${
            isLoginLocked
              ? "bg-emerald-500 hover:bg-emerald-600"
              : "cursor-not-allowed bg-slate-400"
          }`}
        >
          Reset Kesempatan
        </button>

        <SocialAuth onSocialLogin={handleSocialLogin} />

        <p className="text-center text-sm text-gray-600">
          Tidak punya akun?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-blue-600 transition hover:text-blue-800"
          >
            Daftar
          </Link>
        </p>
      </form>
    </AuthFormWrapper>
  );
}
