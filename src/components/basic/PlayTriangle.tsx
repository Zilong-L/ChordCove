interface PlayTriangleProps {
  className?: string;
  containerClassName?: string;
}

export default function PlayTriangle({ className = "", containerClassName = "" }: PlayTriangleProps) {
  return (
    <div className={`flex justify-center items-center w-[3.14rem] h-[3.14rem] bg-green-800 transition-transform opacity-0 duration-1000 group-hover:opacity-100 hover:bg-green-700 rounded-full ${containerClassName}`}>
      <div className={`w-0 h-0 border-x-[0.867rem] border-l-[black] translate-x-[0.57rem] border-[0.5rem] rounded-sm box-content border-transparent ${className}`}></div>
    </div>
  );
} 