import { redirect } from "next/navigation";

import { getProfile, homePathForRole } from "@/lib/auth";

export default async function Home() {
  const result = await getProfile();
  if (!result) redirect("/login");
  redirect(homePathForRole(result.profile.role));
}
