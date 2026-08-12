type AlertProps = {
  message: string;
  variant?: "error" | "success";
};

function toAlertText(message: string): string {
  const trimmed = message.trim();
  if (!trimmed || trimmed === "{}" || trimmed === "[object Object]") {
    return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
  return trimmed;
}

export function Alert({ message, variant = "error" }: AlertProps) {
  const styles =
    variant === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {toAlertText(message)}
    </div>
  );
}
