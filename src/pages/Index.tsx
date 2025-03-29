
import React, { useState, useRef } from 'react';
import FileUpload from '@/components/FileUpload';
import AudioPlayer from '@/components/AudioPlayer';
import EffectsPanel, { EffectsSettings } from '@/components/EffectsPanel';
import { ambientSounds, demoTracks } from '@/assets/sounds';
import { HeadphonesIcon, AudioWaveform, Disc, BrainCircuit, Download, Music, Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AudioProcessor } from '@/utils/audioProcessor';

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [ambientSoundUrl, setAmbientSoundUrl] = useState<string | null>(null);
  const [currentEffects, setCurrentEffects] = useState<EffectsSettings | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);

  const handleFileSelected = (file: File) => {
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setIsProcessed(false);
    
    // Initialize the audio processor
    const audioProcessor = new AudioProcessor();
    audioProcessorRef.current = audioProcessor;
    
    // Load the audio file
    audioProcessor.loadAudioFile(file).catch(err => {
      console.error("Error loading audio file:", err);
      toast({
        title: "Error loading audio",
        description: "There was a problem loading your audio file.",
        variant: "destructive"
      });
    });
    
    toast({
      title: "File uploaded successfully",
      description: `${file.name} is ready to be transformed into lofi.`,
    });
  };

  const handleApplyEffects = async (effects: EffectsSettings, ambientType: string) => {
    setIsProcessing(true);
    setCurrentEffects(effects);
    
    if (!audioProcessorRef.current) {
      toast({
        title: "Error processing audio",
        description: "Audio processor not initialized. Try uploading your file again.",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }
    
    try {
      // Apply the effects
      audioProcessorRef.current.setEffectsSettings(effects);
      
      // Load ambient sound
      const ambientUrl = ambientSounds[ambientType as keyof typeof ambientSounds];
      setAmbientSoundUrl(ambientUrl);
      
      if (ambientUrl) {
        await audioProcessorRef.current.loadAmbientSound(ambientUrl);
      }
      
      setIsProcessing(false);
      setIsProcessed(true);
      
      toast({
        title: "Lofi transformation complete!",
        description: "Your track has been transformed with lofi effects.",
      });
    } catch (error) {
      console.error("Error applying effects:", error);
      setIsProcessing(false);
      
      toast({
        title: "Error processing audio",
        description: "There was a problem applying the lofi effects.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async () => {
    if (!audioProcessorRef.current || !uploadedFile || !isProcessed || !currentEffects) {
      toast({
        title: "Cannot download",
        description: "Please upload a file and apply lofi effects first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const blob = await audioProcessorRef.current.createProcessedAudioBlob();
      
      if (!blob) {
        throw new Error("Failed to create audio blob");
      }
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Generate a nice filename
      const originalName = uploadedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
      a.download = `${originalName}_lofi.wav`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Download started",
        description: "Your lofi track is being downloaded.",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download failed",
        description: "There was a problem creating your lofi download.",
        variant: "destructive"
      });
    }
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
          <h1 className="text-4xl font-bold ml-3 bg-gradient-to-r from-lofi-purple to-lofi-blue bg-clip-text text-transparent font-bangers tracking-wider">
            Dreamy Lofi Creator
          </h1>
        </div>
        <p className="text-center text-muted-foreground mt-2 max-w-md mx-auto font-medium text-lg">
          Transform your music into chill, lofi vibes with our AI-powered audio processor
        </p>
      </header>

      <main className="container mx-auto flex-1 px-4 py-6 max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Card className="border-0 bg-lofi-card shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <h2 className="text-2xl font-medium mb-4 flex items-center text-lofi-purple font-bangers tracking-wide">
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
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-lofi-purple flex items-center font-bangers">
                      <AudioWaveform className="w-4 h-4 mr-1 animate-pulse-slow" /> 
                      Lofi Version
                    </h3>
                    <Button 
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      className="bg-lofi-purple/20 hover:bg-lofi-purple/30 border-lofi-purple/30 text-lofi-purple"
                    >
                      <Download className="w-4 h-4 mr-1" /> Download Track
                    </Button>
                  </div>
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
                  <p className="text-muted-foreground text-lg font-bangers tracking-wide">
                    {uploadedFile ? "Apply effects to preview your lofi track" : "Upload a track to begin"}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <Card className="border-0 bg-lofi-card shadow-lg overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-2xl font-medium mb-4 flex items-center text-lofi-purple font-bangers tracking-wide">
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
          </div>
        </div>
        
        <div className="mt-8 bg-lofi-card rounded-xl p-6 border border-lofi-purple/20 shadow-lg w-full">
          <h3 className="font-medium mb-3 text-2xl text-lofi-purple font-bangers tracking-wide text-center">How It Works</h3>
          <div className="grid md:grid-cols-5 gap-4 text-center">
            <div className="p-4 bg-lofi-black/50 rounded-lg hover:bg-lofi-black/70 transition-colors">
              <div className="bg-lofi-purple/20 rounded-full p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                <Music className="text-lofi-purple w-7 h-7" />
              </div>
              <p className="font-bangers text-lg tracking-wide text-lofi-purple">1. Upload Audio</p>
              <p className="text-sm text-muted-foreground">Upload your favorite audio or video file</p>
            </div>
            
            <div className="p-4 bg-lofi-black/50 rounded-lg hover:bg-lofi-black/70 transition-colors">
              <div className="bg-lofi-blue/20 rounded-full p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                <AudioWaveform className="text-lofi-blue w-7 h-7" />
              </div>
              <p className="font-bangers text-lg tracking-wide text-lofi-blue">2. Adjust Effects</p>
              <p className="text-sm text-muted-foreground">Tweak lofi settings to your preference</p>
            </div>
            
            <div className="p-4 bg-lofi-black/50 rounded-lg hover:bg-lofi-black/70 transition-colors">
              <div className="bg-lofi-teal/20 rounded-full p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                <Disc className="text-lofi-teal w-7 h-7" />
              </div>
              <p className="font-bangers text-lg tracking-wide text-lofi-teal">3. Add Ambience</p>
              <p className="text-sm text-muted-foreground">Choose ambient backgrounds for atmosphere</p>
            </div>
            
            <div className="p-4 bg-lofi-black/50 rounded-lg hover:bg-lofi-black/70 transition-colors">
              <div className="bg-lofi-yellow/20 rounded-full p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                <BrainCircuit className="text-lofi-yellow w-7 h-7" />
              </div>
              <p className="font-bangers text-lg tracking-wide text-lofi-yellow">4. Transform</p>
              <p className="text-sm text-muted-foreground">Process your track with AI-powered effects</p>
            </div>
            
            <div className="p-4 bg-lofi-black/50 rounded-lg hover:bg-lofi-black/70 transition-colors">
              <div className="bg-lofi-pink/20 rounded-full p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                <Download className="text-lofi-pink w-7 h-7" />
              </div>
              <p className="font-bangers text-lg tracking-wide text-lofi-pink">5. Download</p>
              <p className="text-sm text-muted-foreground">Save your perfect lofi creation</p>
            </div>
          </div>
        </div>
        
        {!uploadedFile && (
          <div className="mt-8 text-center">
            <h3 className="text-muted-foreground mb-2 text-lg font-bangers tracking-wide">Don't have a track to upload?</h3>
            <button 
              onClick={() => {
                setAudioUrl(demoTracks[0].url);
                toast({
                  title: "Demo track loaded",
                  description: "Try applying lofi effects to this sample track.",
                });
              }}
              className="text-lofi-purple underline text-lg hover:text-lofi-blue transition-colors font-bangers tracking-wide"
            >
              Try with a demo track
            </button>
          </div>
        )}
      </main>

      <footer className="bg-lofi-black mt-8 pt-8 pb-6 border-t border-lofi-purple/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <HeadphonesIcon className="w-6 h-6 text-lofi-purple mr-2" />
              <span className="font-bangers text-xl tracking-wider bg-gradient-to-r from-lofi-purple to-lofi-blue bg-clip-text text-transparent">
                Dreamy Lofi Creator
              </span>
            </div>
            
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-lofi-purple transition-colors">
                About
              </a>
              <a href="#" className="text-muted-foreground hover:text-lofi-purple transition-colors">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-lofi-purple transition-colors">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-lofi-purple transition-colors">
                Contact
              </a>
            </div>
          </div>
          
          <div className="text-center border-t border-lofi-purple/10 pt-6">
            <p className="text-sm text-muted-foreground mb-1">
              Made with <Heart className="inline h-3 w-3 text-lofi-pink" /> for all lofi enthusiasts
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Dreamy Lofi Creator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
