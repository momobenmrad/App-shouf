import { getBrand } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import Admin from "./Admin";
import AdminLogin from "./AdminLogin";

export const dynamic = "force-dynamic";

export default async function Page() {
  const brand = await getBrand();
  if (!(await requireAdmin())) return <AdminLogin brand={brand} />;
  return <Admin brand={brand} />;
}
