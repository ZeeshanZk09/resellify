"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";

interface ProductGalleryProps {
  images: Array<{
    id: string;
    path: string;
    fileName: string;
  }>;
  productTitle: string;
  discount?: number;
}

export default function ProductGallery({
  images,
  productTitle,
  discount,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-400">No image available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-white rounded-lg border overflow-hidden group">
        {discount && discount > 0 && (
          <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{discount}%
          </div>
        )}
        
        <Image
          src={images[selectedImage].path}
          alt={`${productTitle} - Image ${selectedImage + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          className="object-contain p-4"
          priority={selectedImage === 0}
          loading={selectedImage === 0 ? "eager" : "lazy"}
          quality={85}
        />
        
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute bottom-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Zoom image"
        >
          <ZoomIn size={20} />
        </button>
        
        {/* Zoom overlay */}
        {isZoomed && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-zoom-out"
            onClick={() => setIsZoomed(false)}
          >
            <Image
              src={images[selectedImage].path}
              alt={`Zoomed view of ${productTitle}`}
              width={1200}
              height={1200}
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-square rounded-lg border overflow-hidden transition-all ${
                selectedImage === index
                  ? "ring-2 ring-primary ring-offset-2"
                  : "opacity-75 hover:opacity-100"
              }`}
              aria-label={`View image ${index + 1}`}
              aria-current={selectedImage === index ? "true" : "false"}
            >
              <Image
                src={image.path}
                alt={`${productTitle} thumbnail ${index + 1}`}
                fill
                sizes="(max-width: 768px) 25vw, 16vw"
                className="object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}