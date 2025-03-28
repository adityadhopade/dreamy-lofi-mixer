
import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import AudioPlayer from '@/components/AudioPlayer';
import EffectsPanel, { EffectsSettings } from '@/components/EffectsPanel';
import { ambientSounds, demoTracks } from '@/assets/sounds';
import { Music, HeadphonesIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [ambientSoundUrl, setAmbientSoundUrl] = useState<string | null>(null);

  const handleFileSelected = (file: File) => {
    setUploadedFile(file);
    // Create URL for the original file for preview
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
    
    // Simulate processing with a timeout
    setTimeout(() => {
      console.log("Applying effects:", effects);
      console.log("Selected ambient sound:", ambientType);
      
      // For demo purposes, we'll reuse the same audio but pretend it's processed
      // In a real implementation, we would send this to a backend for processing
      
      // Set the ambient sound based on selection
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
    <div className="min-h-screen bg-lofi-black text-foreground flex flex-col">
      {/* Header */}
      <header className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <HeadphonesIcon className="w-8 h-8 text-lofi-accent mr-2" />
          <h1 className="text-2xl font-bold text-gradient">Dreamy Lofi Mixer</h1>
        </div>
        <p className="text-center text-muted-foreground mt-2">
          Transform your music into chill, lo-fi vibes
        </p>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 px-4 py-6 max-w-4xl">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column: Upload and Audio Player */}
          <div className="space-y-6">
            <div className="bg-secondary/30 p-4 rounded-xl backdrop-blur">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <Music className="w-5 h-5 mr-2 text-lofi-accent" />
                Upload Your Track
              </h2>
              <FileUpload onFileSelected={handleFileSelected} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {isProcessed ? "Lofi Version" : "Preview"}
              </h3>
              <AudioPlayer 
                audioUrl={audioUrl} 
                isProcessed={isProcessed}
                ambientSoundUrl={ambientSoundUrl}
              />
            </div>
          </div>
          
          {/* Right Column: Effects and Processing */}
          <div>
            <EffectsPanel 
              onApplyEffects={handleApplyEffects}
              isProcessing={isProcessing}
              audioUploaded={!!uploadedFile}
            />
            
            {/* Info Section */}
            <div className="mt-6 bg-secondary/30 rounded-xl p-4 backdrop-blur">
              <h3 className="font-medium mb-2">How It Works</h3>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>Upload your audio or video file</li>
                <li>Adjust the lofi effect settings</li>
                <li>Select an ambient background sound</li>
                <li>Click "Apply Lofi Effects" to transform</li>
                <li>Enjoy your chill, lofi track!</li>
              </ol>
            </div>
          </div>
        </div>
        
        {/* Quick Demo Section */}
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
              className="text-primary underline text-sm hover:text-primary/80"
            >
              Try with a demo track
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="container mx-auto p-4 text-center text-xs text-muted-foreground">
        <p>Dreamy Lofi Mixer · Turn any track into a chill lofi experience</p>
      </footer>
    </div>
  );
};

export default Index;
