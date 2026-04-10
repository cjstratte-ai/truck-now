import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trucks Now",
  description: "Texas-first truck rental marketplace for renters, owners, and operators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
