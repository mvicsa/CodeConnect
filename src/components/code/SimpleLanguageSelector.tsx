'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { cn } from '@/lib/utils'
import { ChevronDown, Code } from 'lucide-react'

interface SimpleLanguageSelectorProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

// Simple languages list
const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '🟨', color: '#f7df1e' },
  { id: 'typescript', name: 'TypeScript', icon: '🔵', color: '#3178c6' },
  { id: 'python', name: 'Python', icon: '🐍', color: '#3776ab' },
  { id: 'html', name: 'HTML', icon: '🌐', color: '#e34f26' },
  { id: 'css', name: 'CSS', icon: '🎨', color: '#1572b6' },
  { id: 'java', name: 'Java', icon: '☕', color: '#007396' },
  { id: 'cpp', name: 'C++', icon: '⚡', color: '#00599c' },
  { id: 'csharp', name: 'C#', icon: '💜', color: '#68217a' },
  { id: 'php', name: 'PHP', icon: '🐘', color: '#777bb4' },
  { id: 'go', name: 'Go', icon: '🔵', color: '#00add8' },
  { id: 'rust', name: 'Rust', icon: '🦀', color: '#ce422b' },
  { id: 'swift', name: 'Swift', icon: '🍎', color: '#ff6b35' },
  { id: 'kotlin', name: 'Kotlin', icon: '🟠', color: '#f18e33' },
  { id: 'ruby', name: 'Ruby', icon: '💎', color: '#cc342d' },
  { id: 'scala', name: 'Scala', icon: '🔴', color: '#dc322f' },
  { id: 'bash', name: 'Bash', icon: '💻', color: '#4eaa25' },
  { id: 'markdown', name: 'Markdown', icon: '📝', color: '#000000' }
]

export default function SimpleLanguageSelector({ 
  value, 
  onValueChange, 
  className
}: SimpleLanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const currentLanguage = LANGUAGES.find(lang => lang.id === value) || LANGUAGES[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={open}
          className={cn("justify-between text-xs h-8 w-36", className)}
        >
          <div className="flex items-center gap-2">
            {currentLanguage ? (
              <>
                <span className="text-sm">{currentLanguage.icon}</span>
                <span className="font-medium truncate">{currentLanguage.name}</span>
              </>
            ) : (
              <>
                <Code className="h-4 w-4" />
                <span>Language</span>
              </>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search languages..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {LANGUAGES.map((lang) => (
                <CommandItem
                  key={lang.id}
                  value={lang.name}
                  onSelect={() => {
                    onValueChange(lang.id)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-lg">{lang.icon}</span>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{lang.name}</span>
                  </div>
                  <span 
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: lang.color + '20', color: lang.color }}
                  >
                    {lang.id}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 