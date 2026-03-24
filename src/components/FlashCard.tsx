import { useState, useEffect, useRef } from 'react'
import type { Card } from '../lib/api'

interface FlashCardProps {
  card: Card
  onNext?: () => void
  onPrevious?: () => void
  hasNext?: boolean
  hasPrevious?: boolean
  currentIndex?: number
  totalCards?: number
  maskBottom?: boolean
}

export function FlashCard({
  card,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  currentIndex = 0,
  totalCards = 0,
  maskBottom = false
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)
  const onNextRef = useRef(onNext)
  const onPreviousRef = useRef(onPrevious)
  const pendingCallback = useRef<(() => void) | null>(null)

  // Keep refs in sync
  onNextRef.current = onNext
  onPreviousRef.current = onPrevious
  isAnimatingRef.current = isAnimating

  // Detect when card changes and finish the animation
  useEffect(() => {
    if (swipeDirection && pendingCallback.current === null) {
      // Card has changed, clear the swipe
      setSwipeDirection(null)
      setIsAnimating(false)
      isAnimatingRef.current = false
    }
  }, [currentIndex])

  const handleFlip = () => {
    if (!isAnimating) {
      setIsFlipped(!isFlipped)
    }
  }

  const animateAndNavigate = (direction: 'left' | 'right', callback?: () => void) => {
    if (isAnimatingRef.current) return
    setIsAnimating(true)
    isAnimatingRef.current = true
    setIsFlipped(false) // Reset flip immediately so next card appears unflipped
    setSwipeDirection(direction)
    pendingCallback.current = callback || null

    setTimeout(() => {
      // Call the callback to change the card
      const cb = pendingCallback.current
      pendingCallback.current = null
      cb?.()
    }, 200)
  }

  const handleNext = () => {
    animateAndNavigate('left', onNextRef.current)
  }

  const handlePrevious = () => {
    animateAndNavigate('right', onPreviousRef.current)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && hasNext) {
        animateAndNavigate('left', onNextRef.current)
      } else if (e.key === 'ArrowLeft' && hasPrevious) {
        animateAndNavigate('right', onPreviousRef.current)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasNext, hasPrevious])

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX
    const minSwipeDistance = 50

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0 && hasNext) {
        // Swiped left -> next
        handleNext()
      } else if (diff < 0 && hasPrevious) {
        // Swiped right -> previous
        handlePrevious()
      }
    }

    touchStartX.current = null
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A'
    return `$${price.toFixed(2)}`
  }

  const getSwipeTransform = () => {
    if (swipeDirection === 'left') return 'translateX(-120%) rotate(-10deg)'
    if (swipeDirection === 'right') return 'translateX(120%) rotate(10deg)'
    return 'translateX(0)'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Card counter */}
      {totalCards > 0 && (
        <div className="text-sm text-gray-500">
          Card {currentIndex + 1} of {totalCards}
        </div>
      )}

      {/* Flashcard container */}
      <div
        className="relative w-[300px] h-[420px] cursor-pointer select-none"
        onClick={handleFlip}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: getSwipeTransform(),
          opacity: swipeDirection ? 0 : 1,
          transition: swipeDirection ? 'transform 0.2s ease-out, opacity 0.2s ease-out' : 'none'
        }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front - Card image */}
          <div
            className="absolute w-full h-full rounded-xl shadow-lg overflow-hidden bg-gray-100"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center p-4">
                  <div className="text-lg font-medium">{card.name}</div>
                  <div className="text-sm mt-2">No image</div>
                </div>
              </div>
            )}
            {/* Bottom mask for One Piece cards */}
            {maskBottom && !isFlipped && (
              <div
                className="absolute bottom-0 left-0 right-0 h-20 bg-gray-800"
                style={{
                  background: 'linear-gradient(to bottom, transparent 0%, #1f2937 30%, #1f2937 100%)'
                }}
              />
            )}
          </div>

          {/* Back - Card info */}
          <div
            className="absolute w-full h-full rounded-xl shadow-lg overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="text-center p-6 text-white">
              {/* English Name */}
              <div className="text-sm uppercase tracking-wide opacity-75 mb-2">
                English Name
              </div>
              <div className="text-2xl font-bold mb-6">
                {card.name}
              </div>

              {/* Card Number */}
              {card.card_number && (
                <div className="text-sm opacity-75 mb-4">
                  #{card.card_number}
                </div>
              )}

              {/* Rarity */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm">
                  {card.rarity || 'Unknown Rarity'}
                </span>
              </div>

              {/* Price */}
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="text-sm opacity-75 mb-1">Market Price</div>
                <div className="text-3xl font-bold">
                  {formatPrice(card.price)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-500 text-center">
        <div>Click card to {isFlipped ? 'hide' : 'reveal'} answer</div>
        <div className="text-xs mt-1">Swipe or use arrow keys to navigate</div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={handlePrevious}
          disabled={!hasPrevious}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!hasNext}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
