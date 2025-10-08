import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain, Send, X, Minimize2, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScenarioChatProps {
  questionId: string;
  quizId: string;
  category: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  wasCorrect: boolean;
  isInsightDiscovery: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  scenarioTitle: string;
  scenarioContext: string;
  scenarioType: string;
  isActive: boolean;
}

export function ScenarioChat({
  questionId,
  quizId,
  category,
  questionText,
  userAnswer,
  correctAnswer,
  wasCorrect,
  isInsightDiscovery
}: ScenarioChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for existing active conversation on mount
  const { data: existingData } = useQuery({
    queryKey: ['/api/scenarios/check', questionId],
    enabled: !conversationId,
    retry: false,
    queryFn: async () => {
      const response = await fetch(`/api/scenarios/check/${questionId}`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return await response.json() as { conversation: Conversation | null, messages: Message[] };
    }
  });

  // Hydrate state if existing conversation found and auto-open
  useEffect(() => {
    if (existingData?.conversation && !conversationId) {
      setConversationId(existingData.conversation.id);
      setMessages(existingData.messages);
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [existingData, conversationId]);

  // Start scenario conversation
  const startScenario = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        '/api/scenarios/start',
        'POST',
        {
          questionId,
          quizId,
          category,
          questionText,
          userAnswer,
          correctAnswer,
          wasCorrect,
          scenarioType: isInsightDiscovery ? 'personal_development' : 'business_case'
        }
      );
      return await response.json() as { conversation: Conversation, messages: Message[] };
    },
    onSuccess: (data) => {
      setConversationId(data.conversation.id);
      setMessages(data.messages);
      setIsOpen(true);
      setIsMinimized(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile avviare lo scenario",
        variant: "destructive"
      });
    }
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!conversationId) throw new Error("No active conversation");
      const response = await apiRequest(
        `/api/scenarios/${conversationId}/message`,
        'POST',
        { message }
      );
      return await response.json() as { message: Message };
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, data.message]);
      setInputMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare il messaggio",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message to UI immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    
    // Send to API
    sendMessage.mutate(inputMessage);
    setInputMessage("");
  };

  const handleStartScenario = () => {
    startScenario.mutate();
  };

  // End conversation mutation
  const endConversation = useMutation({
    mutationFn: async () => {
      if (!conversationId) return;
      const response = await apiRequest(
        `/api/scenarios/${conversationId}/end`,
        'POST'
      );
      return await response.json();
    }
  });

  const handleClose = () => {
    // End conversation on backend when explicitly closing
    if (conversationId) {
      endConversation.mutate();
    }
    
    setIsOpen(false);
    setMessages([]);
    setConversationId(null);
  };

  if (!isOpen && !conversationId) {
    return (
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                  {isInsightDiscovery 
                    ? "💡 Scenario di Sviluppo Personale" 
                    : "💼 Scenario Aziendale Pratico"}
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {isInsightDiscovery
                    ? "Esplora come gestire situazioni di stress e comunicazione nel tuo stile"
                    : "Applica questa conoscenza a un caso aziendale reale"}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleStartScenario}
              disabled={startScenario.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-start-scenario"
            >
              {startScenario.isPending ? "Caricamento..." : "Inizia Scenario"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isOpen && conversationId) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg"
          size="lg"
        >
          <Brain className="w-5 h-5 mr-2" />
          Riapri Scenario
        </Button>
      </div>
    );
  }

  return (
    <Card className={`mb-6 border-purple-300 dark:border-purple-700 ${isMinimized ? 'fixed bottom-4 right-4 w-80 z-50' : ''}`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <h4 className="font-semibold">
              {isInsightDiscovery ? "Scenario Personale" : "Scenario Aziendale"}
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
              data-testid="button-close-scenario"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <>
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                    }`}
                    data-testid={`message-${msg.role}`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500">Sto pensando...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Scrivi la tua risposta..."
                  disabled={sendMessage.isPending}
                  className="flex-1"
                  data-testid="input-scenario-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendMessage.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="button-send-scenario-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
