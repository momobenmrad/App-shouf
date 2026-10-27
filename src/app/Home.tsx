"use client";

import Link from "next/link";
import type { Brand } from "@/lib/admin";
import { useLang } from "@/components/LangProvider";
import TopBar, { Mark } from "@/components/TopBar";

const icon = {
  rider: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  driver: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 16V11l2-5h10l2 5v5" /><path d="M3 16h18v3H3z" /><circle cx="7.5" cy="13.5" r=".8" fill="currentColor" /><circle cx="16.5" cy="13.5" r=".8" fill="currentColor" /><path d="M10 6V4h4v2" /></svg>,
  admin: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
};

export default function Home({ brand, demo }: { brand: Brand; demo: boolean }) {
  const { t } = useLang();
  return (
    <>
      <TopBar brand={brand} />
      <main className="home">
        <div className="page">
          <section className="hero">
            <Mark brand={brand} big />
            <h1>{brand.nameAr}</h1>
            <p className="slogan">{brand.slogan}</p>
            <p className="sub">{t("appTagline")}</p>
          </section>
          <div className="choices">
            <Link href="/login?role=rider" className="card choice">
              <span className="icon">{icon.rider}</span>
              <h2>{t("rider")}</h2>
              <p className="muted">{t("riderSub")}</p>
            </Link>
            <Link href="/login?role=driver" className="card choice">
              <span className="icon">{icon.driver}</span>
              <h2>{t("driver")}</h2>
              <p className="muted">{t("driverSub")}</p>
            </Link>
            <Link href="/admin" className="card choice">
              <span className="icon">{icon.admin}</span>
              <h2>{t("admin")}</h2>
              <p className="muted">{t("adminSub")}</p>
            </Link>
          </div>
          <div className="cities">
            <span><b>تونس</b> Tunis</span>
            <span><b>سوسة</b> Sousse</span>
            <span><b>صفاقس</b> Sfax</span>
            <span className="num">0.900 DT · prise en charge</span>
          </div>
          {demo && <p className="demo-note">{t("demoNote")}</p>}
        </div>
      </main>
    </>
  );
}
