export interface SimpleScore {
  tempo: number;
  key: string;
  timeSignature: string;
  content: string;
}
export interface SheetMetaData {
  id: string;
  title: string;
  uploader: string;
  uploaderId: number;
  coverImage: string;
  singers?: Array<{
    id: number;
    name: string;
    role: string;
  }>;
  composers?: Array<{
    id: number;
    name: string;
    role: string;
  }>;
}
