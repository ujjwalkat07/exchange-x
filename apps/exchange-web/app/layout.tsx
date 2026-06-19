import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import NavBar from "../components/dashboard/NavBar";
import "@/app/globals.css";
import Providers from "../store/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exchange-x",
  description: "Your Trusted Platform for Secure and Seamless Crypto Trading",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialAuthToken = cookieStore.get("accessToken")?.value ?? null;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers payload={initialAuthToken}>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
