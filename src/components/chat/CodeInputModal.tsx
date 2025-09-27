'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { X, Send, Code } from 'lucide-react'
import CodeEditor from '@/components/code/CodeEditor'
import { useSelector } from 'react-redux'
import { selectAllLanguages } from '@/store/slices/programmingLanguagesSlice'
import { RootState } from '@/store/store'

interface CodeInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (text: string, code: string, language: string) => void
  replyTo?: any
  initialCode?: string
  initialLanguage?: string
  initialText?: string
}

export default function CodeInputModal({
  isOpen,
  onClose,
  onSend,
  replyTo,
  initialCode = '',
  initialLanguage = 'javascript',
  initialText = ''
}: CodeInputModalProps) {
  const [text, setText] = useState(initialText)
  const [code, setCode] = useState(initialCode)
  const [language, setLanguage] = useState(initialLanguage)
  const [showCodeEditor, setShowCodeEditor] = useState(!!initialCode)
  
  const programmingLanguages = useSelector(selectAllLanguages)
  const defaultLanguage = programmingLanguages.find(lang => lang.id === 'javascript')

  // Update state when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setText(initialText)
      setCode(initialCode)
      setLanguage(initialLanguage)
      setShowCodeEditor(!!initialCode)
    }
  }, [isOpen, initialText, initialCode, initialLanguage])

  const handleSend = () => {
    if ((!text.trim() && !code.trim()) || !language) return
    
    onSend(text.trim(), code.trim(), language)
    setText('')
    setCode('')
    setLanguage('javascript')
    onClose()
  }

  const handleClose = () => {
    setText('')
    setCode('')
    setLanguage('javascript')
    onClose()
  }

  const handleAddCode = () => {
    setShowCodeEditor(true)
  }

  const handleRemoveCode = () => {
    setShowCodeEditor(false)
    setCode('')
    setLanguage('javascript')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Send Code Message
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Reply Preview */}
          {replyTo && (
            <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary">
              <p className="text-sm text-muted-foreground mb-1">Replying to:</p>
              <p className="text-sm">{replyTo.content}</p>
            </div>
          )}

          {/* Text Input */}
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a message (optional)..."
              className="resize-none min-h-[80px] max-h-[200px]"
              autoComplete='off'
            />
          </div>

          {/* Code Toggle */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCode}
              className={`flex items-center gap-2 ${showCodeEditor ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <Code className="size-4" />
              Code
            </Button>
          </div>

          {/* Code Editor */}
          {showCodeEditor && (
            <div className="border rounded-lg p-4 dark:bg-accent">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                onLanguageChange={setLanguage}
                onRemove={handleRemoveCode}
                height="300px"
                showRemoveButton={true}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={(!text.trim() && !code.trim()) || !language}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
