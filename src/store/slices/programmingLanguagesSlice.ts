import { createSlice } from '@reduxjs/toolkit'

export interface ProgrammingLanguage {
  id: string
  name: string
  displayName: string
  icon?: string
  color?: string
  description?: string
  category: 'web' | 'mobile' | 'desktop' | 'backend' | 'data' | 'other'
  extensions: string[]
  monacoLanguage: string
}

const PROGRAMMING_LANGUAGES: ProgrammingLanguage[] = [
  // Web Development
  {
    id: 'javascript',
    name: 'javascript',
    displayName: 'JavaScript',
    icon: '⚡',
    color: '#f7df1e',
    description: 'Dynamic programming language for web development',
    category: 'web',
    extensions: ['.js', '.mjs'],
    monacoLanguage: 'javascript'
  },
  {
    id: 'typescript',
    name: 'typescript',
    displayName: 'TypeScript',
    icon: '🔷',
    color: '#3178c6',
    description: 'Typed superset of JavaScript',
    category: 'web',
    extensions: ['.ts', '.tsx'],
    monacoLanguage: 'typescript'
  },
  {
    id: 'html',
    name: 'html',
    displayName: 'HTML',
    icon: '🌐',
    color: '#e34c26',
    description: 'Markup language for web pages',
    category: 'web',
    extensions: ['.html', '.htm'],
    monacoLanguage: 'html'
  },
  {
    id: 'css',
    name: 'css',
    displayName: 'CSS',
    icon: '🎨',
    color: '#1572b6',
    description: 'Styling language for web pages',
    category: 'web',
    extensions: ['.css', '.scss', '.less'],
    monacoLanguage: 'css'
  },
  {
    id: 'jsx',
    name: 'jsx',
    displayName: 'JSX',
    icon: '⚛️',
    color: '#61dafb',
    description: 'JavaScript XML for React',
    category: 'web',
    extensions: ['.jsx'],
    monacoLanguage: 'javascript'
  },
  {
    id: 'tsx',
    name: 'tsx',
    displayName: 'TSX',
    icon: '⚛️',
    color: '#3178c6',
    description: 'TypeScript XML for React',
    category: 'web',
    extensions: ['.tsx'],
    monacoLanguage: 'typescript'
  },

  // Backend Development
  {
    id: 'python',
    name: 'python',
    displayName: 'Python',
    icon: '🐍',
    color: '#3776ab',
    description: 'High-level programming language',
    category: 'backend',
    extensions: ['.py', '.pyw'],
    monacoLanguage: 'python'
  },
  {
    id: 'java',
    name: 'java',
    displayName: 'Java',
    icon: '☕',
    color: '#007396',
    description: 'Object-oriented programming language',
    category: 'backend',
    extensions: ['.java'],
    monacoLanguage: 'java'
  },
  {
    id: 'php',
    name: 'php',
    displayName: 'PHP',
    icon: '🐘',
    color: '#777bb4',
    description: 'Server-side scripting language',
    category: 'backend',
    extensions: ['.php'],
    monacoLanguage: 'php'
  },
  {
    id: 'ruby',
    name: 'ruby',
    displayName: 'Ruby',
    icon: '💎',
    color: '#cc342d',
    description: 'Dynamic, object-oriented language',
    category: 'backend',
    extensions: ['.rb'],
    monacoLanguage: 'ruby'
  },
  {
    id: 'go',
    name: 'go',
    displayName: 'Go',
    icon: '🐹',
    color: '#00add8',
    description: 'Statically typed compiled language',
    category: 'backend',
    extensions: ['.go'],
    monacoLanguage: 'go'
  },

  // Mobile Development
  {
    id: 'swift',
    name: 'swift',
    displayName: 'Swift',
    icon: '🍎',
    color: '#ff6b4a',
    description: 'Apple\'s programming language',
    category: 'mobile',
    extensions: ['.swift'],
    monacoLanguage: 'swift'
  },
  {
    id: 'kotlin',
    name: 'kotlin',
    displayName: 'Kotlin',
    icon: '🟠',
    color: '#7f52ff',
    description: 'Modern Android development',
    category: 'mobile',
    extensions: ['.kt', '.kts'],
    monacoLanguage: 'kotlin'
  },

  // Desktop Development
  {
    id: 'cpp',
    name: 'cpp',
    displayName: 'C++',
    icon: '⚡',
    color: '#00599c',
    description: 'General-purpose programming language',
    category: 'desktop',
    extensions: ['.cpp', '.cc', '.cxx'],
    monacoLanguage: 'cpp'
  },
  {
    id: 'csharp',
    name: 'csharp',
    displayName: 'C#',
    icon: '💜',
    color: '#178600',
    description: 'Microsoft\'s programming language',
    category: 'desktop',
    extensions: ['.cs'],
    monacoLanguage: 'csharp'
  },

  // Data & Configuration
  {
    id: 'sql',
    name: 'sql',
    displayName: 'SQL',
    icon: '🗄️',
    color: '#336791',
    description: 'Database query language',
    category: 'data',
    extensions: ['.sql'],
    monacoLanguage: 'sql'
  },
  {
    id: 'json',
    name: 'json',
    displayName: 'JSON',
    icon: '📄',
    color: '#000000',
    description: 'Data interchange format',
    category: 'data',
    extensions: ['.json'],
    monacoLanguage: 'json'
  },
  {
    id: 'yaml',
    name: 'yaml',
    displayName: 'YAML',
    icon: '📋',
    color: '#cb171e',
    description: 'Human-readable data serialization',
    category: 'data',
    extensions: ['.yml', '.yaml'],
    monacoLanguage: 'yaml'
  },
  {
    id: 'xml',
    name: 'xml',
    displayName: 'XML',
    icon: '📄',
    color: '#ff6600',
    description: 'Extensible markup language',
    category: 'data',
    extensions: ['.xml'],
    monacoLanguage: 'xml'
  },

  // Other
  {
    id: 'rust',
    name: 'rust',
    displayName: 'Rust',
    icon: '🦀',
    color: '#ce422b',
    description: 'Systems programming language',
    category: 'other',
    extensions: ['.rs'],
    monacoLanguage: 'rust'
  },
  {
    id: 'scala',
    name: 'scala',
    displayName: 'Scala',
    icon: '🔴',
    color: '#dc322f',
    description: 'Functional programming language',
    category: 'other',
    extensions: ['.scala'],
    monacoLanguage: 'scala'
  },
  {
    id: 'bash',
    name: 'bash',
    displayName: 'Bash',
    icon: '💻',
    color: '#4eaa25',
    description: 'Unix shell scripting',
    category: 'other',
    extensions: ['.sh', '.bash'],
    monacoLanguage: 'shell'
  },
  {
    id: 'markdown',
    name: 'markdown',
    displayName: 'Markdown',
    icon: '📝',
    color: '#000000',
    description: 'Lightweight markup language',
    category: 'other',
    extensions: ['.md', '.markdown'],
    monacoLanguage: 'markdown'
  }
]

