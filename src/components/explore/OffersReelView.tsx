"use client";
import React, { useRef, useEffect, useState } from "react";
import { CommonOffer } from "@/components/superAdmin/OfferUploadSuperAdmin";
import { X, Play, ExternalLink } from "lucide-react";

interface OffersReelViewProps {
  offers: CommonOffer[];
  onClose: () => void;
}

const OffersReelView: React.FC<OffersReelViewProps> = ({ offers, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);

  // Function to convert Instagram links to embed URLs with autoplay
  const getEmbedUrl = (url: string): string => {
    if (url && url.includes('instagram.com')) {
      // Convert Instagram post/reel URL to embed URL with autoplay parameters
      const postId = url.match(/\/p\/([^\/]+)/) || url.match(/\/reel\/([^\/]+)/);
      if (postId) {
        // Add autoplay and other parameters for better video playback
        return `https://www.instagram.com/p/${postId[1]}/embed/?autoplay=1&autoplay_audio=1&playsinline=1&controls=1&rel=0&showinfo=0&modestbranding=1`;
      }
    }
    // For other video platforms or if no URL, return a placeholder
    return url || '';
  };

  // Function to check if offer has reel content
  const hasReelContent = (offer: CommonOffer): boolean => {
    return !!(offer.insta_link && offer.insta_link.trim() !== '');
  };

  // Function to pause all iframes except the current one
  const pauseAllIframesExcept = (currentIndex: number) => {
    iframeRefs.current.forEach((iframe, index) => {
      if (iframe && index !== currentIndex) {
        // For Instagram iframes, we can't directly control playback
        // But we can reload them to stop any ongoing content
        if (iframe.src.includes('instagram.com')) {
          const currentSrc = iframe.src;
          iframe.src = '';
          setTimeout(() => {
            if (iframe) iframe.src = currentSrc;
          }, 100);
        }
      }
    });
  };

  // Function to play the current iframe
  const playCurrentIframe = (index: number) => {
    const iframe = iframeRefs.current[index];
    if (iframe && iframe.src.includes('instagram.com')) {
      // Force reload with autoplay parameters for Instagram
      const currentSrc = iframe.src;
      iframe.src = '';
      setTimeout(() => {
        if (iframe) iframe.src = currentSrc;
      }, 50);
    }
  };

  // Intersection Observer to detect which reel is currently visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setCurrentVisibleIndex(index);
            pauseAllIframesExcept(index);
            // Play the current iframe with autoplay
            setTimeout(() => playCurrentIframe(index), 100);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the reel is visible
        rootMargin: '-20% 0px -20% 0px' // Consider only the center 60% of the viewport
      }
    );

    // Observe all reel containers
    const reelContainers = containerRef.current?.querySelectorAll('[data-index]');
    reelContainers?.forEach((container) => {
      observer.observe(container);
    });

    return () => observer.disconnect();
  }, [offers]);

  // Pause all iframes when component unmounts
  useEffect(() => {
    return () => {
      pauseAllIframesExcept(-1); // Pause all
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-2xl mx-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-pink-400" />
            <span className="text-sm font-medium">
              Reel View ({offers.length} offers)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content - Vertical Scrolling Reels */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto px-4 pb-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="space-y-8">
            {offers.map((offer, index) => (
              <div 
                key={offer.id} 
                className="w-full"
                data-index={index}
              >
                {/* Reel Header */}
                <div className="mb-3 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{offer.item_name}</h3>
                    <span className="text-sm text-gray-300">₹{offer.price}</span>
                  </div>
                  <p className="text-sm text-gray-300">{offer.partner_name}</p>
                  {offer.location && (
                    <p className="text-xs text-gray-400 mt-1">{offer.location}</p>
                  )}
                </div>

                {/* Reel Content */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  {hasReelContent(offer) ? (
                    <div className="aspect-[9/16] w-full max-w-sm mx-auto">
                      <iframe
                        ref={(el) => {
                          iframeRefs.current[index] = el;
                        }}
                        src={getEmbedUrl(offer.insta_link || '')}
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        title={`Reel: ${offer.item_name}`}
                        frameBorder="0"
                        scrolling="no"
                        loading="lazy"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[9/16] w-full max-w-sm mx-auto bg-gray-800 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No reel content</p>
                        <p className="text-xs">This offer doesn't have a reel link</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reel Footer */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-sm">❤️ {offer.likes || 0}</span>
                  </div>
                  {hasReelContent(offer) && (
                    <a
                      href={offer.insta_link || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-pink-400 hover:text-pink-300 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Instagram
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersReelView; 