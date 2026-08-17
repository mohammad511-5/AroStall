import { useState, useEffect } from 'react';

interface PriceSliderProps {
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
}

export function PriceSlider({ priceRange, onPriceChange }: PriceSliderProps) {
  const [min, max] = priceRange;
  const minPrice = 0;
  const maxPrice = 15000;

  const handleMinChange = (value: number) => {
    if (value < max) {
      onPriceChange([value, max]);
    }
  };

  const handleMaxChange = (value: number) => {
    if (value > min) {
      onPriceChange([min, value]);
    }
  };

  return (
    <div className="mb-8 max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h3 className="text-white font-semibold mb-4 text-center">Filter by Price</h3>

      <div className="space-y-4">
        <div className="relative pt-6">
          <div className="flex justify-between mb-2">
            <span className="text-blue-200 text-sm">৳ {min.toLocaleString()}</span>
            <span className="text-blue-200 text-sm">৳ {max.toLocaleString()}</span>
          </div>

          <div className="relative h-2 bg-white/20 rounded-full">
            <div
              className="absolute h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              style={{
                left: `${(min / maxPrice) * 100}%`,
                right: `${100 - (max / maxPrice) * 100}%`,
              }}
            />
          </div>

          <div className="relative">
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              step={100}
              value={min}
              onChange={(e) => handleMinChange(Number(e.target.value))}
              className="absolute w-full -top-1 pointer-events-auto appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
            />
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              step={100}
              value={max}
              onChange={(e) => handleMaxChange(Number(e.target.value))}
              className="absolute w-full -top-1 pointer-events-auto appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
            />
          </div>
        </div>

        <div className="flex gap-4 items-center justify-center pt-4">
          <div className="flex-1">
            <label className="text-white/70 text-xs mb-1 block">Min Price</label>
            <input
              type="number"
              value={min}
              onChange={(e) => handleMinChange(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              min={minPrice}
              max={max}
            />
          </div>
          <div className="flex-1">
            <label className="text-white/70 text-xs mb-1 block">Max Price</label>
            <input
              type="number"
              value={max}
              onChange={(e) => handleMaxChange(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              min={min}
              max={maxPrice}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
