import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agnos Patient Intake",
  description: "Responsive patient intake with a realtime staff dashboard"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
