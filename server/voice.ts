import OpenAI, { toFile } from 'openai';
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
  
  const file = await toFile(audioBuffer, filename);
  
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'it',
  });
  
  return transcription.text;
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
