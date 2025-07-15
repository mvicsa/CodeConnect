import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// تأكد من أن هذا الملف يحتوي على الكود التالي لتمكين الاتصال بالـ JSON Server
export async function fetchJsonServerData<T>(endpoint: string): Promise<T> {
  const BASE_URL = 'http://localhost:4000'; // المنفذ 4000 كما ذكرت

  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);

    if (!response.ok) {
      // إذا كان الخطأ 404 (لم يتم العثور على المستخدم/البيانات)، قد لا نرمي خطأ
      // ولكن بالنسبة لجلب "users" بشكل عام، يعتبر هذا خطأ في الاتصال بالـ API.
      const errorText = `Failed to fetch data from ${endpoint}: ${response.statusText}`;
      console.error(errorText);
      throw new Error(errorText);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    console.error("Error fetching data:", error);
    // إذا فشل الاتصال تماماً (مثل JSON server لا يعمل)، سنرمي خطأ.
    throw error; 
  }
}

// يمكن أن يحتوي الملف على دوال أخرى مثل formatPrice, formatDate, etc.
// ...