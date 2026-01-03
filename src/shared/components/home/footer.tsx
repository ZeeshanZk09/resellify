import ThemeSwitch from "../theme-switch";
import Link from "next/link";
import { ChevronRight, Heart, ShoppingBag } from "lucide-react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-linear-to-b from-card to-card/95 text-foreground border-t border-border/50">
      <div className="max-w-7xl mx-auto px-5 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">GO Shop</h2>
                <p className="text-sm text-muted-foreground">
                  Premium shopping experience
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed">
              Your one-stop destination for quality products. We deliver
              happiness right to your doorstep.
            </p>

            {/* Newsletter Subscription */}
            <div className="mt-2">
              <h3 className="text-sm font-semibold mb-2">Stay Updated</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-primary">
              Shop
            </h3>
            <nav className="flex flex-col gap-3">
              <Link
                href="/shop"
                className="text-sm hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                All Products
              </Link>
              <Link
                href="/shop/new"
                className="text-sm hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                New Arrivals
              </Link>
              <Link
                href="/shop/bestsellers"
                className="text-sm hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                Best Sellers
              </Link>
              <Link
                href="/shop/sale"
                className="text-sm hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                On Sale
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-primary">
              Support
            </h3>
            <nav className="flex flex-col gap-3">
              <Link
                href="/contact"
                className="text-sm hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                Contact Us
              </Link>
              <Link
                href="/faq"
                className="text-sm hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                FAQ
              </Link>
              <Link
                href="/shipping"
                className="text-sm hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                Shipping Info
              </Link>
              <Link
                href="/returns"
                className="text-sm hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                Returns & Exchanges
              </Link>
            </nav>
          </div>

          {/* Legal & Connect */}
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-primary">
                Legal
              </h3>
              <nav className="flex flex-col gap-3">
                <Link
                  href="/privacy"
                  className="text-sm hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-sm hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/cookies"
                  className="text-sm hover:text-primary transition-colors"
                >
                  Cookie Policy
                </Link>
              </nav>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Connect With Us</h3>
              <div className="flex gap-3">
                {[
                  {
                    href: "https://www.instagram.com/goshop",
                    icon: "/images/images/instagram.png",
                    label: "Instagram",
                    bg: "bg-gradient-to-br from-purple-600 to-pink-600",
                  },
                  {
                    href: "https://facebook.com/",
                    icon: "/images/images/facebook.png",
                    label: "Facebook",
                    bg: "bg-blue-600",
                  },
                  {
                    href: "https://wa.me/923378568671",
                    icon: "/images/images/whatsapp.png",
                    label: "WhatsApp",
                    bg: "bg-green-600",
                  },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`w-10 h-10 rounded-lg ${social.bg} flex items-center justify-center hover:opacity-90 transition-all hover:scale-105`}
                  >
                    <Image
                      src={social.icon}
                      alt={social.label}
                      className="w-5 h-5"
                      width={20}
                      height={20}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-1">
              &copy; {new Date().getFullYear()} GO Shop. All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              Crafted with{" "}
              <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by
              <a
                href="https://zebotix.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
              >
                Zebotix Team
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <ThemeSwitch />

            <a
              href="https://mzeeshankhan.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
            >
              Built by Muhammad Zeeshan Khan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
