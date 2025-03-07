// Editor.tsx
import { DndContext, closestCenter, useSensor, PointerSensor } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { useSelector, useDispatch } from "react-redux";
import { addBar, reorderBars } from '../../stores/scoreSlice';
import {update, updateInputDuration} from '@stores/editingSlice'
import { RootState } from '../../stores/store';
import { SortableBar } from "./SortableBar";
import { PlusIcon } from "@heroicons/react/20/solid";
import WholeNote from "@assets/musicnotes/Whole";
import HalfNote from "@assets/musicnotes/Half";
import QuarterNote from "@assets/musicnotes/Quarter";
import EighthNote from "@assets/musicnotes/Eighth";
import SixteenthNote from "@assets/musicnotes/Sixteenth";
import ThirtySecondNote from "@assets/musicnotes/Thirtysecond";

const noteIcons = {
  1: WholeNote,
  2: HalfNote,
  4: QuarterNote,
  8: EighthNote,
  16: SixteenthNote,
  32: ThirtySecondNote,
};
export default function Editor() {
  const dispatch = useDispatch();

  // 🎼 获取 Redux 状态
  const score = useSelector((state: RootState) => state.score);
  const editingStore = useSelector((state: RootState) => state.editing);
  const {allowedNoteTime,insertNoteTime,insertedDuration} = editingStore
  
  
  


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

    dispatch(reorderBars({ newBars: newArray }));
  };

  const sensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  return (
    <div className="bg-gradient-to-b from-[#212121] to-[#121212] min-h-[400px]">
      <h2 className="text-2xl text-white">{score.tempo}bpm</h2>
      <h2 className="text-2xl text-white">{score.timeSignature}</h2>
      <div className="flex flex-wrap">
      {allowedNoteTime.map((duration) => (
        <button  key={duration} onClick={() => dispatch(updateInputDuration({newInputTime:duration,baseBeat:score.baseBeat}))}
          style={{backgroundColor:insertNoteTime===duration?"#4a5568":"#2d3748"}}
        >
          {noteIcons[duration]({className:"w-12 h-12 text-white"})}
        </button>
      ))}
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={[sensor]}>
        <SortableContext items={bars.map((bar) => bar.id)}>
          <ul className="max-w-6xl grid grid-cols-4  p-4 content-start">
            {bars.map((bar) => (
              <li key={bar.id}>
                <SortableBar bar={bar} />
              </li>
            ))}
            <div className="z-1 group min-h-[4rem] relative hover:bg-[#232323]" onClick={handleAppend}>
              <PlusIcon className="w-6 h-6 text-white hidden group-hover:block absolute right-4 top-[50%] -translate-y-[50%]" />
            </div>
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
