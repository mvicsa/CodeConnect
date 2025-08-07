export interface ProgrammingLanguage {
  id: string
  name: string
  icon: string
  monacoLanguage: string
}

export const PROGRAMMING_LANGUAGES: ProgrammingLanguage[] = [
  { id: 'javascript', name: 'JavaScript', icon: '🟨', monacoLanguage: 'javascript' },
  { id: 'typescript', name: 'TypeScript', icon: '🔵', monacoLanguage: 'typescript' },
  { id: 'python', name: 'Python', icon: '🐍', monacoLanguage: 'python' },
  { id: 'html', name: 'HTML', icon: '🌐', monacoLanguage: 'html' },
  { id: 'css', name: 'CSS', icon: '🎨', monacoLanguage: 'css' },
  { id: 'java', name: 'Java', icon: '☕', monacoLanguage: 'java' },
  { id: 'cpp', name: 'C++', icon: '⚡', monacoLanguage: 'cpp' },
  { id: 'csharp', name: 'C#', icon: '💜', monacoLanguage: 'csharp' },
  { id: 'php', name: 'PHP', icon: '🐘', monacoLanguage: 'php' },
  { id: 'go', name: 'Go', icon: '🔵', monacoLanguage: 'go' },
  { id: 'rust', name: 'Rust', icon: '🦀', monacoLanguage: 'rust' },
  { id: 'swift', name: 'Swift', icon: '🍎', monacoLanguage: 'swift' },
  { id: 'kotlin', name: 'Kotlin', icon: '🟠', monacoLanguage: 'kotlin' },
  { id: 'ruby', name: 'Ruby', icon: '💎', monacoLanguage: 'ruby' },
  { id: 'scala', name: 'Scala', icon: '🔴', monacoLanguage: 'scala' },
  { id: 'bash', name: 'Bash', icon: '💻', monacoLanguage: 'shell' },
  { id: 'markdown', name: 'Markdown', icon: '📝', monacoLanguage: 'markdown' }
] 