import { useState, useCallback } from 'react';
import { coachChat } from '../lib/claude';
import type { ChatMessage, Segment } from '../types';

const INITIAL_MESSAGE: ChatMessage = {
  id: '0',
  role: 'ai',
  text: "Ready to listen. Start recording — I'll follow along and you can ask me anything.",
  timestamp: new Date().toISOString(),
};

export function useCoach(getSegments: () => Segment[]) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const reply = await coachChat(text.trim(), messages, getSegments());
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text: reply,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text: 'Coaching unavailable. Check your connection.',
        timestamp: new Date().toISOString(),
      }]);
    }

    setIsTyping(false);
  }, [isTyping, messages, getSegments]);

  const reset = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setIsTyping(false);
  }, []);

  return { messages, isTyping, sendMessage, reset };
}
