import { useEffect, useMemo, useState } from 'react'
import { GameSelector } from '../components/GameSelector'
import { SetSelector } from '../components/SetSelector'
import { FlashCard } from '../components/FlashCard'
import { MultiSelect } from '../components/MultiSelect'
import { fetchCardsWithPricing, CATEGORY_POKEMON_JP, CATEGORY_ONE_PIECE, type TCGSet, type Card } from '../lib/api'

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Pokemon card rarity order (common to rare)
const POKEMON_RARITY_ORDER: Record<string, number> = {
  'Common': 1,
  'Uncommon': 2,
  'Rare': 3,
  'Double Rare': 4,
  'Art Rare': 5,
  'Super Rare': 6,
  'Mega Attack Rare': 7,
  'Special Art Rare': 8,
  'Mega Ultra Rare': 9,
}

// One Piece card rarity order (common to rare)
const ONE_PIECE_RARITY_ORDER: Record<string, number> = {
  'C': 1,
  'UC': 2,
  'R': 3,
  'SR': 4,
  'L': 5,
  'SEC': 6,
  'DON!!': 7,
  'TR': 8,
}

// Rarity orders by category
const RARITY_ORDERS: Record<number, Record<string, number>> = {
  [CATEGORY_POKEMON_JP]: POKEMON_RARITY_ORDER,
  [CATEGORY_ONE_PIECE]: ONE_PIECE_RARITY_ORDER,
}

// Default excluded rarities by category
const DEFAULT_EXCLUDED_RARITIES: Record<number, string[]> = {
  [CATEGORY_POKEMON_JP]: ['Common', 'Uncommon', 'Rare'],
  [CATEGORY_ONE_PIECE]: ['C', 'UC', 'R'],
}

function sortByRarity(rarities: string[], categoryId: number): string[] {
  const rarityOrder = RARITY_ORDERS[categoryId] || {}
  return [...rarities].sort((a, b) => {
    const orderA = rarityOrder[a] ?? 999
    const orderB = rarityOrder[b] ?? 999
    return orderA - orderB
  })
}

type SortOption = 'number' | 'price-asc' | 'price-desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'number', label: 'Card #' },
  { value: 'price-asc', label: 'Price (Low)' },
  { value: 'price-desc', label: 'Price (High)' },
]

