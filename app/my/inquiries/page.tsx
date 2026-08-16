import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserInquiries } from "@/lib/queries/event-interests";
import { InquirySection } from "@/components/support/InquirySection";

export default async function MyInquiriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my/inquiries");

  const { data: inquiries } = await getUserInquiries(user.id);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/my" className="text-sm font-medium text-orange-600">
        ← 마이페이지
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900">문의하기</h1>
      <p className="text-sm text-zinc-600">
        참가 신청, 환불, 버그 제보 등 운영팀 문의를 접수할 수 있습니다.
      </p>

      <InquirySection userId={user.id} initialInquiries={inquiries ?? []} />
    </div>
  );
}
