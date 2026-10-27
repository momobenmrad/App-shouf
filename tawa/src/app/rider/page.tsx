import { redirect } from "next/navigation";
import { getBrand } from "@/lib/admin";
import { requireUser } from "@/lib/auth";
import { activeRideFor } from "@/lib/rides";
import Rider from "./Rider";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireUser("rider");
  if (!user) redirect("/login?role=rider");
  return <Rider brand={await getBrand()} name={user.name} initialRideId={await activeRideFor(user.uid, "rider")} />;
}
