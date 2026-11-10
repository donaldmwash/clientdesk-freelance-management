import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

// This authenticated route depends on request cookies and must not be prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <DashboardClient userEmail={user.email ?? ""} />;
}
