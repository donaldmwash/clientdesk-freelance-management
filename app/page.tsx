import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// This route depends on the signed-in user's session and must not be prerendered.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? "/dashboard" : "/login");
}
