
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
  audioProcessor?: any;
  onDownload?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  isProcessed, 
  ambientSoundUrl, 
  audioProcessor,
  onDownload
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.25); // Default to 25%
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const progressAnimationRef = useRef<number | null>(null);
  const wasPlayingBeforeSeek = useRef<boolean>(false);

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
    
    // Set default volume to 25%
    audio.volume = 0.25;
    
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
    
    // If we're already playing, start the ambient sound
    if (isPlaying) {
      ambient.play().catch(err => console.error("Error playing ambient:", err));
    }
    
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

  // Use AudioProcessor if available, otherwise use audio element
  const togglePlayback = () => {
    if (audioProcessor && isProcessed) {
      if (isPlaying) {
        audioProcessor.pause();
        if (progressAnimationRef.current) {
          cancelAnimationFrame(progressAnimationRef.current);
          progressAnimationRef.current = null;
        }
      } else {
        audioProcessor.play(currentTime);
        updateProgressForProcessor();
      }
      setIsPlaying(!isPlaying);
      return;
    }
    
    // Fallback to classic Audio element
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      ambientRef.current?.pause();
    } else {
      audioRef.current.currentTime = currentTime;
      audioRef.current.play().catch(err => console.error("Error playing audio:", err));
      
      if (ambientRef.current) {
        ambientRef.current.play().catch(err => console.error("Error playing ambient:", err));
      }
    }
    
    setIsPlaying(!isPlaying);
  };

  // Update progress continuously when using audioProcessor
  const updateProgressForProcessor = () => {
    if (!isPlaying || !audioProcessor) return;
    
    const updateTime = () => {
      // Get time from processor if available, otherwise increment manually
      const newTime = audioProcessor.getCurrentTime ? audioProcessor.getCurrentTime() : currentTime + 0.05;
      setCurrentTime(newTime);
      
      // Check if we've reached the end of the audio
      if (newTime >= duration) {
        setIsPlaying(false);
        setCurrentTime(0);
        audioProcessor.pause();
        if (progressAnimationRef.current) {
          cancelAnimationFrame(progressAnimationRef.current);
          progressAnimationRef.current = null;
        }
        return;
      }
      
      progressAnimationRef.current = requestAnimationFrame(updateTime);
    };
    
    progressAnimationRef.current = requestAnimationFrame(updateTime);
  };

  // Start/stop progress tracking when playing state changes
  useEffect(() => {
    if (isPlaying && audioProcessor && isProcessed) {
      updateProgressForProcessor();
    } else if (!isPlaying && progressAnimationRef.current) {
      cancelAnimationFrame(progressAnimationRef.current);
      progressAnimationRef.current = null;
    }
    
    return () => {
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
        progressAnimationRef.current = null;
      }
    };
  }, [isPlaying, audioProcessor, isProcessed]);

  const handleTimeChange = (value: number[]) => {
    const newTime = value[0];
    
    // Stop the animation frame to prevent conflicts
    if (progressAnimationRef.current) {
      cancelAnimationFrame(progressAnimationRef.current);
      progressAnimationRef.current = null;
    }
    
    // Update the time state
    setCurrentTime(newTime);
    
    if (audioProcessor && isProcessed) {
      audioProcessor.seekTo(newTime);
      
      // If it was playing before seeking, resume playback from new position
      if (isPlaying) {
        updateProgressForProcessor();
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSliderPointerDown = () => {
    // Store playing state before seek
    wasPlayingBeforeSeek.current = isPlaying;
    
    // Pause while seeking
    if (isPlaying) {
      if (audioProcessor && isProcessed) {
        audioProcessor.pause();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      // Don't change the isPlaying state yet
    }
  };

  const handleSliderPointerUp = () => {
    // Resume if it was playing before
    if (wasPlayingBeforeSeek.current) {
      if (audioProcessor && isProcessed) {
        audioProcessor.play(currentTime);
        // The updateProgressForProcessor will be called via the isPlaying effect
      } else if (audioRef.current) {
        audioRef.current.play().catch(err => console.error("Error resuming audio:", err));
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (audioProcessor && isProcessed) {
      audioProcessor.setVolume?.(newVolume);
    } else if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleAmbientVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setAmbientVolume(newVolume);
    
    if (audioProcessor && isProcessed && audioProcessor.setAmbientVolume) {
      audioProcessor.setAmbientVolume(newVolume);
    } else if (ambientRef.current) {
      ambientRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const VolumeIcon = () => {
    if (volume === 0) return <VolumeX size={20} />;
    if (volume < 0.5) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  if (!audioUrl) {
    return (
      <div className="w-full h-24 bg-secondary/50 rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground text-2xl font-bangers tracking-wide">Upload a track to begin</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-secondary/50 rounded-xl p-5 backdrop-blur">
      <div className="flex items-center justify-center mb-4">
        <div className="mr-4">
          <Button 
            variant="outline" 
            size="icon" 
            className={cn("rounded-full transition-all transform w-12 h-12", 
              isPlaying ? "bg-primary text-primary-foreground scale-110" : "bg-secondary hover:bg-primary/20"
            )}
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </Button>
        </div>
        
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground font-bangers tracking-wide">{formatTime(currentTime)}</span>
            <span className="text-sm text-muted-foreground font-bangers tracking-wide">{formatTime(duration)}</span>
          </div>
          <Slider
            min={0}
            max={duration || 100}
            step={0.01}
            value={[currentTime]}
            onValueChange={handleTimeChange}
            onPointerDown={handleSliderPointerDown}
            onPointerUp={handleSliderPointerUp}
            className="my-1 h-3 cursor-pointer"
          />
          
          <AudioVisualizer isPlaying={isPlaying} audioProcessor={audioProcessor} />
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
            onValueChange={handleVolumeChange}
            className="w-28 ml-2"
          />
          <span className="text-sm ml-2 font-bangers tracking-wide">Track</span>
        </div>
        
        <div className="flex items-center">
          <Disc size={20} className="animate-spin" style={{ animationDuration: '3s' }} />
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[ambientVolume]}
            onValueChange={handleAmbientVolumeChange}
            className="w-28 ml-2"
          />
          <span className="text-sm ml-2 font-bangers tracking-wide">Ambient</span>
        </div>
      </div>
      
      {isProcessed && onDownload && (
        <div className="mt-4 flex justify-center">
          <Button 
            onClick={onDownload}
            variant="secondary"
            size="lg"
            className="bg-lofi-purple/20 hover:bg-lofi-purple/30 border-lofi-purple/30 text-lofi-purple font-bangers tracking-wide text-lg"
          >
            Download Lofi Track
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
