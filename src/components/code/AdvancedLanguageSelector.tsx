'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { Badge } from '../ui/badge'
import { selectAllLanguages, selectLanguagesByCategory, ProgrammingLanguage } from '../../store/slices/programmingLanguagesSlice'
import { cn } from '@/lib/utils'
import { ChevronDown, Code, Search } from 'lucide-react'

interface AdvancedLanguageSelectorProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
  showCategories?: boolean
}

const categoryLabels = {
  web: '🌐 Web Development',
  backend: '⚙️ Backend',
  mobile: '📱 Mobile',
  desktop: '💻 Desktop',
  data: '📊 Data',
  other: '🔧 Other'
}

export default function AdvancedLanguageSelector({ 
  value, 
  onValueChange, 
  className,
  showCategories = true
}: AdvancedLanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const programmingLanguages = useSelector(selectAllLanguages)
  const currentLanguage = programmingLanguages.find(lang => lang.id === value) || programmingLanguages[0]

  const languagesByCategory = {
    web: useSelector((state: any) => selectLanguagesByCategory(state, 'web')),
    backend: useSelector((state: any) => selectLanguagesByCategory(state, 'backend')),
    mobile: useSelector((state: any) => selectLanguagesByCategory(state, 'mobile')),
    desktop: useSelector((state: any) => selectLanguagesByCategory(state, 'desktop')),
    data: useSelector((state: any) => selectLanguagesByCategory(state, 'data')),
    other: useSelector((state: any) => selectLanguagesByCategory(state, 'other'))
  }

  // Filter languages based on search
  const filteredLanguages = programmingLanguages.filter(lang => 
    lang.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
    lang.description.toLowerCase().includes(searchValue.toLowerCase()) ||
    lang.category.toLowerCase().includes(searchValue.toLowerCase())
  )

  // Group filtered languages by category
  const filteredLanguagesByCategory = Object.entries(languagesByCategory).reduce((acc, [category, languages]) => {
    const filtered = languages.filter(lang => 
      lang.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
      lang.description.toLowerCase().includes(searchValue.toLowerCase()) ||
      lang.category.toLowerCase().includes(searchValue.toLowerCase())
    )
    if (filtered.length > 0) {
      acc[category] = filtered
    }
    return acc
  }, {} as Record<string, ProgrammingLanguage[]>)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={open}
          className={cn("justify-between text-xs h-8 w-48", className)}
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
                <span>Select language...</span>
              </>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Search programming languages..." 
              value={searchValue}
              onValueChange={setSearchValue}
              className="border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              <div className="p-4 text-center">
                <Code className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No language found.</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term.</p>
              </div>
            </CommandEmpty>
            
            {showCategories ? (
              // Categorized view
              Object.entries(filteredLanguagesByCategory).map(([category, languages]) => (
                <CommandGroup key={category} heading={categoryLabels[category as keyof typeof categoryLabels]}>
                  {languages.map((lang: ProgrammingLanguage) => (
                    <CommandItem
                      key={lang.id}
                      value={`${lang.displayName} ${lang.description} ${lang.category}`}
                      onSelect={() => {
                        onValueChange(lang.id)
                        setOpen(false)
                        setSearchValue('')
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-lg">{lang.icon}</span>
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{lang.displayName}</span>
                        <span className="text-xs text-muted-foreground">{lang.description}</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ backgroundColor: lang.color + '20', color: lang.color }}
                      >
                        {lang.category}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            ) : (
              // Simple list view
              <CommandGroup>
                {filteredLanguages.map((lang: ProgrammingLanguage) => (
                  <CommandItem
                    key={lang.id}
                    value={`${lang.displayName} ${lang.description} ${lang.category}`}
                    onSelect={() => {
                      onValueChange(lang.id)
                      setOpen(false)
                      setSearchValue('')
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
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 