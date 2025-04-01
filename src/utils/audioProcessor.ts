// This is a more complete audio processing utility using Web Audio API
export class AudioProcessor {
  private context: AudioContext;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private lowpassNode: BiquadFilterNode | null = null;
  private highpassNode: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private ambientSourceNode: AudioBufferSourceNode | null = null;
  private ambientGainNode: GainNode | null = null;
  private ambientBuffer: AudioBuffer | null = null;
  private processingReady = false;
  private playing = false;
  private startTime = 0;
  private pauseTime = 0;
  private effectsSettings: { slowdown: number; reverb: number; lowpass: number } | null = null;
  private visualDataArray: Uint8Array | null = null;

  constructor() {
    this.context = new AudioContext();
  }

  async loadAudioFile(file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    this.setupNodes();
  }

  async loadAmbientSound(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.ambientBuffer = await this.context.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.error("Error loading ambient sound:", err);
    }
  }

  getAnalyserData(): Uint8Array | null {
    if (!this.analyserNode || !this.visualDataArray) return null;
    this.analyserNode.getByteFrequencyData(this.visualDataArray);
    return this.visualDataArray;
  }

  private setupNodes(): void {
    // Create basic nodes
    this.gainNode = this.context.createGain();
    
    // Create filter nodes
    this.lowpassNode = this.context.createBiquadFilter();
    this.lowpassNode.type = 'lowpass';
    
    this.highpassNode = this.context.createBiquadFilter();
    this.highpassNode.type = 'highpass';
    this.highpassNode.frequency.value = 20; // Default value
    
    // Create compressor for that lofi "squashed" sound
    this.compressorNode = this.context.createDynamicsCompressor();
    this.compressorNode.threshold.value = -24;
    this.compressorNode.knee.value = 30;
    this.compressorNode.ratio.value = 12;
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.25;
    
    // Create analyser for visualizations
    this.analyserNode = this.context.createAnalyser();
    this.analyserNode.fftSize = 256;
    const bufferLength = this.analyserNode.frequencyBinCount;
    this.visualDataArray = new Uint8Array(bufferLength);
    
    // Create reverb node
    this.createReverbNode();

    // Connect the nodes
    this.gainNode.connect(this.context.destination);
    
    this.processingReady = true;
  }

  private async createReverbNode(): Promise<void> {
    // Create impulse response for reverb
    const sampleRate = this.context.sampleRate;
    const length = 2 * sampleRate; // 2 seconds reverb tail
    const impulse = this.context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const impulseData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay for more natural reverb
        impulseData[i] = (Math.random() * 2 - 1) * Math.pow(0.8, i / (sampleRate * 0.2));
      }
    }
    
    this.reverbNode = this.context.createConvolver();
    this.reverbNode.buffer = impulse;
  }

  setEffectsSettings(effects: { slowdown: number; reverb: number; lowpass: number }): void {
    this.effectsSettings = effects;
    this.applyEffects(effects);
  }

  applyEffects(effects: { slowdown: number; reverb: number; lowpass: number }): void {
    if (!this.processingReady || !this.audioBuffer) return;

    // Configure lowpass filter effect
    if (this.lowpassNode) {
      // Map 0-100% to frequency range (100Hz to 20000Hz logarithmically)
      // Invert the effect (100% = most filtering, 0% = no filtering)
      const filterValue = 100 - effects.lowpass;
      const mappedFrequency = 100 + (20000 - 100) * (filterValue / 100);
      this.lowpassNode.frequency.value = mappedFrequency;
      
      // Add resonance for more characteristic lofi sound
      this.lowpassNode.Q.value = 1 + (effects.lowpass / 100) * 5;
    }
    
    // Configure highpass filter - subtle for lofi sound
    if (this.highpassNode) {
      // Higher lowpass effect means we also want a bit more highpass to get that "telephone" midrange sound
      const highpassValue = 20 + (effects.lowpass / 100) * 200;
      this.highpassNode.frequency.value = highpassValue;
    }
    
    // Configure compressor to add more "squash" as effects intensity increases
    if (this.compressorNode) {
      // More intense effects = more compression
      const averageEffectsIntensity = (effects.lowpass + effects.reverb) / 200;
      this.compressorNode.threshold.value = -24 - (averageEffectsIntensity * 12);
      this.compressorNode.ratio.value = 4 + (averageEffectsIntensity * 8);
    }
  }

  play(startTime: number = 0): void {
    if (this.playing) {
      this.pause();
    }
    
    if (!this.audioBuffer) return;
    
    // Create a new source node (they can only be used once)
    this.sourceNode = this.context.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    
    // Apply slowdown effect via playbackRate
    if (this.sourceNode && this.effectsSettings) {
      // Map 70-100% to playback rate (0.7 to 1.0)
      const playbackRate = this.effectsSettings.slowdown / 100;
      this.sourceNode.playbackRate.value = playbackRate;
    }
    
    // Connect the source to the processing chain
    if (this.lowpassNode && this.highpassNode && this.compressorNode && 
        this.reverbNode && this.analyserNode && this.gainNode) {
      const dryGain = this.context.createGain();
      const wetGain = this.context.createGain();
      
      if (this.effectsSettings) {
        // Calculate dry/wet mix for reverb
        dryGain.gain.value = 1 - (this.effectsSettings.reverb / 100);
        wetGain.gain.value = this.effectsSettings.reverb / 100 * 0.6; // Scale down reverb slightly
      }
      
      // Full signal chain with audio effects in logical order:
      // Source -> HighPass -> LowPass -> Compressor -> [Split to dry/wet paths] -> Gain -> Analyser -> Output
      this.sourceNode.connect(this.highpassNode);
      this.highpassNode.connect(this.lowpassNode);
      this.lowpassNode.connect(this.compressorNode);
      
      // Dry path (no reverb)
      this.compressorNode.connect(dryGain);
      dryGain.connect(this.gainNode);
      
      // Wet path (with reverb)
      this.compressorNode.connect(this.reverbNode);
      this.reverbNode.connect(wetGain);
      wetGain.connect(this.gainNode);
      
      // Connect to analyser for visualizations
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.context.destination);
    } else if (this.gainNode) {
      // Fallback simple connection if somehow our nodes aren't created
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.context.destination);
    }
    
    // Calculate the correct offset for playback
    this.startTime = this.context.currentTime - startTime;
    // Start the source from the specified position
    this.sourceNode.start(0, startTime);
    
    // Play ambient sound if available
    this.playAmbientSound();
    
    this.playing = true;
  }

  private playAmbientSound(): void {
    if (!this.ambientBuffer) return;
    
    this.ambientSourceNode = this.context.createBufferSource();
    this.ambientSourceNode.buffer = this.ambientBuffer;
    this.ambientSourceNode.loop = true;
    
    this.ambientGainNode = this.context.createGain();
    this.ambientGainNode.gain.value = 0.3; // Default ambient volume
    
    this.ambientSourceNode.connect(this.ambientGainNode);
    this.ambientGainNode.connect(this.context.destination);
    
    this.ambientSourceNode.start();
  }

  pause(): void {
    if (!this.playing) return;
    
    this.pauseTime = this.getCurrentTime();
    this.stopAll();
    this.playing = false;
  }

  private stopAll(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    
    if (this.ambientSourceNode) {
      this.ambientSourceNode.stop();
      this.ambientSourceNode = null;
    }
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  setAmbientVolume(volume: number): void {
    if (this.ambientGainNode) {
      this.ambientGainNode.gain.value = volume;
    }
  }

  getCurrentTime(): number {
    if (!this.playing) {
      return this.pauseTime;
    }
    return this.context.currentTime - this.startTime;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  seekTo(time: number): void {
    const wasPlaying = this.playing;
    
    // Stop current playback
    this.pause();
    
    // Update pauseTime to new position
    this.pauseTime = time;
    
    // If it was playing, restart playback from the new position
    if (wasPlaying) {
      this.play(time);
    }
  }

  async createProcessedAudioBlob(): Promise<Blob | null> {
    if (!this.audioBuffer || !this.effectsSettings) return null;

    try {
      // Create an offline audio context for rendering
      const offlineCtx = new OfflineAudioContext(
        this.audioBuffer.numberOfChannels,
        this.audioBuffer.length * (100 / this.effectsSettings.slowdown), // Adjust length based on slowdown
        this.audioBuffer.sampleRate
      );

      // Create and connect nodes in the offline context
      const source = offlineCtx.createBufferSource();
      source.buffer = this.audioBuffer;
      
      // Apply playback rate (slowdown)
      source.playbackRate.value = this.effectsSettings.slowdown / 100;
      
      // Create filter nodes
      const lowpassFilter = offlineCtx.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      const filterValue = 100 - this.effectsSettings.lowpass;
      const mappedFrequency = 100 + (20000 - 100) * (filterValue / 100);
      lowpassFilter.frequency.value = mappedFrequency;
      lowpassFilter.Q.value = 1 + (this.effectsSettings.lowpass / 100) * 5;
      
      const highpassFilter = offlineCtx.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.value = 20 + (this.effectsSettings.lowpass / 100) * 200;
      
      // Create compressor
      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      // Create reverb
      const reverbNode = offlineCtx.createConvolver();
      const reverbImpulse = await this.createOfflineReverb(offlineCtx);
      reverbNode.buffer = reverbImpulse;

      // Create gain nodes for mixing
      const mainGain = offlineCtx.createGain();
      mainGain.gain.value = 0.8; // Slightly reduce main track volume to make room for ambient

      // Create dry/wet mix for reverb
      const dryGain = offlineCtx.createGain();
      const wetGain = offlineCtx.createGain();
      dryGain.gain.value = 1 - (this.effectsSettings.reverb / 100);
      wetGain.gain.value = this.effectsSettings.reverb / 100 * 0.6;
      
      // Connect nodes in the correct order for lofi effect chain
      source.connect(highpassFilter);
      highpassFilter.connect(lowpassFilter);
      lowpassFilter.connect(compressor);
      
      // Dry path (no reverb)
      compressor.connect(dryGain);
      dryGain.connect(mainGain);
      
      // Wet path (with reverb)
      compressor.connect(reverbNode);
      reverbNode.connect(wetGain);
      wetGain.connect(mainGain);
      mainGain.connect(offlineCtx.destination);
      
      // Add ambient sound if available
      let ambientSource = null;
      
      if (this.ambientBuffer) {
        ambientSource = offlineCtx.createBufferSource();
        ambientSource.buffer = this.ambientBuffer;
        
        // Calculate ambient duration needed to cover the entire processed audio
        const mainAudioDuration = this.audioBuffer.duration * (100 / this.effectsSettings.slowdown);
        
        // We might need to loop the ambient sound if it's shorter than the main audio
        if (this.ambientBuffer.duration < mainAudioDuration) {
          ambientSource.loop = true;
          ambientSource.loopEnd = this.ambientBuffer.duration;
        }
        
        // Add gain node to control ambient volume
        const ambientGain = offlineCtx.createGain();
        ambientGain.gain.value = 0.3; // Use ambient volume value
        
        ambientSource.connect(ambientGain);
        ambientGain.connect(offlineCtx.destination);
      }
      
      // Start main source
      source.start();
      
      // Start ambient if available
      if (ambientSource) {
        ambientSource.start();
      }
      
      // Render audio
      const renderedBuffer = await offlineCtx.startRendering();
      
      // Add bit-crushing effect (simulate lower sample rate and bit depth)
      const bitCrushedBuffer = this.applyBitCrushing(renderedBuffer, this.effectsSettings.lowpass / 100);
      
      // Convert to wav
      const wavBlob = this.audioBufferToWav(bitCrushedBuffer);
      
      return wavBlob;
    } catch (error) {
      console.error("Error creating processed audio blob:", error);
      return null;
    }
  }
  
  private applyBitCrushing(buffer: AudioBuffer, intensity: number): AudioBuffer {
    // Skip bit-crushing if intensity is low
    if (intensity < 0.2) return buffer;
    
    // Create a new buffer with the same specs
    const newBuffer = this.context.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    // The effective bit depth (lower = more crushed)
    // Map intensity 0.2-1.0 to bit depth reduction 0-4 bits (16-bit down to 12-bit)
    const bitReduction = Math.floor((intensity - 0.2) * 5);
    const bitMask = ~((1 << bitReduction) - 1);
    
    // Sample rate reduction (keep every Nth sample, copy it N times)
    // As intensity increases, we reduce the sample rate more (keep every 1-4 samples)
    const sampleReduction = Math.max(1, Math.floor(intensity * 4));
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel);
      const outputData = newBuffer.getChannelData(channel);
      
      let lastSample = 0;
      for (let i = 0; i < buffer.length; i++) {
        // Only calculate a new sample value on every Nth sample
        if (i % sampleReduction === 0) {
          // Quantize the sample to fewer bits
          const sample = inputData[i];
          // Convert float (-1 to 1) to int16, apply bit mask, convert back to float
          const int16 = Math.floor(sample * 32767);
          const reduced = (int16 & bitMask) / 32767;
          lastSample = reduced;
        }
        
        // Copy the last calculated sample
        outputData[i] = lastSample;
      }
    }
    
    return newBuffer;
  }
  
  private async createOfflineReverb(ctx: OfflineAudioContext): Promise<AudioBuffer> {
    const sampleRate = ctx.sampleRate;
    const length = 2 * sampleRate; // 2 seconds
    const impulse = ctx.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const impulseData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        impulseData[i] = (Math.random() * 2 - 1) * Math.pow(0.8, i / (sampleRate * 0.2));
      }
    }
    
    return impulse;
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const dataLength = buffer.length * numChannels * (bitDepth / 8);
    const totalLength = 44 + dataLength;
    
    // Create buffer for the WAV file data
    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);
    
    // Write WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, value, true);
        offset += 2;
      }
    }
    
    return new Blob([view], { type: 'audio/wav' });
  }
  
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
