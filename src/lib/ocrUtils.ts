export const enhanceImageForOcr = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Increase contrast and convert to grayscale to help Tesseract distinguish digits like 5 and 20
      const contrast = 65; // Boost contrast heavily
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        // Luminosity Grayscale approximation
        let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Apply contrast
        gray = factor * (gray - 128) + 128;
        
        // Hard limits
        if (gray > 255) gray = 255;
        else if (gray < 0) gray = 0;

        // Optionally gently threshold
        // If it's fairly bright, make it pure white to remove noise
        if (gray > 180) gray = 255;
        // If it's fairly dark, make it pure black for sharp edges
        if (gray < 100) gray = 0;

        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
        // Alpha (data[i + 3]) remains unchanged
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.onerror = () => resolve(dataUrl); // Fallback
    img.src = dataUrl;
  });
};
