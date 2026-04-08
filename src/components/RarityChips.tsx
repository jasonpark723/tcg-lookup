interface RarityChipsProps {
  options: string[]
  selected: Set<string>
  onChange: (selected: Set<string>) => void
}

export function RarityChips({ options, selected, onChange }: RarityChipsProps) {
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

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {/* Quick actions */}
      <button
        type="button"
        onClick={handleSelectAll}
        className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        All
      </button>
      <button
        type="button"
        onClick={handleClearAll}
        className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        Clear
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 self-center mx-1" />

      {/* Rarity chips */}
      {options.map(option => {
        const isSelected = selected.has(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => handleToggle(option)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-blue-500 text-white border border-blue-500'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