export function Study() {
  const [categoryId, setCategoryId] = useState(CATEGORY_POKEMON_JP)
  const [selectedSet, setSelectedSet] = useState<TCGSet | null>(null)
  const [allCards, setAllCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set())
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('number')

  // Shuffle state - stores the order as array of indices
  const [shuffledOrder, setShuffledOrder] = useState<number[] | null>(null)

  useEffect(() => {
    if (!selectedSet) {
      return
    }

    const setId = selectedSet.id
    let cancelled = false

    async function loadCards() {
      setLoading(true)
      setError(null)
      try {
        const cardList = await fetchCardsWithPricing(setId, categoryId)
        if (cancelled) return
        setAllCards(cardList)
        setCurrentIndex(0)
        // Reset filters when set changes - select all rarities except defaults for this game
        const excludeByDefault = DEFAULT_EXCLUDED_RARITIES[categoryId] || []
        const rarities = new Set<string>()
        for (const card of cardList) {
          if (card.rarity && !excludeByDefault.includes(card.rarity)) {
            rarities.add(card.rarity)
          }
        }
        setSelectedRarities(rarities)
        setMinPrice('')
        setMaxPrice('')
        setSortBy('number')
        setShuffledOrder(null)
      } catch (err) {
        if (cancelled) return
        console.error('Error fetching cards:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch cards')
      }
      setLoading(false)
    }

    loadCards()

    return () => {
      cancelled = true
    }
  }, [selectedSet, categoryId])

  // Get unique rarities from cards, sorted by rarity order
  const availableRarities = useMemo(() => {
    const rarities = new Set<string>()
    for (const card of allCards) {
      if (card.rarity) {
        rarities.add(card.rarity)
      }
    }
    return sortByRarity(Array.from(rarities), categoryId)
  }, [allCards, categoryId])

  // Apply filters and sorting (without shuffle)
  const filteredCards = useMemo(() => {
    let result = allCards

    // Filter by rarity (if any selected)
    if (selectedRarities.size > 0) {
      result = result.filter(c => c.rarity && selectedRarities.has(c.rarity))
    }

    // Filter by min price
    const min = parseFloat(minPrice)
    if (!isNaN(min)) {
      result = result.filter(c => c.price !== null && c.price >= min)
    }

    // Filter by max price
    const max = parseFloat(maxPrice)
    if (!isNaN(max)) {
      result = result.filter(c => c.price !== null && c.price <= max)
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.price ?? 0) - (b.price ?? 0)
        case 'price-desc':
          return (b.price ?? 0) - (a.price ?? 0)
        case 'number':
        default:
          return (a.card_number ?? '').localeCompare(b.card_number ?? '', undefined, { numeric: true })
      }
    })

    return result
  }, [allCards, selectedRarities, minPrice, maxPrice, sortBy])

  // Apply shuffle order to filtered cards
  const displayCards = useMemo(() => {
    if (!shuffledOrder) return filteredCards

    // Map shuffled indices to filtered cards
    const validIndices = shuffledOrder.filter(i => i < filteredCards.length)
    return validIndices.map(i => filteredCards[i])
  }, [filteredCards, shuffledOrder])

  const handleRarityChange = (selected: Set<string>) => {
    setSelectedRarities(selected)
    setCurrentIndex(0)
  }

  const handleMinPriceChange = (value: string) => {
    setMinPrice(value)
    setCurrentIndex(0)
  }

  const handleMaxPriceChange = (value: string) => {
    setMaxPrice(value)
    setCurrentIndex(0)
  }

  const handleSetSelect = (set: TCGSet | null) => {
    setSelectedSet(set)
    if (!set) {
      setAllCards([])
      setCurrentIndex(0)
    }
  }

  const handleGameChange = (newCategoryId: number) => {
    setCategoryId(newCategoryId)
    setSelectedSet(null)
    setAllCards([])
    setCurrentIndex(0)
    setSelectedRarities(new Set())
    setMinPrice('')
    setMaxPrice('')
    setSortBy('number')
    setShuffledOrder(null)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption)
    setCurrentIndex(0)
    setShuffledOrder(null)
  }

  const currentCard = displayCards[currentIndex]

  const handleNext = () => {
    if (currentIndex < displayCards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setCurrentIndex(0)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else {
      setCurrentIndex(displayCards.length - 1)
    }
  }

  const handleShuffle = () => {
    if (shuffledOrder) {
      // Turn off shuffle
      setShuffledOrder(null)
    } else {
      // Create shuffled order
      const indices = Array.from({ length: filteredCards.length }, (_, i) => i)
      setShuffledOrder(shuffleArray(indices))
    }
    setCurrentIndex(0)
  }

  const isShuffled = shuffledOrder !== null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-2">
          TCG Crash Course
        </h1>

        {/* Game selector */}
        <div className="flex justify-center mb-4">
          <GameSelector
            selectedCategoryId={categoryId}
            onChange={handleGameChange}
          />
        </div>

        {/* Set selector */}
        <div className="flex justify-center mb-6">
          <SetSelector
            selectedId={selectedSet?.id}
            onSelect={handleSetSelect}
            categoryId={categoryId}
          />
        </div>

        {selectedSet && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {/* Rarity filter */}
              <MultiSelect
                options={availableRarities}
                selected={selectedRarities}
                onChange={handleRarityChange}
                placeholder="All Rarities"
              />

              {/* Price filters */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min $"
                  value={minPrice}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="0"
                  step="0.01"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={maxPrice}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mb-1">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleShuffle}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isShuffled
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {isShuffled ? 'Shuffled' : 'Shuffle'}
              </button>
              <button
                onClick={() => setCurrentIndex(0)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 mb-1 text-sm text-gray-600">
              {selectedSet.published_on && (
                <span>Released: {selectedSet.published_on}</span>
              )}
            </div>

            {loading ? (
              <div className="text-center text-gray-500">Loading cards...</div>
            ) : error ? (
              <div className="text-center text-red-500">Error: {error}</div>
            ) : displayCards.length === 0 ? (
              <div className="text-center text-gray-500">No cards match filters</div>
            ) : (
              <div className="flex justify-center">
                <FlashCard
                  card={currentCard}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  hasNext={displayCards.length > 1}
                  hasPrevious={displayCards.length > 1}
                  currentIndex={currentIndex}
                  totalCards={displayCards.length}
                  maskBottom={categoryId === CATEGORY_ONE_PIECE}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
