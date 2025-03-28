
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Cloud, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected }) => {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { toast } = useToast();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'video/mp4'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, OGG) or MP4 video.",
        variant: "destructive"
      });
      return;
    }
    
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
    }, 50);
    
  }, [onFileSelected, toast]);
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'video/mp4': ['.mp4']
    },
    maxFiles: 1
  });

  return (
    <div 
      {...getRootProps()} 
      className={`dropzone w-full h-48 rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer p-4
        ${isDragActive ? 'active' : ''}
        ${isDragReject ? 'border-destructive bg-destructive/10' : 'hover:border-primary/50 hover:bg-primary/5'}`}
    >
      <input {...getInputProps()} />
      
      {uploadProgress !== null ? (
        <div className="w-full max-w-xs">
          <p className="text-center mb-2 text-sm">Uploading...</p>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      ) : (
        <>
          <div className="mb-4 bg-secondary/80 p-3 rounded-full">
            {isDragActive ? (
              <Cloud className="h-6 w-6 text-primary animate-pulse" />
            ) : (
              <Music className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <p className="text-center mb-1 font-medium">
            {isDragActive ? 'Drop to upload' : 'Drag and drop your audio'}
          </p>
          <p className="text-xs text-muted-foreground mb-3">MP3, WAV, OGG or MP4 video</p>
          <Button variant="outline" size="sm" className="text-xs">
            Browse files
          </Button>
        </>
      )}
    </div>
  );
};

export default FileUpload;
