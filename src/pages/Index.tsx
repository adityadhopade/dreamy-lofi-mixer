
import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import AudioPlayer from '@/components/AudioPlayer';
import EffectsPanel, { EffectsSettings } from '@/components/EffectsPanel';
import { ambientSounds, demoTracks } from '@/assets/sounds';
import { HeadphonesIcon, AudioWaveform, Disc, BrainCircuit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [ambientSoundUrl, setAmbientSoundUrl] = useState<string | null>(null);

  const handleFileSelected = (file: File) => {
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setIsProcessed(false);
    
    toast({
      title: "File uploaded successfully",
      description: `${file.name} is ready to be transformed into lofi.`,
    });
  };

  const handleApplyEffects = (effects: EffectsSettings, ambientType: string) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      console.log("Applying effects:", effects);
      console.log("Selected ambient sound:", ambientType);
      
      setAmbientSoundUrl(ambientSounds[ambientType as keyof typeof ambientSounds]);
      
      setIsProcessing(false);
      setIsProcessed(true);
      
      toast({
        title: "Lofi transformation complete!",
        description: "Your track has been transformed with lofi effects.",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lofi-black to-lofi-black/95 text-foreground flex flex-col">
      <header className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <div className="bg-gradient-to-r from-lofi-gradient1 to-lofi-gradient2 p-0.5 rounded-full">
            <div className="bg-lofi-black rounded-full p-2">
              <HeadphonesIcon className="w-8 h-8 text-lofi-purple" />
            </div>
          </div>
          <h1 className="text-3xl font-bold ml-3 bg-gradient-to-r from-lofi-purple to-lofi-blue bg-clip-text text-transparent">
            Dreamy Lofi Creator
          </h1>
        </div>
        <p className="text-center text-muted-foreground mt-2 max-w-md mx-auto">
          Transform your music into chill, lofi vibes with our AI-powered audio processor
        </p>
      </header>

      <main className="container mx-auto flex-1 px-4 py-6 max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Card className="border-0 bg-lofi-card shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <h2 className="text-xl font-medium mb-4 flex items-center text-lofi-purple">
                  <Disc className="w-5 h-5 mr-2 animate-spin" style={{ animationDuration: '8s' }} />
                  Upload Your Track
                </h2>
                <FileUpload 
                  onFileSelected={handleFileSelected}
                  isProcessed={isProcessed}
                />
              </CardContent>
            </Card>
            
            <div className="space-y-2">
              {(audioUrl && isProcessed) ? (
                <>
                  <h3 className="text-sm font-medium text-lofi-purple flex items-center">
                    <AudioWaveform className="w-4 h-4 mr-1 animate-pulse-slow" /> 
                    Lofi Version
                  </h3>
                  <div className="transform transition-all duration-300 hover:scale-[1.01]">
                    <AudioPlayer 
                      audioUrl={audioUrl} 
                      isProcessed={isProcessed}
                      ambientSoundUrl={ambientSoundUrl}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-56 bg-lofi-card/50 rounded-xl p-4 backdrop-blur">
                  <Disc className="text-muted-foreground h-16 w-16 mb-4 opacity-20" />
                  <p className="text-muted-foreground text-sm">
                    {uploadedFile ? "Apply effects to preview your lofi track" : "Upload a track to begin"}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <Card className="border-0 bg-lofi-card shadow-lg overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-medium mb-4 flex items-center text-lofi-purple">
                  <BrainCircuit className="w-5 h-5 mr-2 animate-pulse-slow" />
                  Lofi Transformation
                </h2>
                <EffectsPanel 
                  onApplyEffects={handleApplyEffects}
                  isProcessing={isProcessing}
                  audioUploaded={!!uploadedFile && !isProcessed}
                />
              </CardContent>
            </Card>
            
            <div className="mt-6 bg-lofi-card rounded-xl p-6 border border-lofi-purple/20 shadow-lg">
              <h3 className="font-medium mb-3 text-lofi-purple">How It Works</h3>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>Upload your audio or video file</li>
                <li>Adjust the lofi effect settings</li>
                <li>Select an ambient background sound</li>
                <li>Click "Apply Lofi Effects" to transform</li>
                <li>Download or share your chill, lofi track</li>
              </ol>
            </div>
          </div>
        </div>
        
        {!uploadedFile && (
          <div className="mt-8 text-center">
            <h3 className="text-muted-foreground mb-2">Don't have a track to upload?</h3>
            <button 
              onClick={() => {
                setAudioUrl(demoTracks[0].url);
                toast({
                  title: "Demo track loaded",
                  description: "Try applying lofi effects to this sample track.",
                });
              }}
              className="text-lofi-purple underline text-sm hover:text-lofi-blue transition-colors"
            >
              Try with a demo track
            </button>
          </div>
        )}
      </main>

      <footer className="container mx-auto p-4 text-center text-xs text-muted-foreground">
        <p className="bg-gradient-to-r from-lofi-purple/70 to-lofi-blue/70 bg-clip-text text-transparent">
          Dreamy Lofi Creator · Turn any track into a chill lofi experience
        </p>
      </footer>
    </div>
  );
};

export default Index;
