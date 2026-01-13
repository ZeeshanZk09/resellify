"use client";
import Image from "next/image";
import Link from "next/link";
import type { JsonValue } from "next-auth/adapters";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type CompanyLogoProps = {
  upload: {
    path: string;
    fileName: string;
    altText: string | null;
  } | null;
  id: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  metadata: JsonValue;
  createdById: string;
  publishedById: string | null;
  logo: string | null;
  width?: number;
  bgPositionX?: number;
  url?: string;
};

const CompanyLogo = ({
  upload,
  logo,
  name,
  width = 100,
  bgPositionX = 0,
  url = "/",
}: CompanyLogoProps) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use upload path if available, otherwise fall back to logo, otherwise use sprite
  const logoSrc = upload?.path || logo;
  const altText = upload?.altText || name || "Company logo";

  const logoContent = logoSrc ? (
    <Image
      src={logoSrc}
      alt={altText}
      width={width}
      height={56}
      className={`${
        mounted && theme === "dark" ? "invert" : ""
      } opacity-80 transition-opacity duration-300 hover:opacity-100 object-contain`}
      style={{ width: `${width}px`, height: "56px" }}
    />
  ) : (
    <div
      className={`${
        mounted && theme === "dark" ? "invert" : ""
      } bg-[url('/icons/companiesIcons.png')] h-14 bg-no-repeat bg-[position-y:center] opacity-80 transition-opacity duration-300 hover:opacity-100`}
      style={{
        width: `${width}px`,
        backgroundPositionX: `${bgPositionX}px`,
      }}
    />
  );

  return (
    <Link href={url} className="flex items-center justify-center">
      {logoContent}
    </Link>
  );
};

export default CompanyLogo;
