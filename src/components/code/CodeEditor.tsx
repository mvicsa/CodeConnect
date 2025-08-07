'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Button } from '../ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Editor from '@monaco-editor/react'

import { selectAllLanguages } from '../../store/slices/programmingLanguagesSlice'
import CommandLanguageSelector from './CommandLanguageSelector'

// Monaco types for client-side only
interface MonacoEditor {
  getModel(): MonacoModel | null
  updateOptions(options: Record<string, unknown>): void
}

interface MonacoModel {
  setValue(value: string): void
  getValue(): string
}

interface MonacoInstance {
  editor: {
    setTheme(theme: string): void
    defineTheme(id: string, theme: { base: string; inherit: boolean; rules: unknown[]; colors: Record<string, string> }): void
    setModelLanguage(model: MonacoModel, language: string): void
  }
  languages: {
    typescript: {
      javascriptDefaults: {
        setDiagnosticsOptions(options: Record<string, unknown>): void
      }
      typescriptDefaults: {
        setDiagnosticsOptions(options: Record<string, unknown>): void
      }
    }
  }
}

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  onLanguageChange: (language: string) => void
  placeholder?: string
  onRemove?: () => void
  showRemoveButton?: boolean
  className?: string
  height?: string
  readOnly?: boolean
}

export default function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  className,
  onRemove,
  showRemoveButton = true,
  height = '240px',
  readOnly = false
}: CodeEditorProps) {
  const programmingLanguages = useSelector(selectAllLanguages)
  const editorRef = useRef<MonacoEditor>(null)
  const monacoRef = useRef<MonacoInstance>(null)
  const [themesLoaded, setThemesLoaded] = useState(false)

  // Get current theme
  const getCurrentTheme = useCallback(() => {
    if (typeof window === 'undefined') return 'code-light'
    const htmlEl = document.documentElement
    const isDark = htmlEl.classList.contains('dark')
    return isDark ? 'code-dark' : 'code-light'
  }, [])

  // Load custom themes
  const loadCustomThemes = useCallback(async (monacoInstance: MonacoInstance) => {
    if (themesLoaded) return
    
    try {
      // Load light theme
      const lightThemeResponse = await fetch('/themes/code-light.json')
      const lightTheme = await lightThemeResponse.json()
      
      // Load dark theme
      const darkThemeResponse = await fetch('/themes/code-dark.json')
      const darkTheme = await darkThemeResponse.json()

      // Define custom themes
      monacoInstance.editor.defineTheme('code-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: lightTheme.colors
      })

      monacoInstance.editor.defineTheme('code-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: darkTheme.colors
      })

      setThemesLoaded(true)
    } catch (error) {
      console.warn('Failed to load custom themes, using defaults:', error)
      // Define fallback themes
      monacoInstance.editor.defineTheme('code-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {}
      })

      monacoInstance.editor.defineTheme('code-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {}
      })
      setThemesLoaded(true)
    }
  }, [themesLoaded])

  // Handle theme changes
  const handleThemeChange = useCallback(() => {
    if (editorRef.current && monacoRef.current && themesLoaded) {
      const theme = getCurrentTheme()
      monacoRef.current.editor.setTheme(theme)
    }
  }, [getCurrentTheme, themesLoaded])

  // Watch for theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const htmlEl = document.documentElement
    const observer = new MutationObserver(handleThemeChange)
    
    observer.observe(htmlEl, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [handleThemeChange])

  // Apply theme when themes are loaded
  useEffect(() => {
    if (themesLoaded && monacoRef.current) {
      const theme = getCurrentTheme()
      monacoRef.current.editor.setTheme(theme)
    }
  }, [themesLoaded, getCurrentTheme])

  // Before Mount - Setup themes before editor initialization
  const handleBeforeMount = useCallback(async (monacoInstance: MonacoInstance) => {
    // Load themes first
    await loadCustomThemes(monacoInstance)
    
    // Set initial theme immediately
    const theme = getCurrentTheme()
    monacoInstance.editor.setTheme(theme)
    
    // Configure Monaco for better TypeScript support
    monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })
    
    monacoInstance.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    // Configure diagnostics for other languages
    const configureLanguageDiagnostics = (monacoInstance: MonacoInstance) => {
      const languages = [
        'java', 'python', 'cpp', 'csharp', 'php', 
        'go', 'rust', 'kotlin', 'swift', 'scala', 'ruby'
      ]

      languages.forEach(lang => {
        const langModule = (monacoInstance.languages as unknown as Record<string, unknown>)[lang];
        if (langModule && (langModule as Record<string, unknown>)[`${lang}Defaults`]) {
          ((langModule as Record<string, unknown>)[`${lang}Defaults`] as { setDiagnosticsOptions: (options: { noSemanticValidation: boolean; noSyntaxValidation: boolean }) => void }).setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
          })
        }
      })
    }

    configureLanguageDiagnostics(monacoInstance)
  }, [loadCustomThemes, getCurrentTheme])

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: MonacoEditor, monacoInstance: MonacoInstance) => {
    editorRef.current = editor
    monacoRef.current = monacoInstance
    
    // Apply theme again to ensure it's set
    const theme = getCurrentTheme()
    monacoInstance.editor.setTheme(theme)
    
    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 14,
      fontFamily: 'Josefin Sans, "Courier New", monospace',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
      folding: true,
      wordWrap: 'on',
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
      parameterHints: {
        enabled: true,
      },
      hover: {
        enabled: true,
      },
      contextmenu: true,
      mouseWheelZoom: true,
      smoothScrolling: true,
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: 'on',
      renderWhitespace: 'selection',
      renderControlCharacters: false,
      renderLineHighlight: 'all',
      selectOnLineNumbers: true,
      glyphMargin: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      links: true,
      colorDecorators: true,
      bracketPairColorization: {
        enabled: true,
      },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      lineNumbersMinChars: 3,
      lineDecorationsWidth: 10,
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
    })

    // Add code snippets
    // addCodeSnippets(monacoInstance)
  }, [getCurrentTheme])

  // Handle editor change
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }, [onChange])

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage: string) => {
    onLanguageChange(newLanguage)
    
    // Update editor language if editor is ready
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, newLanguage)
      }
    }
  }, [onLanguageChange])

  // Get Monaco language ID
  const getMonacoLanguage = (languageId: string): string => {
    const language = programmingLanguages.find(lang => lang.id === languageId)
    return language?.monacoLanguage || 'plaintext'
  }

  // Add common code snippets
  // const addCodeSnippets = useCallback((monacoInstance: MonacoInstance) => {
  //   // Code snippets can be added here if needed
  // }, [])

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <CommandLanguageSelector 
          value={language} 
          onValueChange={handleLanguageChange}
        />
        {showRemoveButton && onRemove && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
      
      {/* Monaco Editor */}
      <div className="rounded-lg">
        <Editor
          height={height}
          defaultLanguage={getMonacoLanguage(language)}
          language={getMonacoLanguage(language)}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          beforeMount={handleBeforeMount}
          options={{
            readOnly,
            theme: getCurrentTheme(),
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'Josefin Sans, "Courier New", monospace',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            folding: true,
            wordWrap: 'on',
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            parameterHints: {
              enabled: true,
            },
            hover: {
              enabled: true,
            },
            contextmenu: true,
            mouseWheelZoom: true,
            smoothScrolling: true,
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'on',
            renderWhitespace: 'selection',
            renderControlCharacters: false,
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            glyphMargin: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            links: true,
            colorDecorators: true,
            bracketPairColorization: {
              enabled: true,
            },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            lineNumbersMinChars: 3,
            lineDecorationsWidth: 10,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
          }}
        />
      </div>
    </div>
  )
}