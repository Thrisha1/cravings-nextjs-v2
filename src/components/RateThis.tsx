"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Partner } from "@/store/authStore";
import { Styles } from "@/screens/HotelMenuPage_v2";
import HeadingWithAccent from "./HeadingWithAccent";

interface RateThisProps {
  type: "hotel" | "menuItem";
  itemId?: string;
  hotel: Partner;
  styles: Styles;
}

const RateThis = ({ type, hotel, styles }: RateThisProps) => {
  const { id } = useParams();
  const itemId = id || "";
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    const savedRating = localStorage.getItem(`${type}_${itemId}_rating`);
    if (savedRating) {
      setRating(parseInt(savedRating));
      setHasRated(true);
    }
  }, [itemId, type]);

  const handleStarClick = (star: number) => {
    if (hasRated) return;

    setRating(star);
    localStorage.setItem(`${type}_${itemId}_rating`, star.toString());
    setHasRated(true);

    if (star >= 4) {
      setIsLoading(true);
      setTimeout(() => {
        window.open(
          hotel.place_id
            ? `https://search.google.com/local/writereview?placeid=${hotel.place_id}`
            : hotel.location,
          "_blank",
          "noopener,noreferrer"
        );
        setIsLoading(false);
        setRating(star);
      }, 2000);
    }
  };

  return (
    <div className="grid gap-5 flex-1 sm:max-w-lg">
      <div>
        <HeadingWithAccent
          accent={styles.accent}
          className="text-2xl font-black sm:text-4xl text-center"
        >
          Rate this {type === "hotel" ? "hotel" : "Item"}
        </HeadingWithAccent>
        <p className="text-sm text-gray-500 text-center sm:text-base">
          {hasRated ? "Thanks for your rating!" : "Tell others what you think"}
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
              style={{
                color:
                  star <= (hoveredRating || rating)
                    ? styles.accent
                    : `${styles.color}`,
                transition: "color 0.2s ease-in-out",
                opacity: star <= (hoveredRating || rating) ? 1 : 0.2,
              }}
              className={`text-4xl cursor-pointer ${
                hasRated ? "cursor-default" : "cursor-pointer"
              }`}
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
  );
};

export default RateThis;
