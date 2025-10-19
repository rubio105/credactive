/**
 * Gemma Med Client - Self-hosted Medical AI
 * Comunicazione con Ollama per inferenza locale di Gemma Med
 */

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

interface OllamaResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Client per comunicare con Ollama (Gemma Med self-hosted)
 */
export class GemmaClient {
  private baseUrl: string;
  private model: string;
  private timeout: number;
  private enabled: boolean;

  constructor() {
    // Configurazione da environment variables
    this.baseUrl = process.env.GEMMA_ENDPOINT || 'http://localhost:11434';
    this.model = process.env.GEMMA_MODEL || 'gemma2:9b-instruct'; // o 'medllama2', 'meditron'
    this.timeout = parseInt(process.env.GEMMA_TIMEOUT || '60000'); // 60s default
    this.enabled = process.env.USE_LOCAL_MODEL === 'true';
  }

  /**
   * Verifica se il modello locale è abilitato e raggiungibile
   */
  async isAvailable(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s health check

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[Gemma] Health check failed: ${response.status}`);
        return false;
      }

      const data = await response.json();
      const modelAvailable = data.models?.some((m: any) => m.name.includes(this.model.split(':')[0]));

      if (!modelAvailable) {
        console.warn(`[Gemma] Model ${this.model} not found in Ollama`);
        return false;
      }

      return true;
    } catch (error) {
      console.warn(`[Gemma] Not available:`, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Genera risposta medica usando Gemma Med locale
   */
  async generateMedicalResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    systemPrompt?: string
  ): Promise<{
    message: string;
    model: string;
    metrics?: {
      totalDuration: number;
      tokensGenerated: number;
      tokensPerSecond: number;
    };
  }> {
    if (!this.enabled) {
      throw new Error('Local model is disabled');
    }

    const messages: OllamaMessage[] = [];

    // System prompt per contesto medico
    const defaultSystemPrompt = `Sei un assistente medico AI specializzato in triage e analisi medica. 
Fornisci risposte accurate, empatiche e basate su evidenze scientifiche.
Ricorda sempre che non sostituisci una diagnosi medica professionale.
Rispondi in italiano con linguaggio chiaro e comprensibile.`;

    messages.push({
      role: 'system',
      content: systemPrompt || defaultSystemPrompt,
    });

    // Aggiungi conversazione precedente
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    });

    // Messaggio utente corrente
    messages.push({
      role: 'user',
      content: userMessage,
    });

    const requestBody: OllamaRequest = {
      model: this.model,
      messages,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    };

    console.log(`[Gemma] Sending request to ${this.baseUrl}/api/chat`);
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data: OllamaResponse = await response.json();
      const duration = Date.now() - startTime;

      console.log(`[Gemma] Response received in ${duration}ms`);

      const metrics = data.eval_count && data.total_duration ? {
        totalDuration: data.total_duration / 1_000_000, // ns to ms
        tokensGenerated: data.eval_count,
        tokensPerSecond: (data.eval_count / (data.total_duration / 1_000_000_000)),
      } : undefined;

      return {
        message: data.message.content,
        model: this.model,
        metrics,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Gemma] Request failed after ${duration}ms:`, error);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Gemma timeout after ${this.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Genera embeddings per RAG usando Gemma
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.enabled) {
      throw new Error('Local model is disabled');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama embeddings error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('[Gemma] Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Ottieni info sul modello caricato
   */
  async getModelInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.model,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get model info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Gemma] Failed to get model info:', error);
      return null;
    }
  }
}

// Singleton instance
export const gemmaClient = new GemmaClient();

/**
 * Health check periodico (opzionale)
 */
export async function startGemmaHealthCheck(intervalMinutes: number = 5) {
  const check = async () => {
    const isAvailable = await gemmaClient.isAvailable();
    console.log(`[Gemma] Health check: ${isAvailable ? '✅ Available' : '❌ Unavailable'}`);
  };

  // Check immediato
  await check();

  // Check periodico
  setInterval(check, intervalMinutes * 60 * 1000);
}
