import type { ReactNode } from "react";

type AuthFormWrapperProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function AuthFormWrapper({
  title,
  description,
  children,
}: AuthFormWrapperProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
