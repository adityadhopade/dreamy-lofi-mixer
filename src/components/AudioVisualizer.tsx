
import React, { useEffect, useState } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying }) => {
  const bars = 20;
  const minHeight = 3;
  const maxHeight = 30;
  
  const [heights, setHeights] = useState<number[]>([]);

  // Generate random heights for visualization
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        const newHeights = Array(bars).fill(0).map(() => 
          Math.floor(Math.random() * (maxHeight - minHeight) + minHeight)
        );
        setHeights(newHeights);
      }, 100);
      
      return () => clearInterval(interval);
    } else {
      // When not playing, set all bars to minimum height
      setHeights(Array(bars).fill(minHeight));
    }
  }, [isPlaying]);

  return (
    <div className="audio-visualizer">
      {heights.map((height, index) => (
        <div
          key={index}
          className={`audio-bar ${isPlaying ? 'animate-pulse-slow' : ''}`}
          style={{ 
            height: `${height}px`,
            animationDelay: `${index * 0.05}s` 
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
