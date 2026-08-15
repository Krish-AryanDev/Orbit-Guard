import "./globals.css";

export const metadata = {
  title: "Orbit Guard - Space Debris Collision Avoidance System",
  description: "Space Debris Collision Avoidance System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
