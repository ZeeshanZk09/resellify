type TProps = {
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  className?: string;
};

export const SK_Box = ({
  width = "100%",
  height = "1rem",
  rounded = "sm",
  className = "",
}: TProps) => {
  return (
    <div
      className={`
          relative inline-block overflow-hidden
          bg-muted
          after:absolute after:inset-0
          after:bg-[var(--skeleton-shimmer)]
          after:animate-[loading_1.5s_infinite]
          rounded-${rounded} ${className}
        `}
      style={{ width, height }}
    />
  );
};
