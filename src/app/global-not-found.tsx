import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "404 - Page Not Found | Your Brand Name",
  description:
    "The page you are looking for does not exist. Visit our homepage and keep exploring our best products.",
};

export default function GlobalNotFound() {
  return (
    <html>
      <body>
        <main
          className={`${inter.className} min-h-screen bg-gradient-to-tr from-mint-300 via-blue-50 to-mint-100 flex flex-col items-center justify-center p-6`}
          aria-labelledby="page-title"
        >
          <section
            className="bg-white/90 shadow-xl rounded-xl max-w-md mx-auto p-10 flex flex-col items-center gap-6 border border-mint-300"
            role="alert"
            aria-live="polite"
          >
            <svg
              width={80}
              height={80}
              viewBox="0 0 64 64"
              aria-hidden="true"
              className="mb-2"
              focusable="false"
            >
              <circle cx="32" cy="32" r="30" fill="#E0F2F1" />
              <path
                d="M32 18c-2.2 0-4 1.8-4 4v10c0 2.2 1.8 4 4 4s4-1.8 4-4V22c0-2.2-1.8-4-4-4zm0 28a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
                fill="#38bdf8"
              />
            </svg>
            <h1
              id="page-title"
              className="text-4xl font-extrabold tracking-tight text-blue-900 text-center mb-2"
              tabIndex={-1}
            >
              404 - Page Not Found
            </h1>
            <p
              className="text-base text-blue-700 text-center mb-4 max-w-xs"
              aria-label="Explanation"
            >
              Oops! The page you&rsquo;re looking for doesn&rsquo;t exist or has
              been moved.
            </p>
            <Link
              href="/"
              aria-label="Go back to homepage"
              className="inline-block px-6 py-3 rounded-md bg-mint-600 text-black font-semibold text-lg shadow shadow-gray-500 transition hover:bg-mint-700 focus:outline-none focus:ring-2 focus:ring-mint-400 focus:ring-offset-2"
            >
              Back to Homepage
            </Link>
          </section>
          <footer
            className="mt-8 text-xs text-foreground select-none"
            aria-hidden="true"
          >
            &copy; {new Date().getFullYear()} zee_shop
          </footer>
        </main>
      </body>
    </html>
  );
}
