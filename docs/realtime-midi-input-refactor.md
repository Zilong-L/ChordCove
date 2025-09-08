# 实时 MIDI 输入（RealTimeMidiInputs）改造计划

## 背景与现状
- 组件：`src/components/Editor/RealTimeInputs/RealTimeMidiInputs.tsx`
- 当前逻辑：
  - 点击“Start Recording”后记录 `startingTime`，随后所有音符的起始拍位置通过 `(noteStartTime - startingTime - inputOffset) / beatDuration + editingBeat` 计算，并按 `snapType`（八分/十六分）吸附。
  - 音符时值通过按下到松开的真实时长换算为拍（基于 BPM），再进行吸附。
  - 旋律（melody）按单音处理；`notes` 轨按多音/延音踏板处理。
- 结论：是基于“从开始录制的时刻起的相对时间”来决定音符插入位置，而不是基于“当前编辑选中位置”。

## 目标与思路
- 目标：把实时 MIDI 输入的“落点”改为“始终按当前选中位置（`editingBeat`）插入”，与普通 `useMidiInputs` 的输入逻辑对齐；同时仍保留 BPM 节拍器以辅助“时值吸附”（根据按键时长进行量化）。
- 关键点：
  - 起始拍：改为使用“事件发生时刻的 `editingBeat`”（即当前光标）。
  - 时值：保留“按下到松开”的真实时长，按 BPM 换算成拍后按 `snapType` 吸附。
  - 步进：提交后将 `editingBeat` 前进“吸附后的时值”，保持与普通输入一致的步进体验。

## 修改范围
- `RealTimeMidiInputs.tsx`：
  - 移除/绕过基于 `startingTime` 的位置计算（`calculateBeatPosition`）。
  - 在 Note On 时记录 “`startBeat = 当前 editingBeat`” 与 `startTime`，在 Note Off 时用 `startBeat` + `snap(msToBeats(duration))` 提交。
  - 提交后 `dispatch(setEditingBeat(startBeat + snappedDuration))`。
  - 旋律轨：沿用“单音流”提交；若已有未完成音符，先按其 `startBeat` 与持续时长提交再开始新的。
  - 和弦/伴奏轨：沿用普通输入的集合/踏板逻辑，但“起始拍 = 事件开始时的 `editingBeat`”。
  - 与 `useMidiInputs` 的轨道类型对齐：将当前 `switch` 中仅处理 `"notes" | "melody"` 的分支扩展为支持 `"accompaniment"`。
- 保留：`useMetronome` 与 `msToBeats`（基于 BPM 的时值换算 + 吸附）。

## 详细步骤
1. 移除时间轴定位：删除/废弃 `calculateBeatPosition` 对提交位置的参与，改为在 Note On 捕获 `startBeat`（从 Redux 的 `editing.editingBeat`）。
2. 旋律轨改造：
   - Note On：若存在 `pressingNote`，先用其 `startBeat` 与 `duration` 提交；然后用当前 `editingBeat` 作为新 `pressingNote.startBeat`，记录 `startTime`。
   - Note Off：
     - `durationBeats = snap(msToBeats(now - startTime))`
     - `setSlot({ beat: startBeat, duration: durationBeats, note: ... })`
     - `setEditingBeat(startBeat + durationBeats)`
3. 和弦/伴奏轨改造：
   - 在“第一次涉及活跃音符”的时刻记录 `chordStartBeat = 当前 editingBeat` 与 `startTime`；
   - 维持 `pressingNotes/sustain` 集合逻辑；当活跃集合清空（或踏板释放完成）时：
     - `durationBeats = snap(msToBeats(now - startTime))`
     - 将收集到的音高集合按 `chordStartBeat` 和 `durationBeats` 一次性写入；
     - `setEditingBeat(chordStartBeat + durationBeats)` 并重置状态。
4. 轨道类型统一：`handleMidiMessage` 的分支支持 `"accompaniment"`（沿用和弦/伴奏轨逻辑）。
5. UI 保持：保留 Start/Stop、Tempo、Input Offset、Snap 下拉；Start 仅用于“是否播放节拍器/伴奏”，不再决定“落点”。
6. 回归检查：
   - 切换节拍与 `snapType`，验证按键长短对时值吸附的影响；
   - 验证旋律轨单音连续输入步进正确；
   - 验证伴奏/和弦轨在踏板按下/释放时的集合提交与步进一致；
   - 验证 `accompaniment` 轨类型分支生效。

## 兼容性与注意点
- 原“基于时间线位置”的录音会变为“基于光标位置的步进录音”，不再随时间推移自动前移。
- 若在 Note On 后用户手动移动了光标，建议：
  - 采用“锁定 Note On 时的 `startBeat`”策略（本计划默认），避免结果受后续移动影响。
- 若用户希望依旧支持“自由演奏沿时间线录音”，可保留当前实现为“自由录音模式”，并通过开关切换两种模式（本次不改，后续可扩展）。

## 预估改动点（文件）
- `src/components/Editor/RealTimeInputs/RealTimeMidiInputs.tsx`

## 验收标准
- 旋律/伴奏输入的起始拍严格等于 Note On 发生时的选中位置。
- 时值由按键时长换算并按设定 `snap` 吸附。
- 提交后 `editingBeat` 前进吸附后的时值。
- 实时模式与普通 ` ` 的“落点/步进”一致；节拍器仅作为节拍感与时值吸附参考。

