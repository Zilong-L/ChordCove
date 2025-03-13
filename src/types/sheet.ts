export interface SimpleScore{
  tempo: number;
  key: string;
  timeSignature: string;
  content: string;
}
export interface  SheetMetaData  {
  id: string;
  title: string;
  composer: string;
  singer: string;
  uploader: string;
  uploaderId: number;
  coverImage: string;
}


export type Slot = {
  beat: number;     
  duration: number; 
  note: string;   // 可选，表示音高
  chord: string;    // 可选，和弦
  lyric: string;    // 可选，歌词
  sustain: boolean;
  extraInfo?: string; // 可选，额外信息

};

export type BarData = {
  id: string;
  barNumber: number; // 记录当前 Bar 在 Section 内的顺序
  slots: Slot[];
};



export interface Score {
  tempo: number;
  key: string;
  timeSignature: string;
  bars: BarData[];
  beatsPerBar:number,
  baseBeat:number
}
