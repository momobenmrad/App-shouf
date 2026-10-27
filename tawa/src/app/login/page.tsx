import { getBrand } from "@/lib/admin";
import LoginForm from "./LoginForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const role = (await searchParams).role === "driver" ? "driver" : "rider";
  return <LoginForm brand={await getBrand()} role={role} />;
}
