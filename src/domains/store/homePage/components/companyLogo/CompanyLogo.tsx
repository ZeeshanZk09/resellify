"use client";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";

type TProps = {
  width: number;
  bgPositionX: number;
  url: string;
};

const CompanyLogo = ({ bgPositionX, url, width }: TProps) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link
      className={`${
        mounted && theme === "dark" ? "invert" : ""
      } bg-[url('/icons/companiesIcons.png')] h-14 bg-no-repeat bg-[position-y:center] opacity-80 transition-opacity duration-300 hover:opacity-100`}
      style={{ width: width, backgroundPositionX: bgPositionX }}
      href={url}
    />
  );
};

export default CompanyLogo;
