import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />
    </Suspense>
  );
}
