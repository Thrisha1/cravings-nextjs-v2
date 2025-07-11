"use client";

import React, { useState, useRef, useCallback } from "react";
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
  onCropComplete: (croppedImageUrl: string, cropType: 'square' | 'circle') => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropper({ isOpen, onClose, imageUrl, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [cropType, setCropType] = useState<'square' | 'circle'>('square');
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const aspect = cropType === 'square' ? 1 : 1; // Both square and circle use 1:1 aspect ratio
    const crop = centerAspectCrop(width, height, aspect);
    setCrop(crop);
  }, [cropType]);

  const getCroppedImg = useCallback(async (
    image: HTMLImageElement,
    crop: PixelCrop,
    cropType: 'square' | 'circle'
  ): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

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

    // If circle crop, create a circular mask
    if (cropType === 'circle') {
      const circleCanvas = document.createElement('canvas');
      const circleCtx = circleCanvas.getContext('2d');
      
      if (!circleCtx) {
        throw new Error('No 2d context for circle');
      }

      circleCanvas.width = crop.width;
      circleCanvas.height = crop.height;

      // Create circular clipping path
      circleCtx.beginPath();
      circleCtx.arc(crop.width / 2, crop.height / 2, crop.width / 2, 0, 2 * Math.PI);
      circleCtx.clip();

      // Draw the cropped image
      circleCtx.drawImage(canvas, 0, 0);

      return circleCanvas.toDataURL('image/png');
    }

    return canvas.toDataURL('image/png');
  }, []);

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    setIsProcessing(true);
    try {
      const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop, cropType);
      onCropComplete(croppedImageUrl, cropType);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCropTypeChange = (value: string) => {
    setCropType(value as 'square' | 'circle');
    // Reset crop when changing type
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const aspect = 1; // 1:1 aspect ratio
      const newCrop = centerAspectCrop(width, height, aspect);
      setCrop(newCrop);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crop Profile Banner</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="crop-type">Crop Type:</Label>
            <RadioGroup
              id="crop-type"
              value={cropType}
              onValueChange={handleCropTypeChange}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="square" id="square" />
                <Label htmlFor="square">Square</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="circle" id="circle" />
                <Label htmlFor="circle">Circle (Logo in center)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              minWidth={100}
              minHeight={100}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageUrl}
                onLoad={onImageLoad}
                className="max-h-[400px] max-w-full object-contain"
              />
            </ReactCrop>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCropComplete}
              disabled={!completedCrop || isProcessing}
            >
              {isProcessing ? "Processing..." : "Crop & Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 