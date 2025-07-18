'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Code, Send } from 'lucide-react'
import CodeEditor from '../code/CodeEditor'

interface CommentEditorProps {
  initialValue?: { text: string, code: string, codeLang: string }
  onSubmit: (content: { text: string, code: string, codeLang: string }) => void
  placeholder?: string
  showCodeToggle?: boolean
}

export default function CommentEditor({
  initialValue = { text: '', code: '', codeLang: '' },
  onSubmit,
  placeholder = "Write a comment...",
  showCodeToggle = true
}: CommentEditorProps) {
  const [content, setContent] = useState({
    text: initialValue.text || '',
    code: initialValue.code || '',
    codeLang: initialValue.codeLang || 'javascript'
  })
  const [showCodeEditor, setShowCodeEditor] = useState(!!initialValue.code)
  const [codeLanguage, setCodeLanguage] = useState(initialValue.codeLang || 'javascript')
  const [syntaxError, setSyntaxError] = useState<string | null>(null)

  // Update content when initialValue changes
  useEffect(() => {
    setContent({
      text: initialValue.text || '',
      code: initialValue.code || '',
      codeLang: initialValue.codeLang || 'javascript'
    })
    setShowCodeEditor(!!initialValue.code)
    setCodeLanguage(initialValue.codeLang || 'javascript')
  }, [initialValue])

  const handleSubmit = () => {
    if (!content.text.trim() && (!content.code || !content.code.trim())) return
    
    // Don't submit if there's a syntax error
    if (syntaxError) {
      return;
    }
    
    // Clean up empty code blocks
    const cleanContent = {
      text: content.text.trim(),
      code: content.code && content.code.trim() ? content.code.trim() : '',
      codeLang: content.codeLang || 'javascript'
    }
    onSubmit(cleanContent)
    setContent({ text: '', code: '', codeLang: 'javascript' })
    setShowCodeEditor(false)
    setSyntaxError(null)
  }

  const handleAddCode = () => {
    setShowCodeEditor(true)
    setContent(prev => ({
      ...prev,
      code: '',
      codeLang: 'javascript'
    }))
    setSyntaxError(null)
  }

  const handleRemoveCode = () => {
    setShowCodeEditor(false)
    setContent(prev => ({ ...prev, code: '' }))
    setSyntaxError(null)
  }

  const updateCode = (code: string) => {
    setContent(prev => ({
      ...prev,
      code: code,
      codeLang: codeLanguage
    }))
  }

  const updateLanguage = (language: string) => {
    setCodeLanguage(language)
    setContent(prev => ({
      ...prev,
      codeLang: language
    }))
  }

  const handleCodeError = (error: string | null) => {
    setSyntaxError(error);
  }

  return (
    <div className="border-0 shadow-none">
        {/* Text Editor */}
        <div className="relative">
          <Textarea
            value={content.text}
            onChange={(e) => setContent(prev => ({ ...prev, text: e.target.value }))}
            placeholder={placeholder}
            className="resize-none pe-20 min-h-[80px]"
          />
          <div className="absolute bottom-3 end-3 flex gap-2">
            {showCodeToggle && !showCodeEditor && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddCode}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <Code className="size-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              className="h-8 w-8 p-0"
              disabled={(!content.text.trim() && (!content.code || !content.code.trim())) || !!syntaxError}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>

        {/* Code Editor */}
        {showCodeEditor && (
          <CodeEditor
            value={content.code || ''}
            onChange={updateCode}
            language={content.codeLang || codeLanguage}
            onLanguageChange={updateLanguage}
            onRemove={handleRemoveCode}
            onError={handleCodeError}
            rows={5}
          />
        )}
    </div>
  )
} 