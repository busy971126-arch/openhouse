import type { ReactNode } from "react";

type FieldLabelProps = {
  children: ReactNode;
  required?: boolean;
  tone?: "orange" | "red";
  className?: string;
};

export function FieldLabel({
  children,
  required = false,
  tone = "orange",
  className = "",
}: FieldLabelProps) {
  const requiredClass = tone === "red" ? "text-red-600" : "text-orange-600";

  return (
    <span className={className}>
      {children}
      {required && <span className={requiredClass}> *</span>}
    </span>
  );
}
