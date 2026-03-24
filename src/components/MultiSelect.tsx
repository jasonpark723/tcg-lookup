import { useState, useRef, useEffect } from 'react'

interface MultiSelectProps {
  options: string[]
  selected: Set<string>
  onChange: (selected: Set<string>) => void
  placeholder?: string
}

export function MultiSelect({ options, selected, onChange, placeholder = 'Select...' }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (option: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(option)) {
      newSelected.delete(option)
    } else {
      newSelected.add(option)
    }
    onChange(newSelected)
  }

  const handleSelectAll = () => {
    onChange(new Set(options))
  }

  const handleClearAll = () => {
    onChange(new Set())
  }

  const displayText = selected.size === 0
    ? placeholder
    : selected.size === options.length
      ? 'All selected'
      : `${selected.size} selected`

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm min-w-[140px] text-left flex items-center justify-between gap-2"
      >
        <span className={selected.size === 0 ? 'text-gray-500' : ''}>{displayText}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Select/Clear all buttons */}
          <div className="flex border-b border-gray-200 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex-1 px-3 py-2 text-blue-600 hover:bg-gray-50"
            >
              All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="flex-1 px-3 py-2 text-blue-600 hover:bg-gray-50 border-l border-gray-200"
            >
              Clear
            </button>
          </div>

          {/* Options */}
          {options.map(option => (
            <label
              key={option}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(option)}
                onChange={() => handleToggle(option)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
