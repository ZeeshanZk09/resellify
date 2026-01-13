"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode, useEffect, useState } from "react";
import { cn } from "@/shared/utils/styling";

export type Slide = {
  imgUrl: string;
  alt?: string;
  url?: string;
  msg?: {
    title: ReactNode;
    buttonText?: ReactNode;
  };
};

export type HomeSliderProps = {
  slides?: Slide[];
  rounded?: boolean;
  autoPlay?: boolean;
  autoPlayDelay?: number;
  showArrows?: boolean;
  showDots?: boolean;
  showProgressBar?: boolean;
  className?: string;
  slideClassName?: string;
  imageClassName?: string;
  arrowClassName?: string;
  dotClassName?: string;
  progressBarClassName?: string;
  renderArrowLeft?: (onClick: () => void) => ReactNode;
  renderArrowRight?: (onClick: () => void) => ReactNode;
  renderDot?: (
    index: number,
    isActive: boolean,
    onClick: () => void,
  ) => ReactNode;
  renderSlideContent?: (slide: Slide, isActive: boolean) => ReactNode;
  onSlideChange?: (index: number) => void;
};

export const HomeSlider = ({
  slides = [],
  rounded = true,
  autoPlay = true,
  autoPlayDelay = 6000,
  showArrows = true,
  showDots = true,
  showProgressBar = true,
  className,
  slideClassName,
  imageClassName,
  arrowClassName,
  dotClassName,
  progressBarClassName,
  renderArrowLeft,
  renderArrowRight,
  renderDot,
  renderSlideContent,
  onSlideChange,
}: HomeSliderProps) => {
  const [activeSlideNum, setActiveSlideNum] = useState(0);
  const touchPos = { start: 0, end: 0 };
  let isDragging = false;

  const totalSlides = slides.length;

  useEffect(() => {
    if (!autoPlay || totalSlides <= 1) return;
    const timer = setTimeout(() => {
      handleSliding(activeSlideNum + 1);
    }, autoPlayDelay);
    return () => clearTimeout(timer);
  }, [activeSlideNum, autoPlay, autoPlayDelay, totalSlides]);

  const handleSliding = (newSlideNumber: number) => {
    setActiveSlideNum((prev) => {
      if (newSlideNumber === prev) return prev;
      const nextIndex = (newSlideNumber + totalSlides) % totalSlides;
      if (onSlideChange) onSlideChange(nextIndex);
      return nextIndex;
    });
  };

  const touchStart = (event: React.TouchEvent) => {
    isDragging = true;
    touchPos.start = event.touches[0].clientX;
  };

  const touchMove = (event: React.TouchEvent) => {
    if (isDragging) touchPos.end = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    isDragging = false;
    if (touchPos.start !== touchPos.end && touchPos.end !== 0) {
      touchPos.start < touchPos.end
        ? handleSliding(activeSlideNum - 1)
        : handleSliding(activeSlideNum + 1);
    }
  };

  const mouseStart = (event: React.MouseEvent) => {
    isDragging = true;
    touchPos.start = event.pageX;
  };

  const mouseMove = (event: React.MouseEvent) => {
    if (isDragging) touchPos.end = event.pageX;
  };

  const defaultArrowLeft = () => (
    <button
      onClick={() => handleSliding(activeSlideNum - 1)}
      className={cn(
        "rounded-full flex justify-center size-[50px] rotate-180 border-none cursor-pointer bg-white/25",
        arrowClassName,
      )}
      aria-label="Previous slide"
    >
      <svg
        width={10}
        className="fill-none stroke-black"
        viewBox="0 0 10 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.5 1L8.5 8L1.5 15"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  const defaultArrowRight = () => (
    <button
      onClick={() => handleSliding(activeSlideNum + 1)}
      className={cn(
        "rounded-full flex justify-center size-[50px] border-none cursor-pointer bg-white/25",
        arrowClassName,
      )}
      aria-label="Next slide"
    >
      <svg
        width={10}
        className="fill-none stroke-black"
        viewBox="0 0 10 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.5 1L8.5 8L1.5 15"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  const defaultDot = (
    index: number,
    isActive: boolean,
    onClick: () => void,
  ) => (
    <button
      onClick={onClick}
      className={cn(
        "size-3 sm:size-4 border border-white/30 rounded-full transition-all duration-300",
        isActive
          ? "w-4 opacity-100 scale-110 bg-white"
          : "opacity-35 bg-white/40 hover:bg-white/80 scale-100",
        dotClassName,
      )}
      aria-label={`Go to slide ${index + 1}`}
    />
  );

  const defaultSlideContent = (slide: Slide, isActive: boolean) => (
    <>
      <Image
        src={slide.imgUrl}
        alt={slide.alt || ""}
        fill
        className={cn(
          "hover:scale-105 object-cover transition-all duration-500",
          imageClassName,
        )}
        sizes="(max-width:1080px)"
        priority
        draggable={false}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/80 to-transparent" />
      {slide.msg && (
        <div
          className={cn(
            "flex flex-col w-full absolute pt-0 sm:pt-[10%] items-center left-0 bottom-20 lg:w-[50%] text-gray-100 transition-all duration-1000",
            isActive ? "opacity-100 visible" : "opacity-0 invisible",
          )}
        >
          <h2 className="sm:text-3xl text-lg font-light">{slide.msg.title}</h2>
          {slide.url && (
            <Link
              href={slide.url}
              className="border mt-6 sm:mt-20 text-gray-100 rounded-md text-sm sm:text-base sm:px-6 sm:py-3 px-4 py-2 bg-black/80 transition-all duration-300 hover:font-medium hover:text-gray-900 hover:bg-gray-100"
            >
              {slide.msg.buttonText}
            </Link>
          )}
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "w-full h-[450px] sm:h-[500px] overflow-hidden relative group",
        rounded ? "rounded-[12px]" : "",
        className,
      )}
    >
      {totalSlides > 1 && showArrows && (
        <>
          <div className="absolute z-2 left-7 top-0 bottom-0 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-all duration-500">
            {renderArrowLeft
              ? renderArrowLeft(() => handleSliding(activeSlideNum - 1))
              : defaultArrowLeft()}
          </div>
          <div className="absolute z-2 right-7 top-0 bottom-0 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-all duration-500">
            {renderArrowRight
              ? renderArrowRight(() => handleSliding(activeSlideNum + 1))
              : defaultArrowRight()}
          </div>
        </>
      )}

      <div
        className={cn(
          "h-full overflow-hidden translate-z-0 top-0 left-0 select-none",
          rounded ? "rounded-xl" : "",
          slideClassName,
        )}
      >
        {totalSlides === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No slides provided
          </div>
        ) : (
          slides.map((slide, index) => (
            <div
              key={index}
              onTouchStart={touchStart}
              onTouchMove={touchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={mouseStart}
              onMouseMove={mouseMove}
              onMouseUp={handleTouchEnd}
              className={cn(
                "inline-block absolute w-full h-full opacity-0 invisible transition-all duration-1000 overflow-hidden",
                rounded ? "rounded-[12px]" : "",
                index === activeSlideNum ? "opacity-100 visible" : "",
              )}
            >
              {renderSlideContent
                ? renderSlideContent(slide, index === activeSlideNum)
                : defaultSlideContent(slide, index === activeSlideNum)}
              {showProgressBar && (
                <span
                  className={cn(
                    "absolute top-0 w-0 h-2 bg-white/30 transition-all ease-linear",
                    index === activeSlideNum &&
                      "animate-autoSlide duration-[5s]",
                    progressBarClassName,
                  )}
                />
              )}
            </div>
          ))
        )}
      </div>

      {totalSlides > 1 && showDots && (
        <div className="absolute bottom-5 left-0 right-0 flex gap-4 sm:gap-6 justify-center items-center">
          {slides.map((_, index) => (
            <Fragment key={index}>
              {renderDot
                ? renderDot(index, index === activeSlideNum, () =>
                    handleSliding(index),
                  )
                : defaultDot(index, index === activeSlideNum, () =>
                    handleSliding(index),
                  )}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
