import { CourseSession } from "../types";

export async function extractScheduleFromImage(base64Image: string, mimeType: string): Promise<CourseSession[]> {
  try {
    const response = await fetch('/api/extract-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64: base64Image, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `服务器错误: ${response.status}`);
    }

    const data = await response.json();
    const parsed = data.schedule as Omit<CourseSession, 'id'>[];
    
    return parsed.map(session => ({
      ...session,
      id: Math.random().toString(36).substring(2, 9)
    }));
  } catch (error) {
    console.error("Error extracting schedule:", error);
    if (error instanceof Error && error.message !== "Failed to fetch") {
      throw error; // 抛出真实的后端错误信息
    }
    throw new Error("无法从图像中提取日程表。请检查网络或重试。");
  }
}
