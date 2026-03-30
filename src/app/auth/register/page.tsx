"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { FaEye, FaEyeSlash, FaSyncAlt } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import AuthFormWrapper from "@/components/AuthFormWrapper";
import SocialAuth from "@/components/SocialAuth";
import { generateCaptcha } from "@/lib/captcha";

type RegisterFormData = {
  username: string;
  email: string;
  nomorTelp: string;
  password: string;
  confirmPassword: string;
  captcha: string;
};

const registerSuccessToastOptions = {
  position: "top-right" as const,
  progressClassName: "toast-progress-success",
  style: {
    background: "#111111",
    color: "#ffffff",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [captchaText, setCaptchaText] = useState(() => generateCaptcha());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: "",
      email: "",
      nomorTelp: "",
      password: "",
      confirmPassword: "",
      captcha: "",
    },
  });
  const passwordStrength = Math.min(
    (passwordValue.length > 7 ? 25 : 0) +
      (/[A-Z]/.test(passwordValue) ? 25 : 0) +
      (/[0-9]/.test(passwordValue) ? 25 : 0) +
      (/[^A-Za-z0-9]/.test(passwordValue) ? 25 : 0),
    100,
  );

  const emailField = register("email", {
    required: "Email wajib diisi.",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.(com|net|co)$/i,
      message: "Email harus memiliki format email yang valid (.com/.net/.co).",
    },
  });

  const nomorTelpField = register("nomorTelp", {
    required: "Nomor telepon wajib diisi.",
    minLength: {
      value: 10,
      message: "Nomor telepon minimal 10 karakter.",
    },
    pattern: {
      value: /^[0-9]+$/,
      message: "Nomor telepon hanya boleh angka.",
    },
  });
  const passwordField = register("password", {
    required: "Password wajib diisi.",
    minLength: {
      value: 8,
      message: "Password minimal 8 karakter.",
    },
    onChange: (event) => {
      setPasswordValue(event.target.value);
    },
  });

  const refreshCaptcha = () => {
    setCaptchaText(generateCaptcha());
    setValue("captcha", "");
    clearErrors("captcha");
  };

  const getStrengthBarClassName = () => {
    if (passwordStrength >= 75) {
      return "bg-emerald-500";
    }

    if (passwordStrength >= 50) {
      return "bg-amber-500";
    }

    if (passwordStrength > 0) {
      return "bg-red-400";
    }

    return "bg-slate-200";
  };

  const onSubmit = () => {
    toast.success("Register Berhasil!", registerSuccessToastOptions);
    reset();
    setPasswordValue("");
    setCaptchaText(generateCaptcha());
    router.push("/auth/login");
  };

  return (
    <AuthFormWrapper
      title="Register"
      description="Lengkapi form berikut untuk membuat akun baru."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="text-sm font-medium text-slate-700"
          >
            Username <span className="text-slate-500">(max 8 karakter)</span>
          </label>
          <input
            id="username"
            {...register("username", {
              required: "Username wajib diisi.",
              minLength: {
                value: 3,
                message: "Username minimal 3 karakter.",
              },
              maxLength: {
                value: 8,
                message: "Username maksimal 8 karakter.",
              },
            })}
            className="input-field"
            placeholder="Masukkan username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {errors.username && (
            <p className="error-message">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...emailField}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              emailField.onChange(event);
            }}
            className="input-field"
            placeholder="Masukkan email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {errors.email && <p className="error-message">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="nomorTelp"
            className="text-sm font-medium text-slate-700"
          >
            Nomor Telepon
          </label>
          <input
            id="nomorTelp"
            type="tel"
            {...nomorTelpField}
            onChange={(event) => {
              event.target.value = event.target.value.replace(/\D/g, "");
              nomorTelpField.onChange(event);
            }}
            className="input-field"
            placeholder="Masukkan nomor telepon"
            autoCorrect="off"
            spellCheck={false}
          />
          {errors.nomorTelp && (
            <p className="error-message">{errors.nomorTelp.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...passwordField}
              className="input-field pr-12"
              placeholder="Masukkan password"
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
          {errors.password && (
            <p className="error-message">{errors.password.message}</p>
          )}
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${getStrengthBarClassName()}`}
                style={{ width: `${passwordStrength}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">Strength: {passwordStrength}%</p>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-700"
          >
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword", {
                required: "Konfirmasi password wajib diisi.",
                validate: (value) =>
                  value === getValues("password") ||
                  "Konfirmasi password harus sama dengan password.",
              })}
              className="input-field pr-12"
              placeholder="Masukkan konfirmasi password"
            />
            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((previousValue) => !previousValue)
              }
              className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-slate-700"
              aria-label={
                showConfirmPassword
                  ? "Sembunyikan konfirmasi password"
                  : "Tampilkan konfirmasi password"
              }
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="error-message">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Captcha:</span>
            <span className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-base font-bold text-slate-900">
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
            {...register("captcha", {
              required: "Captcha wajib diisi.",
              validate: (value) =>
                value === captchaText || "Captcha harus sesuai dengan yang ditampilkan.",
            })}
            className="input-field"
            placeholder="Masukkan captcha"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {errors.captcha && (
            <p className="error-message">{errors.captcha.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Register
        </button>

        <SocialAuth />

        <p className="text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-blue-600 transition hover:text-blue-800"
          >
            Login
          </Link>
        </p>
      </form>
    </AuthFormWrapper>
  );
}
