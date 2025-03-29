
import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { 
  Music4, Radio, Droplets, Film, Coffee, Wind, 
  Waves, Flame, Fan, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface EffectsPanelProps {
  onApplyEffects: (effects: EffectsSettings, ambientType: string) => void;
  isProcessing: boolean;
  audioUploaded: boolean;
}

export interface EffectsSettings {
  slowdown: number;
  reverb: number;
  lowpass: number;
}

const EffectsPanel: React.FC<EffectsPanelProps> = ({ onApplyEffects, isProcessing, audioUploaded }) => {
  const [effects, setEffects] = useState<EffectsSettings>({
    slowdown: 85, // 85% of original speed
    reverb: 30,   // 30% reverb
    lowpass: 50,  // 50% lowpass filtering
  });
  
  const [ambientSound, setAmbientSound] = useState('rain');
  
  const handleEffectChange = (effectName: keyof EffectsSettings, value: number[]) => {
    setEffects(prev => ({
      ...prev,
      [effectName]: value[0]
    }));
  };
  
  const handleApply = () => {
    onApplyEffects(effects, ambientSound);
  };

  // Ambient sound options
  const ambientOptions = [
    { id: 'rain', label: 'Rain', icon: <Droplets size={18} /> },
    { id: 'vinyl', label: 'Vinyl', icon: <Music4 size={18} /> },
    { id: 'cafe', label: 'Café', icon: <Coffee size={18} /> },
    { id: 'fireplace', label: 'Fireplace', icon: <Flame size={18} /> },
    { id: 'waves', label: 'Ocean', icon: <Waves size={18} /> },
    { id: 'wind', label: 'Wind', icon: <Wind size={18} /> },
    { id: 'fan', label: 'Fan', icon: <Fan size={18} /> },
    { id: 'none', label: 'None', icon: <Radio size={18} /> }
  ];

  return (
    <div className="bg-secondary/50 rounded-xl p-6 backdrop-blur">
      <h3 className="font-medium mb-8 text-gradient font-bangers tracking-wide text-3xl text-center">Lofi Effects</h3>
      
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label className="text-2xl font-bangers tracking-wide">Slowdown</Label>
            <span className="text-xl text-muted-foreground font-bangers">{effects.slowdown}%</span>
          </div>
          <div className="relative pt-2">
            <div className="absolute -top-2 left-0 w-full flex justify-between text-sm text-muted-foreground">
              <span>Slower</span>
              <span>Original</span>
            </div>
            <Slider 
              min={70} 
              max={100} 
              step={1}
              value={[effects.slowdown]}
              onValueChange={(val) => handleEffectChange('slowdown', val)}
              disabled={!audioUploaded || isProcessing}
              className="h-3"
            />
          </div>
          <p className="text-lg text-muted-foreground mt-2">
            Slows down the track for that classic lofi vibe. Lower values create a more dreamlike sound.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label className="text-2xl font-bangers tracking-wide">Reverb</Label>
            <span className="text-xl text-muted-foreground font-bangers">{effects.reverb}%</span>
          </div>
          <div className="relative pt-2">
            <div className="absolute -top-2 left-0 w-full flex justify-between text-sm text-muted-foreground">
              <span>Dry</span>
              <span>Wet</span>
            </div>
            <Slider 
              min={0} 
              max={100} 
              step={1}
              value={[effects.reverb]}
              onValueChange={(val) => handleEffectChange('reverb', val)}
              disabled={!audioUploaded || isProcessing}
              className="h-3"
            />
          </div>
          <p className="text-lg text-muted-foreground mt-2">
            Adds spaciousness and atmosphere to the track. Higher values create a more distant, dreamy sound.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label className="text-2xl font-bangers tracking-wide">Low Pass Filter</Label>
            <span className="text-xl text-muted-foreground font-bangers">{effects.lowpass}%</span>
          </div>
          <div className="relative pt-2">
            <div className="absolute -top-2 left-0 w-full flex justify-between text-sm text-muted-foreground">
              <span>Clear</span>
              <span>Muffled</span>
            </div>
            <Slider 
              min={0} 
              max={100} 
              step={1}
              value={[effects.lowpass]}
              onValueChange={(val) => handleEffectChange('lowpass', val)}
              disabled={!audioUploaded || isProcessing}
              className="h-3"
            />
          </div>
          <p className="text-lg text-muted-foreground mt-2">
            Removes high frequencies for the warm, cozy lofi sound. Higher values create a more "underwater" effect.
          </p>
        </div>
        
        <div className="pt-4">
          <Label className="text-2xl mb-4 block font-bangers tracking-wide">Ambient Sound</Label>
          
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {ambientOptions.map((option) => (
                <CarouselItem key={option.id} className="basis-1/3 md:basis-1/3 lg:basis-1/3">
                  <div className="p-1">
                    <RadioGroup value={ambientSound} onValueChange={setAmbientSound} disabled={!audioUploaded || isProcessing}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                        <Label 
                          htmlFor={option.id} 
                          className={`flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 h-28
                            ${ambientSound === option.id 
                              ? 'bg-lofi-purple/30 text-lofi-purple border-lofi-purple shadow-md scale-105' 
                              : 'bg-secondary hover:bg-lofi-purple/20 hover:text-lofi-purple hover:scale-105'
                            }`}
                        >
                          <div className={`p-3 rounded-full ${ambientSound === option.id ? 'bg-lofi-purple/20' : 'bg-lofi-black/30'}`}>
                            {option.icon}
                          </div>
                          <span className="mt-2 font-bangers tracking-wide text-xl">{option.label}</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 bg-lofi-purple/20 hover:bg-lofi-purple/40 border-0" />
            <CarouselNext className="right-0 bg-lofi-purple/20 hover:bg-lofi-purple/40 border-0" />
          </Carousel>
        </div>
        
        <Button 
          onClick={handleApply} 
          disabled={!audioUploaded || isProcessing}
          className="w-full mt-8 text-2xl font-bangers tracking-wide h-16 bg-lofi-purple hover:bg-lofi-purple/80"
        >
          {isProcessing ? 'Processing...' : 'Apply Lofi Effects'}
        </Button>
      </div>
    </div>
  );
};

export default EffectsPanel;