interface ProgrammingLanguagesState {
  languages: ProgrammingLanguage[]
  selectedLanguage: string
  categories: string[]
}

const initialState: ProgrammingLanguagesState = {
  languages: PROGRAMMING_LANGUAGES,
  selectedLanguage: 'javascript',
  categories: ['web', 'backend', 'mobile', 'desktop', 'data', 'other']
}

const programmingLanguagesSlice = createSlice({
  name: 'programmingLanguages',
  initialState,
  reducers: {
    addLanguage: (state, action) => {
      const newLanguage = action.payload as ProgrammingLanguage
      if (!state.languages.find(lang => lang.id === newLanguage.id)) {
        state.languages.push(newLanguage)
      }
    },
    removeLanguage: (state, action) => {
      state.languages = state.languages.filter(lang => lang.id !== action.payload)
    },
    setLanguages: (state, action) => {
      state.languages = action.payload
    },
    setSelectedLanguage: (state, action) => {
      state.selectedLanguage = action.payload
    },
    addCategory: (state, action) => {
      if (!state.categories.includes(action.payload)) {
        state.categories.push(action.payload)
      }
    },
    removeCategory: (state, action) => {
      state.categories = state.categories.filter(cat => cat !== action.payload)
    }
  },
})

export const { 
  addLanguage, 
  removeLanguage, 
  setLanguages, 
  setSelectedLanguage,
  addCategory,
  removeCategory
} = programmingLanguagesSlice.actions

// Selectors
export const selectAllLanguages = (state: { programmingLanguages: ProgrammingLanguagesState }) => 
  state.programmingLanguages.languages

export const selectLanguagesByCategory = (state: { programmingLanguages: ProgrammingLanguagesState }, category: string) =>
  state.programmingLanguages.languages.filter(lang => lang.category === category)

export const selectSelectedLanguage = (state: { programmingLanguages: ProgrammingLanguagesState }) =>
  state.programmingLanguages.selectedLanguage

export const selectLanguageById = (state: { programmingLanguages: ProgrammingLanguagesState }, id: string) =>
  state.programmingLanguages.languages.find(lang => lang.id === id)

export const selectCategories = (state: { programmingLanguages: ProgrammingLanguagesState }) =>
  state.programmingLanguages.categories

export default programmingLanguagesSlice.reducer 