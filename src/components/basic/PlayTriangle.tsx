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
      className={`flex h-[3.14rem] w-[3.14rem] items-center justify-center rounded-full bg-green-800 opacity-0 transition-transform duration-1000 hover:bg-green-700 group-hover:opacity-100 ${containerClassName}`}
    >
      <div
        className={`box-content h-0 w-0 translate-x-[0.57rem] rounded-sm border-[0.5rem] border-x-[0.867rem] border-transparent border-l-[black] ${className}`}
      ></div>
    </div>
  );
}
