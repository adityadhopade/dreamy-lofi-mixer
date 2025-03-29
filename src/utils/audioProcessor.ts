
// This is a more complete audio processing utility using Web Audio API
export class AudioProcessor {
  private context: AudioContext;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private lowpassNode: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private ambientSourceNode: AudioBufferSourceNode | null = null;
  private ambientGainNode: GainNode | null = null;
  private ambientBuffer: AudioBuffer | null = null;
  private processingReady = false;
  private playing = false;
  private effectsSettings: { slowdown: number; reverb: number; lowpass: number } | null = null;

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

  private setupNodes(): void {
    // Create basic nodes
    this.gainNode = this.context.createGain();
    this.lowpassNode = this.context.createBiquadFilter();
    this.lowpassNode.type = 'lowpass';
    
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
      // Map 0-100% to frequency range (200Hz to 20000Hz logarithmically)
      // Invert the effect (100% = most filtering, 0% = no filtering)
      const filterValue = 100 - effects.lowpass;
      const mappedFrequency = 200 + (20000 - 200) * (filterValue / 100);
      this.lowpassNode.frequency.value = mappedFrequency;
      
      // Add resonance for more characteristic lofi sound
      this.lowpassNode.Q.value = 1 + (effects.lowpass / 100) * 5;
    }
  }

  play(startTime: number = 0): void {
    if (this.playing || !this.audioBuffer) return;
    this.stopAll();
    
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
    if (this.lowpassNode && this.reverbNode && this.gainNode) {
      const dryGain = this.context.createGain();
      const wetGain = this.context.createGain();
      
      if (this.effectsSettings) {
        dryGain.gain.value = 1 - (this.effectsSettings.reverb / 100);
        wetGain.gain.value = this.effectsSettings.reverb / 100 * 0.6; // Scale down reverb slightly
      }
      
      this.sourceNode.connect(this.lowpassNode);
      this.lowpassNode.connect(dryGain);
      this.lowpassNode.connect(this.reverbNode);
      this.reverbNode.connect(wetGain);
      dryGain.connect(this.gainNode);
      wetGain.connect(this.gainNode);
    } else if (this.gainNode) {
      this.sourceNode.connect(this.gainNode);
    }
    
    // Play the source from the specified position
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
    return this.context.currentTime;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  async createProcessedAudioBlob(): Promise<Blob | null> {
    if (!this.audioBuffer || !this.effectsSettings) return null;

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
    
    // Create filter
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    const filterValue = 100 - this.effectsSettings.lowpass;
    const mappedFrequency = 200 + (20000 - 200) * (filterValue / 100);
    filter.frequency.value = mappedFrequency;
    filter.Q.value = 1 + (this.effectsSettings.lowpass / 100) * 5;
    
    // Create reverb
    const reverbNode = offlineCtx.createConvolver();
    const reverbImpulse = await this.createOfflineReverb(offlineCtx);
    reverbNode.buffer = reverbImpulse;
    
    // Create dry/wet mix for reverb
    const dryGain = offlineCtx.createGain();
    const wetGain = offlineCtx.createGain();
    dryGain.gain.value = 1 - (this.effectsSettings.reverb / 100);
    wetGain.gain.value = this.effectsSettings.reverb / 100 * 0.6;
    
    // Connect nodes
    source.connect(filter);
    filter.connect(dryGain);
    filter.connect(reverbNode);
    reverbNode.connect(wetGain);
    dryGain.connect(offlineCtx.destination);
    wetGain.connect(offlineCtx.destination);
    
    // Start source
    source.start();
    
    // Render audio
    const renderedBuffer = await offlineCtx.startRendering();
    
    // Convert to wav
    const wavBlob = this.audioBufferToWav(renderedBuffer);
    
    return wavBlob;
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
