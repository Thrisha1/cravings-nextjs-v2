"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import React, { useState } from 'react';


const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-500 dark:text-gray-400">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);


const Page = () => {
  const [realPrice, setRealPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [priceError, setPriceError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'real' | 'offer') => {
    const value = e.target.value;
    let currentRealPrice = realPrice;
    let currentOfferPrice = offerPrice;

    if (type === 'real') {
      setRealPrice(value);
      currentRealPrice = value;
    } else {
      setOfferPrice(value);
      currentOfferPrice = value;
    }

    if (currentRealPrice && currentOfferPrice && parseFloat(currentOfferPrice) >= parseFloat(currentRealPrice)) {
      setPriceError('Offer price must be less than the real price.');
    } else {
      setPriceError('');
    }
  };

  const validateTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToTime(value);

    if (fromTime && value && value <= fromTime) {
      setTimeError('"To Time" must be after "From Time".');
    } else {
      setTimeError('');
    }
  };
  
  const handleFromTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFromTime(value);
      if(toTime && value && toTime <= value) {
          setTimeError('"To Time" must be after "From Time".');
      } else {
          setTimeError('');
      }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission logic here
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Create New Offer</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Fill out the details below to create a new offer.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <Label htmlFor="item-image" className="mb-2 block">
              Item Image (Optional)
            </Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Item Preview" className="mx-auto h-24 w-24 object-cover rounded-md" />
                ) : (
                  <UploadIcon />
                )}
                <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                  <Label htmlFor="item-image-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500">
                    <span>Upload a file</span>
                    <input id="item-image-upload" name="item-image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                  </Label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input
              type="text"
              id="item-name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-description">Item Description</Label>
            <Textarea
              id="item-description"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="real-price">Real Price ($)</Label>
              <Input
                type="number"
                id="real-price"
                value={realPrice}
                onChange={(e) => handlePriceChange(e, 'real')}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-price">Offer Price ($)</Label>
              <Input
                type="number"
                id="offer-price"
                value={offerPrice}
                onChange={(e) => handlePriceChange(e, 'offer')}
                required
                min="0"
                step="0.01"
                aria-invalid={!!priceError}
              />
              {priceError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">{priceError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="from-time">Offer From</Label>
              <Input
                type="time"
                id="from-time"
                value={fromTime}
                onChange={handleFromTimeChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-time">Offer To</Label>
              <Input
                type="time"
                id="to-time"
                value={toTime}
                onChange={validateTime}
                required
                aria-invalid={!!timeError}
              />
              {timeError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">{timeError}</p>}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={!!priceError || !!timeError}
            >
              Create Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;
