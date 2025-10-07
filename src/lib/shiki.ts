import { BundledLanguage, createHighlighter, type Highlighter } from 'shiki'

// Global highlighter instance
let globalHighlighter: Highlighter | null = null
let currentTheme: string | null = null
let loadedLanguages: Set<string> = new Set()
let loadedThemes: Set<string> = new Set()
const themeCache: Map<string, unknown> = new Map()
let loadingPromise: Promise<Highlighter> | null = null

// Get current theme name
const getCurrentTheme = () => {
  const htmlEl = document.documentElement
  const isDark = htmlEl.classList.contains('dark')
  return isDark ? 'code-dark' : 'code-light'
}

// Load theme JSON with caching
const loadTheme = async (themeName: string) => {
  // Return cached theme if available
  if (themeCache.has(themeName)) {
    return themeCache.get(themeName)
  }

  const themePath = `/themes/${themeName}.json`
  try {
    const response = await fetch(themePath)
    const theme = await response.json()
    themeCache.set(themeName, theme)
    return theme
  } catch {
    return null
  }
}

// Get or create highlighter with proper synchronization
export const getHighlighter = async (
  language: string, 
  themeOverride?: 'light' | 'dark' // Add theme override
): Promise<Highlighter> => {
  const themeName = themeOverride ? `code-${themeOverride}` : getCurrentTheme();
  
  // If there's already a loading operation, wait for it
  if (loadingPromise) {
    return loadingPromise
  }
  
  // Check if we need to create a new highlighter or update existing one
  const needsNewHighlighter = !globalHighlighter || currentTheme !== themeName
  const needsLanguage = !loadedLanguages.has(language)
  const needsTheme = !loadedThemes.has(themeName)
  
  if (needsNewHighlighter || needsLanguage || needsTheme) {
    // Create loading promise to prevent race conditions
    loadingPromise = (async () => {
      try {
        // Load theme first
        const customTheme = await loadTheme(themeName)
        if (!customTheme) {
          throw new Error(`Failed to load theme: ${themeName}`)
        }
        
        if (needsNewHighlighter) {
          // Dispose old highlighter if it exists
          if (globalHighlighter) {
            try {
              globalHighlighter.dispose()
            } catch {
              console.warn('Error disposing highlighter:')
            }
          }
          
          // Create new highlighter
          globalHighlighter = await createHighlighter({
            langs: [language],
            themes: [{ name: themeName, ...customTheme }],
          })
          
          currentTheme = themeName
          loadedLanguages = new Set([language])
          loadedThemes = new Set([themeName])
        } else {
          // Add new language or theme to existing highlighter
          if (globalHighlighter) {
            if (needsLanguage) {
              await globalHighlighter.loadLanguage(language as BundledLanguage)
              loadedLanguages.add(language)
            }
            if (needsTheme) {
              await globalHighlighter.loadTheme({ name: themeName, ...customTheme })
              loadedThemes.add(themeName)
            }
          }
        }
        
        if (!globalHighlighter) {
          throw new Error('Failed to create highlighter')
        }
        
        return globalHighlighter
      } finally {
        loadingPromise = null
      }
    })()
    
    return loadingPromise
  }
  
  if (!globalHighlighter) {
    throw new Error('Failed to create highlighter')
  }
  
  return globalHighlighter
}

// Highlight code safely with retry logic
export const highlightCode = async (
  code: string, 
  language: string, 
  theme?: 'light' | 'dark' // Add theme parameter
): Promise<string> => {
  if (!code.trim()) return '';
  
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const highlighter = await getHighlighter(language, theme);
      const themeName = theme ? `code-${theme}` : getCurrentTheme();
      
      return highlighter.codeToHtml(code, {
        lang: language as BundledLanguage,
        theme: themeName,
      });
    } catch {
      retryCount++
      
      if (retryCount >= maxRetries) {
        return code // Return plain text as fallback
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * retryCount))
    }
  }
  
  return code;
}

// Cleanup function (call on app unmount)
export const cleanupHighlighter = () => {
  if (globalHighlighter) {
    try {
      globalHighlighter.dispose()
    } catch {
    }
    globalHighlighter = null
    currentTheme = null
    loadedLanguages.clear()
    loadedThemes.clear()
    themeCache.clear()
    loadingPromise = null
  }
} 