
import React, { useState, useRef, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import AudioPlayer from '@/components/AudioPlayer';
import EffectsPanel, { EffectsSettings } from '@/components/EffectsPanel';
import { ambientSounds } from '@/assets/sounds';
import { HeadphonesIcon, AudioWaveform, Disc, BrainCircuit, Download, Music, Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AudioProcessor } from '@/utils/audioProcessor';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [ambientSoundUrl, setAmbientSoundUrl] = useState<string | null>(null);
  const [currentEffects, setCurrentEffects] = useState<EffectsSettings | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);

  useEffect(() => {
    // This toast notification will show when the page first loads
    toast({
      description: "Currently, only one audio file can be processed at a time. To upload a new track, please refresh the page.",
      duration: 8000,
      className: "bg-lofi-card/90 border-lofi-purple/30 backdrop-blur-sm text-foreground",
    });
  }, []);

  const handleFileSelected = (file: File) => {
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setIsProcessed(false);
    
    const audioProcessor = new AudioProcessor();
    audioProcessorRef.current = audioProcessor;
    
    audioProcessor.loadAudioFile(file).catch(err => {
      console.error("Error loading audio file:", err);
      toast({
        title: "Error loading audio",
        description: "There was a problem loading your audio file.",
        variant: "destructive",
        className: "bg-red-900/80 backdrop-blur-sm border-red-600"
      });
    });
    
    toast({
      description: `${file.name} is ready to be transformed into lofi.`,
      className: "bg-lofi-card/90 border-lofi-purple/30 backdrop-blur-sm text-foreground",
    });
  };

  const handleApplyEffects = async (effects: EffectsSettings, ambientType: string) => {
    setIsProcessing(true);
    setCurrentEffects(effects);
    
    if (!audioProcessorRef.current) {
      toast({
        title: "Error processing audio",
        description: "Audio processor not initialized. Try uploading your file again.",
        variant: "destructive",
        className: "bg-red-900/80 backdrop-blur-sm border-red-600"
      });
      setIsProcessing(false);
      return;
    }
    
    try {
      audioProcessorRef.current.setEffectsSettings(effects);
      
      let ambientUrl = null;
      if (ambientType !== 'none') {
        ambientUrl = ambientSounds[ambientType as keyof typeof ambientSounds];
        if (ambientUrl) {
          await audioProcessorRef.current.loadAmbientSound(ambientUrl);
        }
      }
      setAmbientSoundUrl(ambientUrl);
      
      // Show a toast while processing
      toast({
        description: "Processing your track with lofi effects...",
        className: "bg-lofi-card/90 border-lofi-purple/30 backdrop-blur-sm text-foreground",
      });
      
      setTimeout(() => {
        setIsProcessing(false);
        setIsProcessed(true);
        
        toast({
          description: "Your track has been transformed with lofi effects. Hit play to listen or download your creation.",
          className: "bg-lofi-card/90 border-lofi-purple/30 backdrop-blur-sm text-foreground",
        });
      }, 1500);
    } catch (error) {
      console.error("Error applying effects:", error);
      setIsProcessing(false);
      
      toast({
        title: "Error processing audio",
        description: "There was a problem applying the lofi effects.",
        variant: "destructive",
        className: "bg-red-900/80 backdrop-blur-sm border-red-600"
      });
    }
  };

  const handleDownload = async () => {
    if (!audioProcessorRef.current || !uploadedFile || !isProcessed || !currentEffects) {
      toast({
        title: "Cannot download",
        description: "Please upload a file and apply lofi effects first.",
        variant: "destructive",
        className: "bg-red-900/80 backdrop-blur-sm border-red-600"
      });
      return;
    }
    
    try {
      toast({
        description: "We're processing your lofi track. This may take a moment...",
        className: "bg-lofi-card/90 border-lofi-purple/30 backdrop-blur-sm text-foreground",
      });
      
      const blob = await audioProcessorRef.current.createProcessedAudioBlob();
      
      if (!blob) {
        throw new Error("Failed to create audio blob");
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const originalName = uploadedFile.name.replace(/\.[^/.]+$/, "");
      a.download = `${originalName}_lofi.wav`;
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        description: "Your lofi track is being downloaded.",
        className: "bg-lofi-card/90 border-lofi-purple/30 backdrop-blur-sm text-foreground",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download failed",
        description: "There was a problem creating your lofi download.",
        variant: "destructive",
        className: "bg-red-900/80 backdrop-blur-sm border-red-600"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lofi-black to-lofi-black/95 text-foreground flex flex-col">
      <header className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div className="bg-gradient-to-r from-lofi-gradient1 to-lofi-gradient2 p-0.5 rounded-full">
            <div className="bg-lofi-black rounded-full p-2">
              <HeadphonesIcon className="w-12 h-12 text-lofi-purple" />
            </div>
          </div>
          <h1 className="text-6xl font-bold ml-4 bg-gradient-to-r from-lofi-purple to-lofi-blue bg-clip-text text-transparent font-bangers tracking-wider">
            Dreamy Lofi Creator
          </h1>
        </div>
        <p className="text-center text-muted-foreground mt-4 max-w-md mx-auto font-bangers text-3xl tracking-wide">
          Transform your music into chill, lofi vibes with our AI-powered audio processor
        </p>
      </header>

      <main className="container mx-auto flex-1 px-4 py-8 max-w-5xl">
        <Alert variant="lofi" className="mb-8 backdrop-blur-lg">
          <InfoIcon className="h-5 w-5 text-lofi-purple" />
          <AlertDescription className="text-xl font-medium">
            Currently, only one audio file can be processed at a time. To upload a new track, please refresh the page.
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Card className="border-0 bg-lofi-card shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-3xl font-medium flex items-center text-lofi-purple font-bangers tracking-wide">
                    <Disc className="w-8 h-8 mr-3 animate-spin" style={{ animationDuration: '8s' }} />
                    Upload Your Track
                  </h2>
                </div>
                <FileUpload 
                  onFileSelected={handleFileSelected}
                  isProcessed={isProcessed}
                />
              </CardContent>
            </Card>
            
            <div className="space-y-3 min-h-[400px]">
              {(audioUrl && !isProcessed) ? (
                <div className="flex flex-col items-center justify-center h-full bg-lofi-card/50 rounded-xl p-4 backdrop-blur min-h-[400px]">
                  <Disc className="text-muted-foreground h-16 w-16 mb-4 opacity-20 animate-spin" style={{ animationDuration: '8s' }} />
                  <p className="text-muted-foreground text-3xl font-bangers tracking-wide">
                    Apply effects to preview your lofi track
                  </p>
                </div>
              ) : (audioUrl && isProcessed) ? (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-3xl font-medium text-lofi-purple flex items-center font-bangers tracking-wide">
                      <AudioWaveform className="w-6 h-6 mr-2 animate-pulse-slow" /> 
                      Lofi Version
                    </h3>
                  </div>
                  <div className="transform transition-all duration-300 hover:scale-[1.01] min-h-[400px]">
                    <AudioPlayer 
                      audioUrl={audioUrl} 
                      isProcessed={isProcessed}
                      ambientSoundUrl={ambientSoundUrl}
                      audioProcessor={audioProcessorRef.current}
                      onDownload={handleDownload}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-lofi-card/50 rounded-xl p-4 backdrop-blur min-h-[400px]">
                  <Disc className="text-muted-foreground h-16 w-16 mb-4 opacity-20" />
                  <p className="text-muted-foreground text-3xl font-bangers tracking-wide">
                    Upload a track to begin
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <Card className="border-0 bg-lofi-card shadow-lg overflow-hidden h-full">
              <CardContent className="p-6">
                <h2 className="text-3xl font-medium mb-5 flex items-center text-lofi-purple font-bangers tracking-wide">
                  <BrainCircuit className="w-8 h-8 mr-3 animate-pulse-slow" />
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
        
        <div className="mt-16 bg-lofi-card rounded-xl p-8 border border-lofi-purple/20 shadow-lg w-full">
          <h3 className="font-bangers tracking-wide text-4xl text-lofi-purple text-center mb-8">How It Works</h3>
          <div className="grid md:grid-cols-5 gap-6 text-center">
            <div className="p-6 bg-lofi-black/50 rounded-lg hover:bg-lofi-black/70 transition-colors transform hover:scale-105 duration-300">
              <div className="bg-lofi-purple/20 rounded-full p-4 w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Music className="text-lofi-purple w-12 h-12" />
              </div>
              <p className="font-bangers text-2xl tracking-wide text-lofi-purple mb-2">1. Upload Audio</p>
              <p className="text-lg text-muted-foreground">Upload your favorite audio or video file</p>
            </div>
            
            <div className="p-6 bg-lofi-black/50 rounded-lg hover:bg-lofi-black/70 transition-colors transform hover:scale-105 duration-300">
              <div className="bg-lofi-blue/20 rounded-full p-4 w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <AudioWaveform className="text-lofi-blue w-12 h-12" />
              </div>
              <p className="font-bangers text-2xl tracking-wide text-lofi-blue mb-2">2. Adjust Effects</p>
              <p className="text-lg text-muted-foreground">Tweak lofi settings to your preference</p>
            </div>
            
            <div className="p-6 bg-lofi-black/50 rounded-lg hover:bg-lofi-black/70 transition-colors transform hover:scale-105 duration-300">
              <div className="bg-lofi-teal/20 rounded-full p-4 w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Disc className="text-lofi-teal w-12 h-12" />
              </div>
              <p className="font-bangers text-2xl tracking-wide text-lofi-teal mb-2">3. Add Ambience</p>
              <p className="text-lg text-muted-foreground">Choose ambient backgrounds for atmosphere</p>
            </div>
            
            <div className="p-6 bg-lofi-black/50 rounded-lg hover:bg-lofi-black/70 transition-colors transform hover:scale-105 duration-300">
              <div className="bg-lofi-yellow/20 rounded-full p-4 w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <BrainCircuit className="text-lofi-yellow w-12 h-12" />
              </div>
              <p className="font-bangers text-2xl tracking-wide text-lofi-yellow mb-2">4. Transform</p>
              <p className="text-lg text-muted-foreground">Process your track with AI-powered effects</p>
            </div>
            
            <div className="p-6 bg-lofi-black/50 rounded-lg hover:bg-lofi-black/70 transition-colors transform hover:scale-105 duration-300">
              <div className="bg-lofi-pink/20 rounded-full p-4 w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Download className="text-lofi-pink w-12 h-12" />
              </div>
              <p className="font-bangers text-2xl tracking-wide text-lofi-pink mb-2">5. Download</p>
              <p className="text-lg text-muted-foreground">Save your perfect lofi creation</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-lofi-black mt-16 pt-12 pb-8 border-t border-lofi-purple/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-8">
            <HeadphonesIcon className="w-10 h-10 text-lofi-purple mr-3" />
            <span className="font-bangers text-4xl tracking-wider bg-gradient-to-r from-lofi-purple to-lofi-blue bg-clip-text text-transparent">
              Dreamy Lofi Creator
            </span>
          </div>
          
          <div className="text-center border-t border-lofi-purple/10 pt-8">
            <p className="text-2xl text-muted-foreground mb-2 font-bangers tracking-wide">
              Made with <Heart className="inline h-5 w-5 text-lofi-pink" /> for all lofi enthusiasts
            </p>
            <p className="text-xl text-muted-foreground font-bangers tracking-wide">
              © {new Date().getFullYear()} Dreamy Lofi Creator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
