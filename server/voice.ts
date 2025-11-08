import OpenAI from 'openai';
import { getApiKey } from './config';

let openaiInstance: OpenAI | null = null;

export async function getOpenAI(): Promise<OpenAI> {
  if (openaiInstance) {
    return openaiInstance;
  }

  const apiKey = await getApiKey('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY in the Admin API panel or environment variables.');
  }

  openaiInstance = new OpenAI({ apiKey });
  return openaiInstance;
}

export function clearOpenAIInstance() {
  openaiInstance = null;
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const openai = await getOpenAI();
  
  const transcription = await openai.audio.transcriptions.create({
    file: await toFile(audioBuffer, filename),
    model: 'whisper-1',
    language: 'it',
  });
  
  return transcription.text;
}

async function toFile(buffer: Buffer, filename: string): Promise<any> {
  return {
    [Symbol.toStringTag]: 'File',
    name: filename,
    size: buffer.length,
    type: filename.endsWith('.webm') ? 'audio/webm' : 'audio/wav',
    arrayBuffer: async () => buffer.buffer,
    text: async () => buffer.toString('utf-8'),
    slice: () => buffer,
  };
}

export async function textToSpeech(
  text: string, 
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'
): Promise<Buffer> {
  const openai = await getOpenAI();
  
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: voice,
    input: text,
    speed: 0.9,
  });
  
  const buffer = Buffer.from(await mp3.arrayBuffer());
  return buffer;
}
