import { getBrand } from "@/lib/admin";
import Home from "./Home";

export default async function Page() {
  return <Home brand={await getBrand()} demo={process.env.DEMO_MODE !== "false"} />;
}
