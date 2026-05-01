import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Kru Heem Prompt Builder",
  description: "สร้าง Prompt สำหรับเจนคอนเทนต์การศึกษาในสไตล์ครูฮีม",
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    var theme = stored || (prefersLight ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header
            className="sticky top-0 z-50 border-b"
            style={{
              borderColor: "var(--color-border-subtle)",
              background: "var(--color-bg-glass)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                  style={{
                    background: "linear-gradient(135deg, var(--color-apricot-500), var(--color-apricot-600))",
                    boxShadow: "0 4px 14px var(--color-apricot-glow-strong)",
                  }}
                >
                  ฮ
                </div>
                <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                  Kru Heem
                </span>
                <span className="text-micro hidden sm:inline" style={{ color: "var(--color-text-tertiary)" }}>
                  Prompt Builder
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge" style={{ background: "rgba(34, 197, 94, 0.1)", color: "var(--color-success)" }}>
                  <span className="status-dot online" />
                  Online
                </span>
                <ThemeToggle />
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
