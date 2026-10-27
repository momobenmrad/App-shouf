"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Brand } from "@/lib/admin";
import { useLang } from "./LangProvider";

export function Mark({ brand, big = false }: { brand: Brand; big?: boolean }) {
  return <span className={`mark${big ? " big" : ""}`} aria-hidden="true">{brand.nameAr.charAt(0)}</span>;
}

export default function TopBar({ brand, showLogout = false }: { brand: Brand; showLogout?: boolean }) {
  const { lang, setLang, t } = useLang();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <Mark brand={brand} />
        <span className="brand-name">{brand.nameAr}</span>
        <small>{brand.name}</small>
      </Link>
      <div className="actions">
        <button className="btn ghost small" onClick={() => setLang(lang === "ar" ? "fr" : "ar")}>
          {lang === "ar" ? "Français" : "العربية"}
        </button>
        {showLogout && (
          <button className="btn ghost small" onClick={logout}>
            {t("logout")}
          </button>
        )}
      </div>
    </header>
  );
}
