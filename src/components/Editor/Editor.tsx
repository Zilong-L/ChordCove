// Editor.tsx
import { DndContext, closestCenter, useSensor, PointerSensor } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { useSelector, useDispatch } from "react-redux";
import { addBar,  reorderBars } from '../../stores/scoreSlice';
import { RootState } from '../../stores/store';
import { SortableBar } from "./SortableBar";
import { PlusIcon } from "@heroicons/react/20/solid";

export default function Editor() {
  const dispatch = useDispatch();

  // 🎼 获取 Redux 状态
  const score = useSelector((state: RootState) => state.score);
  const bars = score.bars

  // ➕ 添加 Bar
  function handleAppend() {
    dispatch(addBar());
  }

  // 🔀 拖拽结束时更新 Bar 顺序
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bars.findIndex((bar) => bar.id === active.id);
    const newIndex = bars.findIndex((bar) => bar.id === over.id);
    const newArray = arrayMove(bars, oldIndex, newIndex).map((bar, index) => ({
      ...bar,
      barNumber: index + 1,
    }));

    dispatch(reorderBars({ sectionName: "A", newBars: newArray }));
  };

  const sensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={[sensor]}>
      <SortableContext items={bars.map((bar) => bar.id)}>
        <h2 className="text-2xl text-white">{score.tempo}bpm</h2>
        <h2 className="text-2xl text-white">{score.timeSignature}</h2>

        <ul className="max-w-6xl grid grid-cols-4 bg-gradient-to-b from-[#212121] to-[#121212] min-h-[400px] p-4 content-start">
          {bars.map((bar) => (
            <li key={bar.id}>
              <SortableBar bar={bar}  />
            </li>
          ))}
          <div className="z-1 group min-h-[4rem] relative hover:bg-[#232323]" onClick={handleAppend}>
            <PlusIcon className="w-6 h-6 text-white hidden group-hover:block absolute right-4 top-[50%] -translate-y-[50%]" />
          </div>
        </ul>
      </SortableContext>
    </DndContext>
  );
}
