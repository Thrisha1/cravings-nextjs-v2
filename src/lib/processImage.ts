export const processImage = async (localBlobUrl: string): Promise<string> => {
    // Check if the URL should not be processed
    if (localBlobUrl.includes('cravingsbucket')) {
      return localBlobUrl;
    }
  
    // Create an image element to load the image
    const img = new Image();
    img.src = localBlobUrl;
    
    // Wait for image to load
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = () => {
        throw new Error('Failed to load image');
      };
    });
  
    // Create a canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
  
    let width = img.width;
    let height = img.height;
  
    // Handle Swiggy images - crop to 500x500 at specific position
    if (localBlobUrl.includes('swiggy')) {
      const sourceX = 96;
      const sourceY = 0;
      const cropSize = 500;
      
      canvas.width = cropSize;
      canvas.height = cropSize;
      ctx.drawImage(
        img,
        sourceX, sourceY,       // Source x, y
        cropSize, cropSize,     // Source width, height
        0, 0,                   // Destination x, y
        cropSize, cropSize      // Destination width, height
      );
    } 
    // Process other images - resize maintaining aspect ratio
    else {
      const maxSize = 500;
      let newWidth, newHeight;
  
      if (width > height) {
        newWidth = maxSize;
        newHeight = Math.round((height / width) * maxSize);
      } else {
        newHeight = maxSize;
        newWidth = Math.round((width / height) * maxSize);
      }
  
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
    }
  
    // Convert to WebP format and get as base64
    const webpBase64 = canvas.toDataURL('image/webp', 0.8);
    
    // Add prefix and return
    return webpBase64;
  };