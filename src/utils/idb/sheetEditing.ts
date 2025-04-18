import { v4 as uuidv4 } from "uuid";
import { addLocalSheet } from "./localsheet";

export async function createSimpleSheet(): Promise<{ url: string; localKey: string }> {
    const localKey = uuidv4();
    await addLocalSheet({
        localKey,
        metadata: { title: "未命名简单谱", sheetType: "simple" },
        content: {
            key: "C3",
            tempo: 120,
            timeSignature: "4/4",
            content: "[I]你存在，我[IV]深深地脑海里",
        },
    });
    return { url: `/editor/simple/${localKey}`, localKey };
}

export async function createFullSheet(): Promise<{ url: string; localKey: string }> {
    const localKey = uuidv4();
    return { url: `/editor/full/${localKey}`, localKey };
}
