export interface TestCase {
    input: string;
    output: string;
    explanation?: string;
}

export interface ArchiveItem {
    id: string;
    name: string;
    problem: string;
    date: string;
    status: 'solved' | 'pending' | 'unsolved';
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    description?: string;
    solution?: string;
    hints?: string[];
    testCases?: TestCase[];
}