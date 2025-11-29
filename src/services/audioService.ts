// In-memory cache for decoded audio buffers
const audioCache = new Map<string, AudioBuffer>();
const pendingRequests = new Map<string, Promise<AudioBuffer>>();

// Retrieves audio from cache or fetches it from the server (static files)
export async function getTTSAudio(filename: string, ctx: AudioContext): Promise<AudioBuffer> {
  // 1. Return cached buffer immediately if available
  if (audioCache.has(filename)) {
    return audioCache.get(filename)!;
  }

  // 2. Return existing promise if a fetch is already in progress
  if (pendingRequests.has(filename)) {
    return pendingRequests.get(filename)!;
  }

  // 3. Start new fetch-and-decode process
  const promise = (async () => {
    try {
      // Fetch from /audio/ directory (files are in public/audio/)
      const response = await fetch(`/audio/${filename}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${filename} (Status: ${response.status})`);
      }
      const arrayBuffer = await response.arrayBuffer();
      
      // Decode the audio file (WAV) directly
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      
      audioCache.set(filename, buffer);
      pendingRequests.delete(filename); // Cleanup pending map
      return buffer;
    } catch (err) {
      pendingRequests.delete(filename);
      throw err;
    }
  })();

  pendingRequests.set(filename, promise);
  return promise;
}

// Prefetches audio for a list of filenames (fire and forget)
export function prefetchSentences(filenames: string[], ctx: AudioContext) {
  filenames.forEach(filename => {
    // Only fetch if not in cache and not currently loading
    if (!audioCache.has(filename) && !pendingRequests.has(filename)) {
      getTTSAudio(filename, ctx).catch(err => {
        console.warn(`Background prefetch failed for "${filename}"`, err);
      });
    }
  });
}

// Generates a synthetic page turn sound
export function playPageTurnSound(ctx: AudioContext) {
  const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // White noise with envelope
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Envelope: quick attack, slow decay
    const envelope = Math.max(0, 1 - (i / bufferSize) * 3); 
    data[i] = white * envelope * 0.1; // 0.1 volume
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  // Filter to make it sound more like paper (cut highs)
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  
  noise.connect(filter);
  filter.connect(ctx.destination);
  noise.start();
}