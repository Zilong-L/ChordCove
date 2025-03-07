import { useSortable } from '@dnd-kit/sortable';
import Bar from "./Bar";
import {CSS} from '@dnd-kit/utilities';
import { BarData } from '@/types/sheet';

interface BarProps {
  bar: BarData;
}


export function SortableBar({bar}: BarProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: bar.id });
    // 让元素在拖拽时能跟随鼠标位置变化
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex:isDragging ? 1000 : 0,
      opacity: isDragging ? 0.5 : 1,
    };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Bar bar={bar}  />   
    </div>
  );
}

