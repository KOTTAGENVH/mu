import React from "react";
import { useAudioEq, EqBand } from "@/contextApi/audioEnhance";
import { inter, roboto } from "@/app/fonts";

export default function EqSettingsModal() {
  const { eqValues, setEqValue, pan, setPan, useCompressor, setUseCompressor, resetEq } = useAudioEq();

  const bands: { key: EqBand; label: string }[] = [
    { key: "100", label: "Bass" },
    { key: "300", label: "Low Mid" },
    { key: "1000", label: "Mid" },
    { key: "4000", label: "High Mid" },
    { key: "12000", label: "Treble" },
  ];

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-sm border-none flex flex-col items-center h-auto w-full max-w-sm max-w-md  mx-auto px-3  lg:px-6 mt-8 mb-8">
      
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <h3 className={`${inter.className} text-xl font-bold text-black dark:text-white`}>
          Audio Enhancements
        </h3>
        <button 
          onClick={resetEq}
          className="text-xs font-semibold px-3 py-1 bg-white/10 hover:bg-white/20 text-black dark:text-white rounded-full transition-colors"
        >
          Reset All
        </button>
      </div>
      <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
        <div>
          <h4 className={`${inter.className} text-sm font-semibold text-black dark:text-white`}>Loudness Equalization</h4>
          <p className={`${roboto.className} text-xs text-black/60 dark:text-white/60 mt-1`}>Balances quiet and loud sounds.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={useCompressor}
            onChange={(e) => setUseCompressor(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
        </label>
      </div>
      <div className="space-y-4">
        <h4 className={`${inter.className} text-sm font-semibold text-black dark:text-white mb-4`}>Graphic Equalizer</h4>
        {bands.map((band) => (
          <div key={band.key} className="flex items-center space-x-4">
            <span className="w-16 text-xs text-right text-black/70 dark:text-white/70 font-medium">
              {band.label}
            </span>
            <input
              type="range"
              min="-15"
              max="15"
              step="1"
              value={eqValues[band.key]}
              onChange={(e) => setEqValue(band.key, parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
            />
            <span className="w-12 text-xs text-left text-black dark:text-white font-mono">
              {eqValues[band.key] > 0 ? `+${eqValues[band.key]}` : eqValues[band.key]} dB
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center">
          <h4 className={`${inter.className} text-sm font-semibold text-black dark:text-white`}>L/R Balance</h4>
          <span className="text-xs font-mono text-black/70 dark:text-white/70">
            {pan === 0 ? "Center" : pan < 0 ? `L ${Math.abs(Math.round(pan * 100))}%` : `R ${Math.round(pan * 100)}%`}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs font-bold text-black/50 dark:text-white/50">L</span>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={pan}
            onChange={(e) => setPan(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
          />
          <span className="text-xs font-bold text-black/50 dark:text-white/50">R</span>
        </div>
      </div>

    </div>
  );
}