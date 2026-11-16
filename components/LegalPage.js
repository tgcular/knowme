import Link from "next/link";
// CHANGE THIS to your real email before publishing.
export const CONTACT_EMAIL = "cular.tyronepro@gmail.com";
export default function LegalPage({ title, children }) {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6 leading-relaxed text-white/80">
      <Link href="/login" className="text-sm text-blush">Back to KnowMe</Link>
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      <p className="text-sm text-white/50">Last updated: November 16, 2026</p>
      {children}
    </main>
  );
}
