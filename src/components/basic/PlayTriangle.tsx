interface PlayTriangleProps {
  className?: string;
  containerClassName?: string;
}

export default function PlayTriangle({
  className = "",
  containerClassName = "",
}: PlayTriangleProps) {
  return (
    <div
      className={`${containerClassName} flex h-[3.14rem] w-[3.14rem] items-center justify-center rounded-full bg-[var(--play-button-bg)] opacity-0 transition-all duration-1000 hover:bg-[var(--play-button-hover)]`}
    >
      <div
        className={`box-content h-0 w-0 translate-x-[0.57rem] rounded-sm border-[0.5rem] border-x-[0.867rem] border-transparent border-l-[var(--play-button-icon)] ${className}`}
      ></div>
    </div>
  );
}
