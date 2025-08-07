'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Code } from 'lucide-react'

interface CommandLanguageSelectorProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

// Languages list
const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '🟨' },
  { id: 'typescript', name: 'TypeScript', icon: '🔵' },
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'html', name: 'HTML', icon: '🌐' },
  { id: 'css', name: 'CSS', icon: '🎨' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'cpp', name: 'C++', icon: '⚡' },
  { id: 'csharp', name: 'C#', icon: '💜' },
  { id: 'php', name: 'PHP', icon: '🐘' },
  { id: 'go', name: 'Go', icon: '🔵' },
  { id: 'rust', name: 'Rust', icon: '🦀' },
  { id: 'swift', name: 'Swift', icon: '🍎' },
  { id: 'kotlin', name: 'Kotlin', icon: '🟠' },
  { id: 'ruby', name: 'Ruby', icon: '💎' },
  { id: 'scala', name: 'Scala', icon: '🔴' },
  { id: 'bash', name: 'Bash', icon: '💻' },
  { id: 'markdown', name: 'Markdown', icon: '📝' }
]

export default function CommandLanguageSelector({ 
  value, 
  onValueChange, 
  className
}: CommandLanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const currentLanguage = LANGUAGES.find(lang => lang.id === value) || LANGUAGES[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-36 justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{currentLanguage.icon}</span>
            <span className="truncate">{currentLanguage.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search language..." />
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
                >
                  <span className="text-lg mr-2">{lang.icon}</span>
                  {lang.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === lang.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 