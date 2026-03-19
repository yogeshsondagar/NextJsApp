import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import StoreProvider from '@/store/StoreProvider';
import Header from "../components/Header";
import AuthProvider from "../components/AuthProvider";
import ApolloWrapper from "../components/ApolloWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Internship Management System',
  description: '',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <StoreProvider>
            <ApolloWrapper>
            <Header />
            {children}
            </ApolloWrapper>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
