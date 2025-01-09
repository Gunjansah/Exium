import { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Inter } from "next/font/google"
import ClientProvider from '@/components/ClientProvider'
import QueryProvider from '@/providers/query-provider'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Exium - Secure Code Examination Platform",
  description: "A secure platform for conducting programming assessments",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geist.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientProvider>
            <QueryProvider>{children}</QueryProvider>
          </ClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
