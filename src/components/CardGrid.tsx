import { useState } from 'react'
import type { Card } from '../lib/api'

interface CardGridProps {
  cards: Card[]
  maskBottom?: boolean
}

export function CardGrid({ cards, maskBottom = false }: CardGridProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A'
    return `$${price.toFixed(2)}`
  }

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            {/* Card Image */}
            <div className="relative aspect-[3/4] bg-gray-100">
              {card.image_url ? (
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-2 text-center">
                  {card.name}
                </div>
              )}
              {/* Bottom mask for One Piece cards */}
              {maskBottom && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-12"
                  style={{
                    background: 'linear-gradient(to bottom, transparent 0%, #1f2937 30%, #1f2937 100%)'
                  }}
                />
              )}
            </div>

            {/* Card Info */}
            <div className="p-2">
              <div className="text-xs font-medium text-gray-900 truncate" title={card.name}>
                {card.name}
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">#{card.card_number}</span>
                <span className="text-xs font-semibold text-green-600">
                  {formatPrice(card.price)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {card.rarity && (
                  <span className="inline-block px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">
                    {card.rarity}
                  </span>
                )}
                {card.set_name && (
                  <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] truncate max-w-full" title={card.set_name}>
                    {card.set_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for selected card */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Large Card Image */}
            <div className="relative aspect-[3/4] bg-gray-100">
              {selectedCard.image_url ? (
                <img
                  src={selectedCard.image_url}
                  alt={selectedCard.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>

            {/* Card Details */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900">{selectedCard.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-500">#{selectedCard.card_number}</span>
                {selectedCard.rarity && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-sm">
                    {selectedCard.rarity}
                  </span>
                )}
                {selectedCard.set_name && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">
                    {selectedCard.set_name}
                  </span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">Market Price</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(selectedCard.price)}
                </div>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="mt-4 w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
