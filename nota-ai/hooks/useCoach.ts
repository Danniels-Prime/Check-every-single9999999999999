import { useState, useCallback } from 'react';
import { coachChat } from '@/lib/claude';
import type { ChatMessage } from '@/types';

export interface UseCoachReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (text: string, transcriptContext: string) => Promise<void>;
  clearHistory: () => void;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: '0',
  role: 'assistant',
  content: "Ready to listen. Start recording — I'll follow along and you can ask me anything about the transcript.",
  timestamp: new Date().toISOString(),
};

export function useCoach(): UseCoachReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (text: string, transcriptContext: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const reply = await coachChat(messages, text.trim(), transcriptContext);
      setMessages(prev => [...prev, {
        id: `${Date.now()}-ai`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred.';
      setMessages(prev => [...prev, {
        id: `${Date.now()}-err`,
        role: 'assistant',
        content: errMsg.includes('API key') ? errMsg : 'Coaching unavailable. Check your connection and API key in Settings.',
        timestamp: new Date().toISOString(),
      }]);
    }
    setIsTyping(false);
  }, [messages, isTyping]);

  const clearHistory = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
  }, []);

  return { messages, isTyping, sendMessage, clearHistory };
}
