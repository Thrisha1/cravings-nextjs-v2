import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface RateThisProps {
  type: 'hotel' | 'offer'
}

const RateThis = ({ type }: RateThisProps) => {
  const params = useParams()
  const id = params.id as string
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)

  useEffect(() => {
    const savedRating = localStorage.getItem(`${type}_${id}_rating`)
    if (savedRating) {
      setRating(parseInt(savedRating))
    }
  }, [id, type])

  const handleStarClick = (star: number) => {
    setRating(star)
    localStorage.setItem(`${type}_${id}_rating`, star.toString())
  }

  return (
    <div className="grid gap-5 flex-1 sm:max-w-lg">
      <div>
        <h2 className="text-lg font-semibold sm:text-4xl sm:text-center">Rate this {type}</h2>
        <p className="text-sm text-gray-500 sm:text-center sm:text-base">Tell others what you think</p>
      </div>

      <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Link
            key={star}
            href={`/hotels/${id}/reviews/new`}
            className={`text-4xl cursor-pointer ${
              star <= (hoveredRating || rating) 
                ? 'text-orange-600' 
                : 'text-gray-200'
            }`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            ★
          </Link>
        ))}
      </div>

      <Link 
        href={`/hotels/${id}/reviews/new`}
        className="text-sm text-orange-600 hover:text-orange-500 sm:text-center sm:text-base"
      >
        Write a review
      </Link>

    </div>
  )
}

export default RateThis