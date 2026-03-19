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
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = data.schedule as Omit<CourseSession, 'id'>[];
    
    return parsed.map(session => ({
      ...session,
      id: Math.random().toString(36).substring(2, 9)
    }));
  } catch (error) {
    console.error("Error extracting schedule:", error);
    throw new Error("Failed to extract schedule from the image. Please try again.");
  }
}
