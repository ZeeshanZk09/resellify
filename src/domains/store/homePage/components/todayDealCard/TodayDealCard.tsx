"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ClockIcon } from "@/shared/components/icons/svgIcons";

const DEFAULT_DEAL_DURATION_MS = 60 * 60 * 10000; // 1 hour

type TProps = {
  productName: string;
  newPrice: number;
  oldPrice: number;
  image: [string, string];
  dealEndTime?: Date | string;
  spec?: string[];
  url: string;
  /** optional */
  currencySymbol?: string; // default 'RS'
  locale?: string; // default 'en-US'
};

const formatCurrency = (value: number, locale = "en-US") =>
  value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatMsToDHMS = (ms: number) => {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

const pad = (n: number) => String(n).padStart(2, "0");

const TodayDealCard = ({
  productName,
  newPrice,
  oldPrice,
  image,
  dealEndTime,
  spec = [],
  url,
  currencySymbol = "RS",
  locale = "en-US",
}: TProps) => {
  // Use a timestamp instead of Date object to avoid re-renders
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  useEffect(() => {
    // Calculate end timestamp once
    let endTimestamp: number;

    if (!dealEndTime) {
      endTimestamp = Date.now() + DEFAULT_DEAL_DURATION_MS;
    } else {
      const d =
        dealEndTime instanceof Date ? dealEndTime : new Date(dealEndTime);
      endTimestamp = isNaN(d.getTime())
        ? Date.now() + DEFAULT_DEAL_DURATION_MS
        : d.getTime();
    }

    let intervalId: {
      current: any;
    };

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, endTimestamp - now);
      setTimeLeftMs(diff);

      // Clear interval when timer reaches 0
      if (diff <= 0 && intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
    intervalId = { current: setInterval(updateTimer, 1000) };

    // Initial update
    updateTimer();

    // Set up interval

    // Cleanup on unmount
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [dealEndTime]); // Only depend on dealEndTime prop

  const { days, hours, minutes, seconds } = formatMsToDHMS(timeLeftMs);
  const saveAmount = Math.max(0, oldPrice - newPrice);

  return (
    <article
      className="min-w-64 min-h-[400px] relative p-3 bg-card rounded-xl group transition-shadow hover:shadow-lg"
      aria-labelledby="deal-title"
    >
      <Link
        href={url}
        className="imgWrapper block w-full h-[220px] relative overflow-hidden border border-foreground/12 rounded-lg"
        aria-hidden="true"
      >
        {/* primary image */}
        {Array.isArray(image) && image.length > 0 && image[0] && image[1] && (
          <>
            <Image
              alt={productName}
              src={image[0]}
              fill
              sizes="(max-width:240px) 240px, 400px"
              className="object-contain transition-transform duration-300 ease-out"
              priority={false}
            />
            <Image
              alt={`${productName} - alternate`}
              src={image[1]}
              fill
              sizes="(max-width:240px) 240px, 400px"
              className="object-contain absolute inset-0 transition-all duration-300 ease-out opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-105"
              priority={false}
            />
          </>
        )}
      </Link>

      {/* Save badge */}
      <div className="absolute top-4 left-4 rounded-md px-2 py-1 bg-red-600 text-sm text-white shadow-sm">
        <span aria-hidden>Save</span>{" "}
        <span className="font-semibold">
          {formatCurrency(saveAmount, locale)} {currencySymbol}
        </span>
        <span className="sr-only"> save amount</span>
      </div>

      <Link href={url} className="block mt-4">
        <h3
          id="deal-title"
          className="ml-1 text-foreground/95 text-lg font-semibold leading-tight"
        >
          {productName}
        </h3>
      </Link>

      <div className="mt-2 ml-1 min-h-[56px]">
        {!!spec.length &&
          spec.map((item, index) => (
            <p key={index} className="text-sm text-foreground/70 leading-5">
              {item}
            </p>
          ))}
      </div>

      <div className="flex justify-between items-center mt-3 mx-1">
        <div>
          <div className="text-sm text-foreground/70">
            was{" "}
            <del>
              {formatCurrency(oldPrice, locale)} {currencySymbol}
            </del>
          </div>
          <div className="text-xl font-medium text-foreground/95">
            {formatCurrency(newPrice, locale)} {currencySymbol}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-sm">
          <ClockIcon width={16} className="fill-red-600" />
          <div
            role="status"
            aria-live="polite"
            className="w-28 h-8 rounded-md border border-red-500 flex items-center justify-center font-medium text-sm"
          >
            {timeLeftMs <= 0 ? (
              <span>Expired</span>
            ) : days > 0 ? (
              `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
            ) : (
              `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default TodayDealCard;
