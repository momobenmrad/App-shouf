import { redirect } from "next/navigation";
import { getBrand } from "@/lib/admin";
import { requireUser } from "@/lib/auth";
import { activeRideFor } from "@/lib/rides";
import Driver from "./Driver";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireUser("driver");
  if (!user) redirect("/login?role=driver");
  return <Driver brand={await getBrand()} initialRideId={await activeRideFor(user.uid, "driver")} />;
}
