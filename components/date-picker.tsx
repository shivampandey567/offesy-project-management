// components/ui/due-date-picker.tsx
'use client'

import { useState } from 'react'
import { CalendarPlus, CalendarIcon } from 'lucide-react'
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'

type DueDatePickerProps = {
    value?: Date
    onChange: (date: Date | undefined) => void
    outline?: boolean
}

const formatLabel = (date: Date) => {
    const isDifferentYear = date.getFullYear() !== new Date().getFullYear()
    return isDifferentYear
        ? date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
}

const getPresets = () => {
    const now = new Date()

    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)

    const endOfWeek = new Date(now)
    const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7
    endOfWeek.setDate(now.getDate() + daysUntilFriday)

    const inOneWeek = new Date(now)
    inOneWeek.setDate(now.getDate() + 7)

    return [
        { label: 'Tomorrow', date: tomorrow },
        { label: 'End of this week', date: endOfWeek },
        { label: 'In one week', date: inOneWeek },
    ]
}

// very small natural-language parser for the search box
const parseInput = (input: string): Date | null => {
    const trimmed = input.trim().toLowerCase()
    if (!trimmed) return null

    const now = new Date()

    const hoursMatch = trimmed.match(/^(\d+)\s*h(ours?)?$/)
    if (hoursMatch) {
        const d = new Date(now)
        d.setHours(d.getHours() + parseInt(hoursMatch[1], 10))
        return d
    }

    const daysMatch = trimmed.match(/^(\d+)\s*d(ays?)?$/)
    if (daysMatch) {
        const d = new Date(now)
        d.setDate(d.getDate() + parseInt(daysMatch[1], 10))
        return d
    }

    // "Feb 9", "feb 9", "9 feb" etc — fall back to native Date parsing
    const parsed = new Date(`${trimmed} ${now.getFullYear()}`)
    if (!isNaN(parsed.getTime())) return parsed

    return null
}

export function DueDatePicker({ value, onChange, outline = true }: DueDatePickerProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [showCalendar, setShowCalendar] = useState(false)

    const presets = getPresets()
    const parsedFromSearch = parseInput(search)

    const handleSelect = (date: Date) => {
        onChange(date)
        setOpen(false)
        setShowCalendar(false)
        setSearch('')
    }

    return (
        <Popover
            open={open}
            onOpenChange={(o) => {
                setOpen(o)
                if (!o) {
                    setShowCalendar(false)
                    setSearch('')
                }
            }}
        >
            <PopoverTrigger asChild>
                {outline ? (
                    <Button variant='outline' size="sm" className="rounded-full w-fit text-accent-foreground">
                        <CalendarPlus />
                        {value ? formatLabel(value) : 'Due date'}
                    </Button>
                ) : (
                    !outline &&
                    <Button variant='ghost' size="sm" className="rounded-full w-fit text-accent-foreground">
                        <CalendarPlus />
                        {value ? formatLabel(value) : 'Due date'}
                    </Button>
                )}
            </PopoverTrigger>

            <PopoverContent className="w-72 p-0" align="start">
                {showCalendar ? (
                    <Calendar
                        className='mx-auto'
                        mode="single"
                        selected={value}
                        onSelect={(date) => date && handleSelect(date)}
                        initialFocus
                    />
                ) : (
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Try: 24h, 7 days, Feb 9"
                            value={search}
                            onValueChange={setSearch}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && parsedFromSearch) {
                                    handleSelect(parsedFromSearch)
                                }
                            }}
                        />
                        <CommandList>
                            <CommandGroup>
                                <CommandItem
                                    onSelect={() => setShowCalendar(true)}
                                    className="font-medium"
                                >
                                    <CalendarIcon size={14} />
                                    Custom...
                                </CommandItem>

                                {search && parsedFromSearch && (
                                    <CommandItem onSelect={() => handleSelect(parsedFromSearch)}>
                                        <CalendarIcon size={14} />
                                        {formatLabel(parsedFromSearch)}
                                    </CommandItem>
                                )}

                                {!search &&
                                    presets.map((p) => (
                                        <CommandItem
                                            key={p.label}
                                            onSelect={() => handleSelect(p.date)}
                                            className="flex justify-between"
                                        >
                                            <span className="flex items-center gap-2">
                                                <CalendarIcon size={14} />
                                                {p.label}
                                            </span>
                                            <span className="text-accent-foreground text-sm">
                                                {formatLabel(p.date)}
                                            </span>
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                )}
            </PopoverContent>
        </Popover>
    )
}