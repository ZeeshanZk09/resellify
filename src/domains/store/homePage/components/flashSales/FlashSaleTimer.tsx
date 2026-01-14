"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calculateTimeLeft(endsAt: Date): TimeLeft {
  const difference = new Date(endsAt).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    expired: false,
  };
}

interface TimeBoxProps {
  value: number;
  label: string;
}

function TimeBox({ value, label }: TimeBoxProps) {
  return (
    <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
      <span className="text-2xl md:text-3xl font-bold text-white tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs text-white/80 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

interface FlashSaleTimerProps {
  endsAt: Date | string;
  onExpire?: () => void;
  showDays?: boolean;
  compact?: boolean;
}

export default function FlashSaleTimer({
  endsAt,
  onExpire,
  showDays = true,
  compact = false,
}: FlashSaleTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    calculateTimeLeft(new Date(endsAt)),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(new Date(endsAt));
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt, onExpire]);

  if (timeLeft.expired) {
    return (
      <div className="text-white text-sm font-medium bg-red-600 px-4 py-2 rounded-lg">
        Sale Ended
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm font-medium">
        <span className="text-red-600">⏰</span>
        <span>
          {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2"
      role="timer"
      aria-label="Flash sale countdown"
    >
      <div className="hidden md:block text-white text-sm font-medium mr-2">
        Ends in:
      </div>
      <div className="flex gap-2">
        {showDays && timeLeft.days > 0 && (
          <TimeBox value={timeLeft.days} label="Days" />
        )}
        <TimeBox value={timeLeft.hours} label="Hours" />
        <TimeBox value={timeLeft.minutes} label="Mins" />
        <TimeBox value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  );
}

/**
 * Compact version for product cards
 */
export function CompactTimer({ endsAt }: { endsAt: Date | string }) {
  return <FlashSaleTimer endsAt={endsAt} showDays={false} compact />;
}
