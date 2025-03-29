
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Volume1, VolumeX, Play, Pause, Disc } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import AudioVisualizer from './AudioVisualizer';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioUrl: string | null;
  isProcessed: boolean;
  ambientSoundUrl: string | null;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, isProcessed, ambientSoundUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioUrl) return;
    
    // Reset player state when new audio is loaded
    setIsPlaying(false);
    setCurrentTime(0);
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    
    return () => {
      audio.pause();
      audio.src = '';
      audio.remove();
    };
  }, [audioUrl]);
  
  useEffect(() => {
    if (!ambientSoundUrl) return;
    
    const ambient = new Audio(ambientSoundUrl);
    ambientRef.current = ambient;
    ambient.loop = true;
    ambient.volume = ambientVolume;
    
    return () => {
      ambient.pause();
      ambient.src = '';
      ambient.remove();
    };
  }, [ambientSoundUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);
  
  useEffect(() => {
    if (!ambientRef.current) return;
    ambientRef.current.volume = ambientVolume;
  }, [ambientVolume]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      ambientRef.current?.pause();
    } else {
      audioRef.current.play().catch(err => console.error("Error playing audio:", err));
      
      if (ambientRef.current && isProcessed) {
        ambientRef.current.play().catch(err => console.error("Error playing ambient:", err));
      }
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const VolumeIcon = () => {
    if (volume === 0) return <VolumeX size={18} />;
    if (volume < 0.5) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };

  if (!audioUrl) {
    return (
      <div className="w-full h-24 bg-secondary/50 rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground text-base font-bangers tracking-wide">Upload a track to begin</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-secondary/50 rounded-xl p-4 backdrop-blur">
      <div className="flex items-center justify-center mb-4">
        <div className="mr-4">
          <Button 
            variant="outline" 
            size="icon" 
            className={cn("rounded-full transition-all transform", 
              isPlaying ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-primary/20"
            )}
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </Button>
        </div>
        
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-bangers">{formatTime(currentTime)}</span>
            <span className="text-xs text-muted-foreground font-bangers">{formatTime(duration)}</span>
          </div>
          <Slider
            min={0}
            max={duration || 100}
            step={0.01}
            value={[currentTime]}
            onValueChange={handleTimeChange}
            className="my-1"
          />
          
          <AudioVisualizer isPlaying={isPlaying} />
        </div>
      </div>
      
      <div className={cn("flex items-center justify-between transition-opacity duration-300", 
        isProcessed ? "opacity-100" : "opacity-0")}>
        <div className="flex items-center">
          <VolumeIcon />
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[volume]}
            onValueChange={(val) => setVolume(val[0])}
            className="w-24 ml-2"
          />
          <span className="text-xs ml-2 font-bangers tracking-wide">Track</span>
        </div>
        
        <div className="flex items-center">
          <Disc size={18} className="animate-spin" style={{ animationDuration: '3s' }} />
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[ambientVolume]}
            onValueChange={(val) => setAmbientVolume(val[0])}
            className="w-24 ml-2"
          />
          <span className="text-xs ml-2 font-bangers tracking-wide">Ambient</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
