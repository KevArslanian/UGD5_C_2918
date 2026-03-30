"use client";

import { FaCheckCircle, FaFacebookF, FaGithub, FaGoogle } from "react-icons/fa";
import { toast } from "react-toastify";

type SocialAuthProps = {
  onSocialLogin?: (provider: string) => void;
};

const providers = [
  {
    name: "Google",
    icon: <FaGoogle className="text-lg text-red-500" />,
  },
  {
    name: "GitHub",
    icon: <FaGithub className="text-lg text-slate-800" />,
  },
  {
    name: "Facebook",
    icon: <FaFacebookF className="text-lg text-blue-600" />,
  },
];

export default function SocialAuth({ onSocialLogin }: SocialAuthProps) {
  const handleSocialLogin = (provider: string) => {
    toast.success(`${provider} Login Berhasil!`, {
      position: "top-right",
      icon: <FaCheckCircle className="text-green-500" />,
      progressClassName: "toast-progress-success",
      style: {
        background: "#111111",
        color: "#ffffff",
      },
    });

    onSocialLogin?.(provider);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Atau masuk dengan</span>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {providers.map((provider) => (
          <button
            key={provider.name}
            type="button"
            onClick={() => handleSocialLogin(provider.name)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
            aria-label={`Masuk dengan ${provider.name}`}
          >
            {provider.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
