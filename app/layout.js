import "./globals.css";
export const metadata = { title: "KnowMe", description: "Your accountability diary" };
export const viewport = { themeColor: "#1a1033" };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
