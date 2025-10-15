import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, Mic, MicOff, Sparkles } from "lucide-react";

interface TriageMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface TriageSession {
  id: string;
  status: string;
}

export function AIChatPanel() {
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const { data: session } = useQuery<TriageSession>({
    queryKey: ["/api/prevention/triage-session"],
  });

  useEffect(() => {
    if (session?.id) {
      setSessionId(session.id);
    }
  }, [session]);

  const { data: messages = [] } = useQuery<TriageMessage[]>({
    queryKey: ["/api/prevention/triage-messages", sessionId],
    enabled: !!sessionId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/prevention/triage-message`, "POST", { sessionId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/triage-messages", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/triage-session"] });
      setUserInput("");
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!userInput.trim() || sendMessageMutation.isPending || !sessionId) return;
    sendMessageMutation.mutate(userInput.trim());
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Non supportato",
        description: "Il riconoscimento vocale non è supportato su questo browser",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput((prev) => prev + ' ' + transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Errore",
          description: "Errore nel riconoscimento vocale",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-xl border">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Assistente AI Prevenzione</h2>
            <p className="text-sm text-muted-foreground">Il tuo consulente per la salute</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!sessionId ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        ) : (
          <>
            <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
              <div className="space-y-6 py-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Benvenuto nell'Assistente AI</h3>
                    <p className="text-muted-foreground">Inizia una conversazione per ricevere consigli sulla prevenzione</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.role === 'system' ? 'justify-center' : msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'system' ? (
                        <div className="max-w-[90%] p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                            {msg.content}
                          </p>
                        </div>
                      ) : (
                        <>
                          {msg.role === 'assistant' && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                              <Sparkles className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] p-4 rounded-2xl shadow-md transition-all hover:shadow-lg ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-sm'
                                : 'bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-800 rounded-tl-sm'
                            }`}
                          >
                            <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed break-words">
                              {msg.content}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-6 pt-4 border-t">
              <div className="flex gap-2 items-end">
                <div className="relative flex-1">
                  <Input
                    placeholder="Scrivi un messaggio..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    className="border-2 border-emerald-200 focus:border-emerald-500 dark:border-emerald-700 dark:focus:border-emerald-500 pr-12 py-6 rounded-xl"
                    data-testid="input-ai-chat-message"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={toggleVoiceInput}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900 ${isListening ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}
                    data-testid="button-voice-input"
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending || !userInput.trim() || !sessionId}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg h-12 w-12 rounded-xl p-0"
                  data-testid="button-send-ai-message"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
