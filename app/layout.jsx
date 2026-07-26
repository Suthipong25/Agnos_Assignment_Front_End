import "./globals.css";

export const metadata = {
  title: "Agnos Patient Intake",
  description: "Responsive patient intake with a realtime staff dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
