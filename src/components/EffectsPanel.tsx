
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Music4, Radio, Droplets, Film, Coffee } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
  const [effects, setEffects] = React.useState<EffectsSettings>({
    slowdown: 85, // 85% of original speed
    reverb: 30,   // 30% reverb
    lowpass: 50,  // 50% lowpass filtering
  });
  
  const [ambientSound, setAmbientSound] = React.useState('rain');
  
  const handleEffectChange = (effectName: keyof EffectsSettings, value: number[]) => {
    setEffects(prev => ({
      ...prev,
      [effectName]: value[0]
    }));
  };
  
  const handleApply = () => {
    onApplyEffects(effects, ambientSound);
  };

  return (
    <div className="bg-secondary/50 rounded-xl p-4 backdrop-blur">
      <h3 className="font-medium mb-4 text-gradient">Lofi Effects</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">Slowdown</Label>
            <span className="text-xs text-muted-foreground">{effects.slowdown}%</span>
          </div>
          <Slider 
            min={70} 
            max={100} 
            step={1}
            value={[effects.slowdown]}
            onValueChange={(val) => handleEffectChange('slowdown', val)}
            disabled={!audioUploaded || isProcessing}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">Reverb</Label>
            <span className="text-xs text-muted-foreground">{effects.reverb}%</span>
          </div>
          <Slider 
            min={0} 
            max={100} 
            step={1}
            value={[effects.reverb]}
            onValueChange={(val) => handleEffectChange('reverb', val)}
            disabled={!audioUploaded || isProcessing}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">Low Pass Filter</Label>
            <span className="text-xs text-muted-foreground">{effects.lowpass}%</span>
          </div>
          <Slider 
            min={0} 
            max={100} 
            step={1}
            value={[effects.lowpass]}
            onValueChange={(val) => handleEffectChange('lowpass', val)}
            disabled={!audioUploaded || isProcessing}
          />
        </div>
        
        <div className="pt-2">
          <Label className="text-sm mb-2 block">Ambient Sound</Label>
          <RadioGroup 
            value={ambientSound} 
            onValueChange={setAmbientSound}
            className="grid grid-cols-2 gap-2 pt-1"
            disabled={!audioUploaded || isProcessing}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rain" id="rain" className="sr-only" />
              <Label 
                htmlFor="rain" 
                className={`flex items-center space-x-1 p-2 rounded cursor-pointer transition-colors text-sm
                  ${ambientSound === 'rain' 
                    ? 'bg-primary/20 text-primary border-primary' 
                    : 'bg-secondary hover:bg-secondary/80'
                  }`}
              >
                <Droplets size={14} />
                <span>Rain</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="vinyl" id="vinyl" className="sr-only" />
              <Label 
                htmlFor="vinyl" 
                className={`flex items-center space-x-1 p-2 rounded cursor-pointer transition-colors text-sm
                  ${ambientSound === 'vinyl' 
                    ? 'bg-primary/20 text-primary border-primary' 
                    : 'bg-secondary hover:bg-secondary/80'
                  }`}
              >
                <Music4 size={14} />
                <span>Vinyl</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cafe" id="cafe" className="sr-only" />
              <Label 
                htmlFor="cafe" 
                className={`flex items-center space-x-1 p-2 rounded cursor-pointer transition-colors text-sm
                  ${ambientSound === 'cafe' 
                    ? 'bg-primary/20 text-primary border-primary' 
                    : 'bg-secondary hover:bg-secondary/80'
                  }`}
              >
                <Coffee size={14} />
                <span>Café</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fireplace" id="fireplace" className="sr-only" />
              <Label 
                htmlFor="fireplace" 
                className={`flex items-center space-x-1 p-2 rounded cursor-pointer transition-colors text-sm
                  ${ambientSound === 'fireplace' 
                    ? 'bg-primary/20 text-primary border-primary' 
                    : 'bg-secondary hover:bg-secondary/80'
                  }`}
              >
                <Radio size={14} />
                <span>Crackling</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <Button 
          onClick={handleApply} 
          disabled={!audioUploaded || isProcessing}
          className="w-full mt-2"
        >
          {isProcessing ? 'Processing...' : 'Apply Lofi Effects'}
        </Button>
      </div>
    </div>
  );
};

export default EffectsPanel;
