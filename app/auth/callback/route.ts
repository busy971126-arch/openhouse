import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNext(searchParams.get("next"));
  const reauth = searchParams.get("reauth");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (reauth === "withdraw") {
        const cookieStore = await cookies();
        const expectedUserId = cookieStore.get(
          "oh_withdraw_reauth_expected",
        )?.value;
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (expectedUserId && user?.id === expectedUserId) {
          const response = NextResponse.redirect(
            `${origin}/my/withdraw?reauth=verified`,
          );
          response.cookies.set("oh_withdraw_reauth_verified", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 5 * 60,
          });
          response.cookies.delete("oh_withdraw_reauth_expected");
          return response;
        }

        await supabase.auth.signOut();
        const response = NextResponse.redirect(
          `${origin}/login?error=reauth&redirect=${encodeURIComponent("/my/withdraw")}`,
        );
        response.cookies.delete("oh_withdraw_reauth_expected");
        response.cookies.delete("oh_withdraw_reauth_verified");
        return response;
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
