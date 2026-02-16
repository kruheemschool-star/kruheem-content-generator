import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kru Heem Prompt Builder",
  description: "สร้าง Prompt สำหรับเจนคอนเทนต์การศึกษาในสไตล์ครูฮีม",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header
            className="sticky top-0 z-50 border-b"
            style={{
              borderColor: "var(--color-border-subtle)",
              background: "rgba(9, 9, 11, 0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                  style={{ background: "var(--color-violet-500)" }}
                >
                  ฮ
                </div>
                <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                  Kru Heem
                </span>
                <span className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>
                  Prompt Builder
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge" style={{ background: "rgba(34, 197, 94, 0.1)", color: "var(--color-success)" }}>
                  <span className="status-dot online" />
                  Online
                </span>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="py-4" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
            <p className="text-center text-micro" style={{ color: "var(--color-text-tertiary)" }}>
              Built for ครูฮีม · Powered by Gemini
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
