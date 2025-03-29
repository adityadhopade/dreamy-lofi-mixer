
import React, { useEffect, useState, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioProcessor?: any;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, audioProcessor }) => {
  const bars = 20;
  const minHeight = 3;
  const maxHeight = 30;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [heights, setHeights] = useState<number[]>(Array(bars).fill(minHeight));
  const animationRef = useRef<number | null>(null);

  // Generate random heights for visualization when we don't have audio data
  useEffect(() => {
    if (isPlaying && !audioProcessor) {
      const interval = setInterval(() => {
        const newHeights = Array(bars).fill(0).map(() => 
          Math.floor(Math.random() * (maxHeight - minHeight) + minHeight)
        );
        setHeights(newHeights);
      }, 100);
      
      return () => clearInterval(interval);
    } else if (!isPlaying && !audioProcessor) {
      // When not playing, set all bars to minimum height
      setHeights(Array(bars).fill(minHeight));
    }
  }, [isPlaying, audioProcessor]);

  // Use Web Audio API analyzer data if available
  useEffect(() => {
    if (!isPlaying || !audioProcessor || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = () => {
      const visualData = audioProcessor.getAnalyserData?.();
      
      if (!visualData) {
        animationRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate bar width based on canvas size and number of data points
      const barWidth = canvas.width / visualData.length;
      const barSpacing = 2;
      const effectiveBarWidth = barWidth - barSpacing;
      
      // Draw frequency bars
      for (let i = 0; i < visualData.length; i++) {
        // Scale the height to fit canvas
        const percent = visualData[i] / 255;
        const barHeight = percent * canvas.height;
        
        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, 'rgba(167, 139, 250, 0.8)'); // lofi-purple
        gradient.addColorStop(1, 'rgba(96, 165, 250, 0.5)');  // lofi-blue
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          i * barWidth, 
          canvas.height - barHeight, 
          effectiveBarWidth, 
          barHeight
        );
      }
      
      animationRef.current = requestAnimationFrame(renderFrame);
    };
    
    animationRef.current = requestAnimationFrame(renderFrame);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, audioProcessor]);

  // Fallback to div-based visualization when we don't have audio processor
  if (!audioProcessor) {
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
  }

  // Canvas-based visualization when we have audio processor
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-16 rounded-md"
      width={400}
      height={60}
    />
  );
};

export default AudioVisualizer;
