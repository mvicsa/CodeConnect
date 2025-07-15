import { ArchiveItem } from '../types/archive';

// Mock data
const archiveData: ArchiveItem[] = [
    {
        id: "1", // Ensure ID is string
        name: "John Doe",
        problem: "Implement a function to reverse a string.",
        date: "2023-10-01",
        status: "solved",
        difficulty: "medium",
        tags: ["JavaScript", "String Manipulation"],
        solution: `function reverseString(str) {\n  return str.split('').reverse().join('');\n}`,
        description: "Reverse a string implementation",
        hints: ["Use split(), reverse(), join()"],
        testCases: [
            {
                input: "hello",
                output: "olleh",
                explanation: "Reverses the string"
            }
        ]
    },
    {
        id: "2",
        name: "Jane Smith",
        problem: "Find the maximum number in an array.",
        date: "2023-10-15",
        status: "pending",
        difficulty: "easy",
        tags: ["JavaScript", "Arrays"],
        description: "Find max number in array",
        hints: ["Use Math.max()"]
    }
    ,
    {
        id: "3",
        name: "Alice Johnson",
        problem: "Check if a number is prime.",
        date: "2023-10-20",
        status: "unsolved",
        difficulty: "hard",
        tags: ["JavaScript", "Math"],
        description: "Prime number checker",
        hints: ["Check divisibility up to square root of the number"]
    }
    ,
    {
        id: "4",
        name: "Bob Brown",
        problem: "Implement a binary search algorithm.",
        date: "2023-10-25",
        status: "solved",
        difficulty: "medium",
        tags: ["JavaScript", "Algorithms"],
        solution: `function binarySearch(arr, target) {\n  let left = 0;\n  let right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}`,
        description: "Binary search implementation",
        hints: ["Use a while loop", "Calculate mid index"]
    }
    ,
    {
        id: "5",
        name: "Charlie Davis",
        problem: "Sort an array using quicksort.",
        date: "2023-10-30",
        status: "solved",
        difficulty: "hard",
        tags: ["JavaScript", "Sorting Algorithms"],
        solution: `function quicksort(arr) {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[arr.length - 1];\n  const left = arr.filter(x => x < pivot);\n  const right = arr.filter(x => x > pivot);\n  return [...quicksort(left), pivot, ...quicksort(right)];\n}`,
        description: "Quicksort algorithm implementation",
        hints: ["Choose a pivot", "Partition the array"]
    }
];

export class ArchiveService {
    static async getAllArchiveItems(): Promise<ArchiveItem[]> {
        return archiveData;
    }

    static async getArchiveItemById(id: string): Promise<ArchiveItem | null> {
        // Add debug logging
        console.log(`[DEBUG] Looking for ID: ${id} (type: ${typeof id})`);
        const item = archiveData.find(item => item.id === String(id)); // Force string comparison
        console.log(`[DEBUG] Found item:`, item);
        return item || null;
    }

    static async getAllArchiveIds(): Promise<string[]> {
        return archiveData.map(item => item.id);
    }
}