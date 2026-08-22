import { createClient } from "@/lib/supabase/server";

export async function getAdminViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false, supabase };
  }

  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("is_admin rpc error:", error.message);
    return { user, isAdmin: false, supabase };
  }

  return { user, isAdmin: data === true, supabase };
}
