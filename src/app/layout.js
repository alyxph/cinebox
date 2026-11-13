import "./globals.css";

export const metadata = {
  title: "CineBox - Nonton Film & Serial Gratis",
  description: "Streaming film dan serial subtitle Indonesia terlengkap dan gratis dengan kualitas jernih.",
  keywords: ["streaming film", "nonton movie", "cinebox", "serial sub indo", "bioskop gratis"],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#090a0f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#090a0f] text-white selection:bg-[#e50914] selection:text-white">
        {children}
      </body>
    </html>
  );
}
