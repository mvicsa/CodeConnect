'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { Code, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROGRAMMING_LANGUAGES } from '../../constants/programmingLanguages'

interface LanguageSelectorProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export default function LanguageSelector({ 
  value, 
  onValueChange, 
  className
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const currentLanguage = PROGRAMMING_LANGUAGES.find(lang => lang.id === value) || PROGRAMMING_LANGUAGES[0]

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
              {PROGRAMMING_LANGUAGES.map((lang) => (
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
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 