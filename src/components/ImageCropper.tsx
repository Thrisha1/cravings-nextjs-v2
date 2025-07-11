"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string, cropType: string) => void;
}

function centerFreeCrop(
  mediaWidth: number,
  mediaHeight: number,
) {
  // Centered, large free crop
  return {
    unit: '%' as const,
    x: 5,
    y: 10,
    width: 90,
    height: 50,
  };
}

export default function ImageCropper({ isOpen, onClose, imageUrl, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropMode, setCropMode] = useState<'free' | 'circle'>('free');
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    if (cropMode === 'circle') {
      // Centered square crop for circle
      const size = Math.min(width, height) * 0.8;
      setCrop({
        unit: 'px',
        x: (width - size) / 2,
        y: (height - size) / 2,
        width: size,
        height: size,
      });
    } else {
      setCrop(centerFreeCrop(width, height));
    }
  }, [cropMode]);

  const getCroppedImg = useCallback(async (
    image: HTMLImageElement,
    crop: PixelCrop,
    mode: 'free' | 'circle',
  ): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );
    if (mode === 'circle') {
      // Apply circular mask
      const circleCanvas = document.createElement('canvas');
      const circleCtx = circleCanvas.getContext('2d');
      if (!circleCtx) throw new Error('No 2d context for circle');
      circleCanvas.width = crop.width;
      circleCanvas.height = crop.height;
      circleCtx.beginPath();
      circleCtx.arc(crop.width / 2, crop.height / 2, crop.width / 2, 0, 2 * Math.PI);
      circleCtx.clip();
      circleCtx.drawImage(canvas, 0, 0);
      return circleCanvas.toDataURL('image/png');
    }
    return canvas.toDataURL('image/png');
  }, []);

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    setIsProcessing(true);
    try {
      const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop, cropMode);
      onCropComplete(croppedImageUrl, cropMode);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // When cropMode changes, reset crop
  useEffect(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      if (cropMode === 'circle') {
        const size = Math.min(width, height) * 0.8;
        setCrop({
          unit: 'px',
          x: (width - size) / 2,
          y: (height - size) / 2,
          width: size,
          height: size,
        });
      } else {
        setCrop(centerFreeCrop(width, height));
      }
    }
  }, [cropMode, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] h-[90vh] max-h-[95vh] md:max-w-3xl md:h-auto md:max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle className="text-lg md:text-xl">Crop Profile Banner</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
         <div className="flex flex-row gap-2 items-center mb-2">
           <span className="text-sm font-medium">Crop Mode:</span>
           <Button
             variant={cropMode === 'free' ? 'default' : 'outline'}
             onClick={() => setCropMode('free')}
             size="sm"
           >
             Free
           </Button>
           <Button
             variant={cropMode === 'circle' ? 'default' : 'outline'}
             onClick={() => setCropMode('circle')}
             size="sm"
           >
             Circle
           </Button>
         </div>
          {/* Rectangle aspect ratio, no crop type selection */}

          <div className="flex justify-center w-full">
            <div className="w-full max-w-md">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={cropMode === 'circle' ? 1 : undefined}
                minWidth={50}
                minHeight={50}
                className="w-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageUrl}
                  onLoad={onImageLoad}
                  className="w-full h-auto max-h-[250px] object-contain"
                  style={{ touchAction: 'none' }}
                />
              </ReactCrop>
            </div>
          </div>
        </div>
        <div className="shrink-0 pt-4 border-t mt-4 bg-white sticky bottom-0 z-10 px-4 pb-4">
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCropComplete}
              disabled={!completedCrop || isProcessing}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isProcessing ? "Processing..." : "Crop & Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}