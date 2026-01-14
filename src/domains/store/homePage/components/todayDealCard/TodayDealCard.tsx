"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ClockIcon } from "@/shared/components/icons/svgIcons";
import type { Upload } from "@/shared/lib/generated/prisma/browser";
import type { Visibility } from "@/shared/lib/generated/prisma/enums";

// const DEFAULT_DEAL_DURATION_MS = 60 * 60 * 10000; // 1 hour

type TProps = {
  visibility: Visibility;
  productDescription: string;
  productName: string;
  newPrice: number;
  oldPrice: number;
  image?: [Upload, Upload];
  dealEndTime?: Date | string;
  spec?: { name: string; value: string }[];
  url: string;
  /** optional */
  currencySymbol?: string; // default 'RS'
  locale?: string; // default 'en-US'
  className?: string;
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
  visibility,
  productDescription,
  productName,
  newPrice,
  oldPrice,
  image,
  dealEndTime,
  spec = [] as { name: string; value: string | null | undefined }[] as {
    name: string;
    value: string;
  }[],
  url,
  currencySymbol = "RS",
  locale = "en-US",
  className = "",
}: TProps) => {
  // Use a timestamp instead of Date object to avoid re-renders
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  useEffect(() => {
    // Calculate end timestamp once
    let endTimestamp: number;

    if (dealEndTime) {
      const d =
        dealEndTime instanceof Date ? dealEndTime : new Date(dealEndTime);
      endTimestamp = d.getTime();
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
  console.log("saveAmount: ", saveAmount, "typeof: ", typeof saveAmount);
  console.log("image in toadys deal card: ", image);
  // console.log("product: ", spec);

  return (
    <article
      className={`${className} min-w-70 h-full flex flex-col gap-3 relative rounded-xl bg-card overflow-hidden p-3`}
      aria-labelledby="deal-title"
    >
      {/* Image wrapper: fixed visual area to keep cards uniform */}
      <div className="relative w-full aspect-4/3 bg-background/50 rounded-lg overflow-hidden group shrink-0">
        <Link href={url} aria-hidden="true" className="block w-full h-full">
          {Array.isArray(image) && image.length > 0 && (
            <>
              {/* primary image fills and crops to area for uniformity */}
              <Image
                alt={productName}
                src={image[0].path}
                width={image[0].width || 800}
                height={image[0].height || 600}
                className="object-cover w-full h-full transition-transform duration-300 ease-out"
                priority={false}
              />
              {image[1] && (
                <Image
                  alt={`${productName} - alternate`}
                  src={image[1].path}
                  width={image[1].width || 800}
                  height={image[1].height || 600}
                  // keep alternate absolute so it overlays consistently
                  className="object-cover absolute inset-0 w-full h-full transition-all duration-300 ease-out opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                  priority={false}
                />
              )}
            </>
          )}
        </Link>

        {/* Save badge */}
        {!!saveAmount && saveAmount > 0 && (
          <div className="absolute top-2 left-2 rounded-md px-2 py-1 bg-red-600 text-xs text-white shadow-md">
            <span aria-hidden>Save</span>{" "}
            <span className="font-semibold">
              {formatCurrency(saveAmount, locale)} {currencySymbol}
            </span>
            <span className="sr-only"> save amount</span>
          </div>
        )}
      </div>

      {/* Content area: flexible but clipped so card height stays consistent */}
      <div className="flex-1 flex flex-col gap-2 justify-between overflow-hidden">
        <div className="flex flex-col gap-2">
          <Link href={url}>
            <h3
              id="deal-title"
              className="text-foreground/95 text-sm sm:text-base font-semibold leading-tight line-clamp-2"
            >
              {productName}
            </h3>
          </Link>

          <div className="min-h-10 sm:min-h-12">
            {spec.length ? (
              <ul className="text-xs sm:text-sm text-foreground/70 space-y-1 line-clamp-3">
                {spec.map((item, index) => (
                  <li key={index + Math.random()}>
                    <span className="font-medium">{item.name}:</span>{" "}
                    {item.value ? item.value : "N/A"}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="wrap-break-word text-xs sm:text-sm text-foreground/70 line-clamp-3">
                <span className="font-medium text-foreground/95">
                  Description:
                </span>{" "}
                {productDescription ?? "N/A"}
              </p>
            )}
          </div>

          {/* Stock status */}
          <p
            className={
              visibility === "PUBLIC"
                ? "bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium w-fit"
                : "bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium w-fit"
            }
          >
            {visibility === "PUBLIC" ? "In Stock" : "Out of Stock"}
          </p>
        </div>

        {/* Footer grid: price & timer - stays at bottom because content area is flex-col justify-between */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 items-end mt-3 sm:mt-0">
          {/* Price */}
          <div className="flex flex-col">
            {oldPrice > 0 && (
              <div className="text-xs sm:text-sm text-foreground/60 line-through">
                {formatCurrency(oldPrice, locale)} {currencySymbol}
              </div>
            )}
            <div className="text-lg sm:text-xl font-bold text-foreground/95">
              {formatCurrency(newPrice, locale)} {currencySymbol}
            </div>
          </div>

          {/* Timer */}
          {!isNaN(days) && !isNaN(minutes) && !isNaN(seconds) && (
            <div className="flex flex-col items-start xs:items-end gap-1">
              <ClockIcon width={14} className="sm:w-4 fill-red-600" />
              <div
                role="status"
                aria-live="polite"
                className="w-full max-w-22.5 sm:max-w-25 h-7 sm:h-8 rounded-lg border border-red-500 flex items-center justify-center font-semibold text-xs sm:text-sm"
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
          )}
        </div>
      </div>
    </article>
  );
};

export default TodayDealCard;
