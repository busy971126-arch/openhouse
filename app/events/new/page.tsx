import { Suspense } from "react";
import { NewEventPageContent } from "./NewEventPageContent";

export default function NewEventPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-zinc-600">불러오는 중...</p>}
    >
      <NewEventPageContent />
    </Suspense>
  );
}
