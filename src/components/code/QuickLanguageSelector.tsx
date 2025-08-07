'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { selectAllLanguages, ProgrammingLanguage } from '../../store/slices/programmingLanguagesSlice'
import { cn } from '@/lib/utils'
import { ChevronDown, Code } from 'lucide-react'

interface QuickLanguageSelectorProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export default function QuickLanguageSelector({ 
  value, 
  onValueChange, 
  className
}: QuickLanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const programmingLanguages = useSelector(selectAllLanguages)
  const currentLanguage = programmingLanguages.find(lang => lang.id === value) || programmingLanguages[0]

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
                <span className="font-medium truncate">{currentLanguage.displayName}</span>
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
              {programmingLanguages.map((lang: ProgrammingLanguage) => (
                <CommandItem
                  key={lang.id}
                  value={`${lang.displayName} ${lang.description} ${lang.category}`}
                  onSelect={() => {
                    onValueChange(lang.id)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-lg">{lang.icon}</span>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{lang.displayName}</span>
                    <span className="text-xs text-muted-foreground">{lang.description}</span>
                  </div>
                  <span 
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: lang.color + '20', color: lang.color }}
                  >
                    {lang.category}
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