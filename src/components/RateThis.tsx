import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Partner } from '@/store/authStore'

interface RateThisProps {
  type: 'hotel' | 'menuItem'
  itemId?: string,
  hotel : Partner
}

const RateThis = ({ type , hotel }: RateThisProps) => {
  const { id } = useParams()
  const itemId = id || '';
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasRated, setHasRated] = useState(false)

  useEffect(() => {
    const savedRating = localStorage.getItem(`${type}_${itemId}_rating`)
    if (savedRating) {
      setRating(parseInt(savedRating))
      setHasRated(true)
    }
  }, [itemId, type])

  const handleStarClick = (star: number) => {
    if (hasRated) return
    
    setRating(star)
    localStorage.setItem(`${type}_${itemId}_rating`, star.toString())
    setHasRated(true)

    if (star >= 4) {
      setIsLoading(true)
      setTimeout(() => {
        window.open(hotel.place_id ? `https://search.google.com/local/writereview?placeid=${hotel.place_id}` : hotel.location, '_blank', 'noopener,noreferrer');
      }, 2000)
    }
  }

  return (
    <div className="grid gap-5 flex-1 sm:max-w-lg">
      <div>
        <h2 className="text-lg font-semibold sm:text-4xl sm:text-center">Rate this {type === 'hotel' ? 'hotel' : 'Item'}</h2>
        <p className="text-sm text-gray-500 sm:text-center sm:text-base">
          {hasRated ? 'Thanks for your rating!' : 'Tell others what you think'}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <p>Redirecting to Google Reviews...</p>
          {/* You can add a spinner here if you want */}
        </div>
      ) : (
        <div className="flex justify-between gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              disabled={hasRated}
              className={`text-4xl cursor-pointer ${
                star <= (hoveredRating || rating) 
                  ? 'text-orange-600' 
                  : 'text-gray-200'
              } ${hasRated ? 'cursor-default' : 'cursor-pointer'}`}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => !hasRated && setHoveredRating(star)}
              onMouseLeave={() => !hasRated && setHoveredRating(0)}
            >
              ★
            </button>
          ))}
        </div>
      )}

      {hasRated && rating >= 4 && !isLoading && (
        <p className="text-sm text-gray-500 text-center">
          Thank you for your positive rating!
        </p>
      )}
    </div>
  )
}

export default RateThis