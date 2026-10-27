"use client";

import Link from "next/link";
import type { Brand } from "@/lib/admin";
import { useLang } from "@/components/LangProvider";
import TopBar from "@/components/TopBar";

export default function Home({ brand, demo }: { brand: Brand; demo: boolean }) {
  const { lang, t } = useLang();
  return (
    <>
      <TopBar brand={brand} />
      <main className="page">
        <section className="hero">
          <div className="logo-big">🚕</div>
          <h1>{lang === "ar" ? brand.nameAr : brand.name}</h1>
          <p className="muted">{brand.slogan} · {t("appTagline")}</p>
        </section>
        <div className="choices">
          <Link href="/login?role=rider" className="card choice">
            <div className="icon">🙋</div>
            <h2>{t("rider")}</h2>
            <p className="muted">{t("riderSub")}</p>
          </Link>
          <Link href="/login?role=driver" className="card choice">
            <div className="icon">🚕</div>
            <h2>{t("driver")}</h2>
            <p className="muted">{t("driverSub")}</p>
          </Link>
          <Link href="/admin" className="card choice">
            <div className="icon">📊</div>
            <h2>{t("admin")}</h2>
            <p className="muted">{t("adminSub")}</p>
          </Link>
        </div>
        {demo && <p className="demo-note muted">ℹ️ {t("demoNote")}</p>}
      </main>
    </>
  );
}
