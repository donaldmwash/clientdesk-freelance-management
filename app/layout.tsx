import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClientDesk — Run your freelance business",
  description: "A clear workspace for clients, invoices, expenses, and business performance."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
