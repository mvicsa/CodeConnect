'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { createHighlighter } from 'shiki'
import { Copy, Check } from 'lucide-react'
import { Button } from './ui/button'

interface CodeBlockProps {
  code: string
  language?: string
  showCopyButton?: boolean
  className?: string
}

const CodeBlock = memo(function CodeBlock({
  code,
  language = 'javascript',
  showCopyButton = true,
  className = ''
}: CodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState('')
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [copied, setCopied] = useState(false)
  const highlighterRef = useRef<any>(null)

  // Highlight code with caching
  const highlightCode = useCallback(async (code: string, lang: string) => {
    if (!code.trim()) {
      setHighlightedHtml('')
      return
    }

    setIsHighlighting(true)
    try {
      const htmlEl = document.documentElement
      const isDark = htmlEl.classList.contains('dark')
      const themeName = isDark ? 'code-dark' : 'code-light'

      // Check if we need to create a new highlighter (language or theme changed)
      const needsNewHighlighter = !highlighterRef.current || 
        !highlighterRef.current.getLoadedLanguages().includes(lang) ||
        !highlighterRef.current.getLoadedThemes().includes(themeName)

      if (needsNewHighlighter) {
        // Dispose old highlighter if it exists
        if (highlighterRef.current) {
          highlighterRef.current.dispose()
        }

        const themePath = `/themes/${themeName}.json`
        const customTheme = await fetch(themePath).then((res) => res.json())

        highlighterRef.current = await createHighlighter({
          langs: [lang || 'javascript'],
          themes: [{ name: themeName, ...customTheme }],
        })
      }

      const html = highlighterRef.current.codeToHtml(code, {
        lang: lang || 'javascript',
        theme: themeName,
      })

      setHighlightedHtml(html)
    } catch (error) {
      console.error('Failed to highlight code:', error)
      setHighlightedHtml('')
    } finally {
      setIsHighlighting(false)
    }
  }, [])

  // Highlight when code or language changes
  useEffect(() => {
    highlightCode(code, language)
  }, [code, language, highlightCode])

  // Watch for theme changes
  useEffect(() => {
    const htmlEl = document.documentElement
    const observer = new MutationObserver(() => {
      if (code.trim()) {
        highlightCode(code, language)
      }
    })

    observer.observe(htmlEl, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [code, language, highlightCode])

  // Cleanup highlighter on unmount
  useEffect(() => {
    return () => {
      if (highlighterRef.current) {
        highlighterRef.current.dispose()
      }
    }
  }, [])

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  return (
    // get color background from themes code-dark.json and code-light.json
    <div className={`relative rounded-lg overflow-hidden bg-[#f8f8f8] dark:bg-background ${className}`} dir="ltr">
      {/* Code content */}
      {/* show copy button on container hover */}
      <div className="relative pt-4 group">
        <span className="text-xs text-muted-foreground uppercase absolute top-2 left-2 select-none">
          {language}
        </span>

        {showCopyButton && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-6 w-6 p-0 hover:bg-background absolute top-2 right-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? (
              <Check className="size-3 text-primary" />
            ) : (
              <Copy className="size-3" />
            )}
          </Button>
        )}
        <pre className="text-sm p-4 overflow-x-auto overflow-y-auto">
          <code
            className="block"
            dangerouslySetInnerHTML={{ __html: highlightedHtml || code }}
          />
        </pre>

        {/* Show highlighting status */}
        {isHighlighting && (
          <div className="absolute top-2 right-2">
            <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              Highlighting...
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default CodeBlock 