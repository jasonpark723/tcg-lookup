import { useEffect, useState, useRef } from 'react'
import { fetchSets, CATEGORY_POKEMON_JP, CATEGORY_ONE_PIECE, type TCGSet } from '../lib/api'

// Set filters per category
const SET_FILTERS: Record<number, string[]> = {
  [CATEGORY_POKEMON_JP]: ['Ninja Spinner', 'MEGA Dream', 'Inferno X', 'Mega Symphonia'],
  [CATEGORY_ONE_PIECE]: ['PRB-01', 'PRB-02', 'OP-13', 'EB-03', 'Carrying on his will'],
}

interface SetSelectorProps {
  onSelect: (sets: TCGSet[]) => void
  selectedIds: Set<number>
  categoryId: number
}

export function SetSelector({ onSelect, selectedIds, categoryId }: SetSelectorProps) {
  const [sets, setSets] = useState<TCGSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadSets() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchSets(categoryId)
        // Filter to only include specific sets for this category
        const allowedSets = SET_FILTERS[categoryId] || []
        const filtered = allowedSets.length > 0
          ? data.filter(s =>
              allowedSets.some(name =>
                s.name.toLowerCase().includes(name.toLowerCase()) ||
                s.abbreviation?.toLowerCase().includes(name.toLowerCase())
              )
            )
          : data
        // Sort by release date descending (newest first)
        filtered.sort((a, b) => b.published_on.localeCompare(a.published_on))
        setSets(filtered)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sets')
      }
      setLoading(false)
    }

    loadSets()
  }, [categoryId])

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

  const handleToggle = (set: TCGSet) => {
    const newSelectedIds = new Set(selectedIds)
    if (newSelectedIds.has(set.id)) {
      newSelectedIds.delete(set.id)
    } else {
      newSelectedIds.add(set.id)
    }
    const selectedSets = sets.filter(s => newSelectedIds.has(s.id))
    onSelect(selectedSets)
  }

  const handleSelectAll = () => {
    onSelect([...sets])
  }

  const handleClearAll = () => {
    onSelect([])
  }

  if (loading) {
    return <div className="text-gray-500">Loading sets...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (sets.length === 0) {
    return <div className="text-gray-500">No sets available</div>
  }

  const formatSetName = (set: TCGSet) => {
    if (categoryId === CATEGORY_ONE_PIECE && set.abbreviation) {
      return `[${set.abbreviation}] ${set.name}`
    }
    return set.name
  }

  const displayText = selectedIds.size === 0
    ? 'Select sets...'
    : selectedIds.size === sets.length
      ? 'All sets selected'
      : `${selectedIds.size} set${selectedIds.size > 1 ? 's' : ''} selected`

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <span className={selectedIds.size === 0 ? 'text-gray-500' : ''}>{displayText}</span>
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
          <div className="flex border-b border-gray-200 text-xs sticky top-0 bg-white">
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
          {sets.map(set => (
            <label
              key={set.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(set.id)}
                onChange={() => handleToggle(set)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{formatSetName(set)}</span>
              <span className="text-xs text-gray-400 ml-auto">{set.product_count} cards</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
