'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { X, Send, Code, Edit } from 'lucide-react'
import CodeEditor from '@/components/code/CodeEditor'
import { useSelector } from 'react-redux'
import { selectAllLanguages } from '@/store/slices/programmingLanguagesSlice'
import { RootState } from '@/store/store'
import { Message, MessageType } from '@/types/chat'

interface EditMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (updates: { content?: string; codeData?: { code: string; language: string } | null; type?: MessageType }) => void
  message: Message | null
}

export default function EditMessageModal({
  isOpen,
  onClose,
  onSave,
  message
}: EditMessageModalProps) {
  const [text, setText] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  
  const programmingLanguages = useSelector(selectAllLanguages)
  const defaultLanguage = programmingLanguages.find(lang => lang.id === 'javascript')

  // Update state when modal opens with message data
  useEffect(() => {
    if (isOpen && message) {
      setText(message.content || '')
      
      if (message.type === MessageType.CODE && message.codeData) {
        setCode(message.codeData.code || '')
        setLanguage(message.codeData.language || 'javascript')
        setShowCodeEditor(true)
      } else {
        setCode('')
        setLanguage('javascript')
        setShowCodeEditor(false)
      }
    }
  }, [isOpen, message])

  const handleSave = () => {
    if (!message) return

    const trimmedText = text.trim()
    const trimmedCode = code.trim()
    const includeCode = showCodeEditor && trimmedCode.length > 0

    // Disallow empty updates: require either text or code
    if (!trimmedText && !includeCode) return

    const updates: { content?: string; codeData?: { code: string; language: string } | null; type?: MessageType } = {}

    // Always include content (even empty string) so clearing text removes it
    updates.content = trimmedText

    // Determine codeData and potential type change
    if (includeCode) {
      updates.codeData = { code: trimmedCode, language }
      if (message.type !== MessageType.CODE) {
        updates.type = MessageType.CODE
      }
    } else {
      // No code included. If the original message was CODE, explicitly remove code and flip type to TEXT
      if (message.type === MessageType.CODE) {
        updates.codeData = null
        updates.type = MessageType.TEXT
      }
    }

    onSave(updates)
    handleClose()
  }

  const handleClose = () => {
    setText('')
    setCode('')
    setLanguage('javascript')
    setShowCodeEditor(false)
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

  const getModalTitle = () => {
    if (!message) return 'Edit Message'
    return message.type === MessageType.CODE ? 'Edit Code Message' : 'Edit Message'
  }

  const getIcon = () => {
    if (!message) return <Edit className="h-5 w-5" />
    return message.type === MessageType.CODE ? <Code className="h-5 w-5" /> : <Edit className="h-5 w-5" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Text Input */}
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Edit your message..."
              className="resize-none min-h-[80px] max-h-[200px]"
              autoComplete='off'
            />
          </div>

          {/* Code Toggle - Only show for text messages or when editing code */}
          {(!message || message.type === MessageType.TEXT || message.type === MessageType.CODE) && (
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
          )}

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
            onClick={handleSave}
            disabled={(text.trim().length === 0 && !(showCodeEditor && code.trim().length > 0)) || (showCodeEditor && !language)}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

