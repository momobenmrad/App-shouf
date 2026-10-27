"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Brand } from "@/lib/admin";
import { useLang } from "./LangProvider";

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
        <span className="logo">🚕</span>
        <span>{lang === "ar" ? brand.nameAr : brand.name}</span>
        <small>{lang === "ar" ? brand.name : brand.nameAr}</small>
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
