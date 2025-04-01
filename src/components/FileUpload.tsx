
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Cloud, FileAudio, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isProcessed: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, isProcessed }) => {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (isProcessed) {
      toast({
        title: "Reset required",
        description: "Please reset the current session before uploading a new file.",
        variant: "destructive",
        className: "bg-red-900/80 backdrop-blur-sm border-red-600"
      });
      return;
    }
    
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'video/mp4'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, OGG) or MP4 video.",
        variant: "destructive",
        className: "bg-red-900/80 backdrop-blur-sm border-red-600"
      });
      return;
    }
    
    // Save the selected file
    setSelectedFile(file);
    
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          // Once "upload" completes, process the file
          onFileSelected(file);
          
          setTimeout(() => {
            setUploadProgress(null);
          }, 500);
          
          return 100;
        }
        return prev + 5;
      });
    }, 30);
    
  }, [onFileSelected, toast, isProcessed]);
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'video/mp4': ['.mp4']
    },
    maxFiles: 1,
    disabled: isProcessed
  });

  const getFileIcon = () => {
    if (!selectedFile) return null;
    
    if (selectedFile.type.includes('audio')) {
      return <FileAudio className="h-5 w-5 mr-2 text-lofi-purple" />;
    } else if (selectedFile.type.includes('video')) {
      return <FileVideo className="h-5 w-5 mr-2 text-lofi-blue" />;
    }
    return null;
  };

  return (
    <div 
      {...getRootProps()} 
      className={`dropzone w-full h-48 rounded-xl flex flex-col items-center justify-center transition-all p-4 overflow-hidden
        ${isDragActive ? 'active border-dashed border-2 border-lofi-purple bg-lofi-purple/10' : ''}
        ${isDragReject ? 'border-destructive bg-destructive/10' : 'hover:border-lofi-purple/50 hover:bg-primary/5'}
        ${isProcessed ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
      <input {...getInputProps()} />
      
      {uploadProgress !== null ? (
        <div className="w-full max-w-xs">
          <p className="text-center mb-2 text-lg font-bangers tracking-wide">Uploading...</p>
          <Progress value={uploadProgress} className="h-2 bg-lofi-card" />
        </div>
      ) : selectedFile && !isProcessed ? (
        <div className="text-center">
          <div className="mb-3 bg-lofi-card/80 p-3 rounded-full inline-flex">
            {getFileIcon()}
          </div>
          <p className="font-bangers mb-1 text-2xl text-lofi-purple tracking-wide truncate max-w-full">{selectedFile.name}</p>
          <p className="text-lg text-muted-foreground">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to transform
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 bg-gradient-to-br from-lofi-purple/30 to-lofi-blue/30 p-4 rounded-full">
            {isDragActive ? (
              <Cloud className="h-8 w-8 text-lofi-purple animate-pulse" />
            ) : (
              <Cloud className="h-8 w-8 text-lofi-purple/70" />
            )}
          </div>
          <p className="text-center mb-1 font-medium text-lofi-purple font-bangers tracking-wider text-3xl">
            {isDragActive ? 'Drop to upload' : 'Drag and drop your audio'}
          </p>
          <p className="text-2xl text-muted-foreground mb-4 font-bangers tracking-wide">MP3, WAV, OGG or MP4 video</p>
          <Button 
            variant="outline" 
            size="lg" 
            className="text-2xl bg-lofi-card border-lofi-purple/30 hover:bg-lofi-hover font-bangers tracking-wide py-6 px-8"
            disabled={isProcessed}
          >
            Browse files
          </Button>
        </>
      )}
    </div>
  );
};

export default FileUpload;
