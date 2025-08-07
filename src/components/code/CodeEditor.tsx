'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { Button } from '../ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Editor from '@monaco-editor/react'
import { selectAllLanguages, selectLanguageById, ProgrammingLanguage } from '../../store/slices/programmingLanguagesSlice'
import CommandLanguageSelector from './CommandLanguageSelector'

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
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [themesLoaded, setThemesLoaded] = useState(false)

  // Get current theme
  const getCurrentTheme = useCallback(() => {
    if (typeof window === 'undefined') return 'code-light'
    const htmlEl = document.documentElement
    const isDark = htmlEl.classList.contains('dark')
    return isDark ? 'code-dark' : 'code-light'
  }, [])

  // Load custom themes
  const loadCustomThemes = useCallback(async (monaco: any) => {
    if (themesLoaded) return
    
    try {
      // Load light theme
      const lightThemeResponse = await fetch('/themes/code-light.json')
      const lightTheme = await lightThemeResponse.json()
      
      // Load dark theme
      const darkThemeResponse = await fetch('/themes/code-dark.json')
      const darkTheme = await darkThemeResponse.json()

      // Define custom themes
      monaco.editor.defineTheme('code-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: lightTheme.colors
      })

      monaco.editor.defineTheme('code-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: darkTheme.colors
      })

      setThemesLoaded(true)
    } catch (error) {
      console.warn('Failed to load custom themes, using defaults:', error)
      // Define fallback themes
      monaco.editor.defineTheme('code-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {}
      })

      monaco.editor.defineTheme('code-dark', {
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
  const handleBeforeMount = useCallback(async (monaco: any) => {
    // Load themes first
    await loadCustomThemes(monaco)
    
    // Set initial theme immediately
    const theme = getCurrentTheme()
    monaco.editor.setTheme(theme)
    
    // Configure Monaco for better TypeScript support
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })
    
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    // Configure diagnostics for other languages
    const configureLanguageDiagnostics = (monaco: any) => {
      const languages = [
        'java', 'python', 'cpp', 'csharp', 'php', 
        'go', 'rust', 'kotlin', 'swift', 'scala', 'ruby'
      ]

      languages.forEach(lang => {
        if (monaco.languages[lang] && monaco.languages[lang][`${lang}Defaults`]) {
          monaco.languages[lang][`${lang}Defaults`].setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
          })
        }
      })
    }

    configureLanguageDiagnostics(monaco)
  }, [loadCustomThemes, getCurrentTheme])

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco
    
    // Apply theme again to ensure it's set
    const theme = getCurrentTheme()
    monaco.editor.setTheme(theme)
    
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
    addCodeSnippets(monaco)

    setIsEditorReady(true)
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
  const addCodeSnippets = useCallback((monaco: any) => {
    // JavaScript/TypeScript snippets
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: () => {
        return {
          suggestions: [
            {
              label: 'console.log',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'console.log(${1:value})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Log a value to the console'
            },
            {
              label: 'function',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'function ${1:functionName}(${2:params}) {',
                '\t${3:// code}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a new function'
            },
            {
              label: 'arrow function',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'const ${1:functionName} = (${2:params}) => {\n\t${3:// code}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create an arrow function'
            },
            {
              label: 'if',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'if (${1:condition}) {',
                '\t${2:// code}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create an if statement'
            },
            {
              label: 'for',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {',
                '\t${3:// code}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a for loop'
            },
            {
              label: 'forEach',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '${1:array}.forEach((${2:item}) => {\n\t${3:// code}\n})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a forEach loop'
            },
            {
              label: 'map',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '${1:array}.map((${2:item}) => {\n\treturn ${3:item}\n})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a map function'
            },
            {
              label: 'filter',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '${1:array}.filter((${2:item}) => {\n\treturn ${3:condition}\n})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a filter function'
            },
            {
              label: 'try-catch',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'try {',
                '\t${1:// code}',
                '} catch (${2:error}) {',
                '\t${3:// handle error}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a try-catch block'
            },
            {
              label: 'async function',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'async function ${1:functionName}(${2:params}) {',
                '\ttry {',
                '\t\t${3:// code}',
                '\t} catch (${4:error}) {',
                '\t\t${5:// handle error}',
                '\t}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create an async function with error handling'
            }
          ]
        }
      }
    })

    // Python snippets
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: () => {
        return {
          suggestions: [
            {
              label: 'print',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'print(${1:value})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Print a value to the console'
            },
            {
              label: 'def',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'def ${1:function_name}(${2:params}):',
                '\t${3:# code}',
                '\tpass'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a new function'
            },
            {
              label: 'if',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'if ${1:condition}:',
                '\t${2:# code}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create an if statement'
            },
            {
              label: 'for',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'for ${1:item} in ${2:iterable}:',
                '\t${3:# code}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a for loop'
            },
            {
              label: 'try-except',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'try:',
                '\t${1:# code}',
                'except ${2:Exception} as ${3:e}:',
                '\t${4:# handle error}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a try-except block'
            },
            {
              label: 'class',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'class ${1:ClassName}:',
                '\tdef __init__(self, ${2:params}):',
                '\t\tself.${3:attribute} = ${4:value}',
                '\t',
                '\tdef ${5:method_name}(self):',
                '\t\t${6:# code}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a new class'
            }
          ]
        }
      }
    })

    // HTML snippets
    monaco.languages.registerCompletionItemProvider('html', {
      provideCompletionItems: () => {
        return {
          suggestions: [
            {
              label: 'html5',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                '<!DOCTYPE html>',
                '<html lang="en">',
                '<head>',
                '\t<meta charset="UTF-8">',
                '\t<meta name="viewport" content="width=device-width, initial-scale=1.0">',
                '\t<title>${1:Document}</title>',
                '</head>',
                '<body>',
                '\t${2}',
                '</body>',
                '</html>'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a basic HTML5 document'
            },
            {
              label: 'div',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '<div>${1}</div>',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a div element'
            },
            {
              label: 'link',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '<link rel="stylesheet" href="${1:style.css}">',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a link element'
            },
            {
              label: 'script',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '<script src="${1:script.js}"></script>',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a script element'
            }
          ]
        }
      }
    })

    // Java snippets
    monaco.languages.registerCompletionItemProvider('java', {
      provideCompletionItems: () => {
        return {
          suggestions: [
            {
              label: 'public class',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'public class ${1:ClassName} {',
                '\tpublic static void main(String[] args) {',
                '\t\t${2:// code}',
                '\t}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a public class with main method'
            },
            {
              label: 'public method',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'public ${1:void} ${2:methodName}(${3:params}) {',
                '\t${4:// code}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a public method'
            },
            {
              label: 'if',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'if (${1:condition}) {',
                '\t${2:// code}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create an if statement'
            },
            {
              label: 'for',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'for (int ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {',
                '\t${3:// code}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a for loop'
            },
            {
              label: 'try-catch',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'try {',
                '\t${1:// code}',
                '} catch (${2:Exception} ${3:e}) {',
                '\t${4:// handle error}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a try-catch block'
            },
            {
              label: 'System.out.println',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'System.out.println(${1:value})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Print a value to the console'
            }
          ]
        }
      }
    })

    // C++ snippets
    monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: () => {
        return {
          suggestions: [
            {
              label: 'main function',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                '#include <iostream>',
                'using namespace std;',
                '',
                'int main() {',
                '\t${1:// code}',
                '\treturn 0;',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a main function with iostream'
            },
            {
              label: 'cout',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'cout << ${1:value} << endl;',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Print a value to the console'
            },
            {
              label: 'if',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'if (${1:condition}) {',
                '\t${2:// code}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create an if statement'
            },
            {
              label: 'for',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'for (int ${1:i} = 0; ${1:i} < ${2:size}; ${1:i}++) {',
                '\t${3:// code}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a for loop'
            }
          ]
        }
      }
    })

    // C# snippets
    monaco.languages.registerCompletionItemProvider('csharp', {
      provideCompletionItems: () => {
        return {
          suggestions: [
            {
              label: 'Console.WriteLine',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'Console.WriteLine(${1:value});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Print a value to the console'
            },
            {
              label: 'public class',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'public class ${1:ClassName}',
                '{',
                '\tpublic static void Main(string[] args)',
                '\t{',
                '\t\t${2:// code}',
                '\t}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a public class with Main method'
            },
            {
              label: 'if',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                'if (${1:condition})',
                '{',
                '\t${2:// code}',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create an if statement'
            }
          ]
        }
      }
    })
  }, [])

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