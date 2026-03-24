import { useEffect, useState } from 'react'
import { fetchSets, CATEGORY_POKEMON_JP, CATEGORY_ONE_PIECE, type TCGSet } from '../lib/api'

// Set filters per category
const SET_FILTERS: Record<number, string[]> = {
  [CATEGORY_POKEMON_JP]: ['Ninja Spinner', 'MEGA Dream', 'Inferno X', 'Mega Symphonia'],
  [CATEGORY_ONE_PIECE]: ['PRB-01', 'PRB-02', 'OP-13', 'EB-03', 'Carrying on his will'],
}

interface SetSelectorProps {
  onSelect: (set: TCGSet | null) => void
  selectedId?: number
  categoryId: number
}

export function SetSelector({ onSelect, selectedId, categoryId }: SetSelectorProps) {
  const [sets, setSets] = useState<TCGSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (!id) {
      onSelect(null)
      return
    }
    const selected = sets.find(s => s.id === Number(id))
    onSelect(selected || null)
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
      return `[${set.abbreviation}] ${set.name} (${set.product_count} cards)`
    }
    return `${set.name} (${set.product_count} cards)`
  }

  return (
    <div className="w-full max-w-md">
      <select
        value={selectedId || ''}
        onChange={handleChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="">Select a set...</option>
        {sets.map(set => (
          <option key={set.id} value={set.id}>
            {formatSetName(set)}
          </option>
        ))}
      </select>
    </div>
  )
}
