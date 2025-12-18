import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, Bot, User, Sparkles, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const MOCK_RESPONSES: Record<string, string> = {
    "hello": "Hello! I'm your AI Health Assistant. How can I help you feel better today?",
    "hi": "Hi there! I'm here to support your wellness journey. What's on your mind?",
    "fever": "A fever is often your body's way of fighting an infection. I recommend tracking your temperature, staying hydrated, and resting. If it persists above 102°F or 38.9°C, please consult a doctor.",
    "headache": "Headaches can be caused by stress, dehydration, or eye strain. Try resting in a dark room and drinking water. If it's sudden and severe, seek medical attention.",
    "diet": "A balanced diet with plenty of fiber, lean proteins, and colorful vegetables is key to wellness. Would you like a personalized meal suggestion?",
    "sleep": "Good sleep hygiene involves avoiding screens before bed and maintaining a cool, dark environment. Aim for 7-9 hours of restful sleep.",
    "exercise": "Regular physical activity improves cardiovascular health and mood. Even a 30-minute walk daily makes a huge difference!",
    "default": "That's an interesting question. While I'm an AI and not a substitute for professional medical advice, I can provide general wellness information. Could you tell me more about your symptoms or goals?"
};

const HealthAssistant = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm CareConnect AI, your dedicated health companion. I can help with wellness tips, symptom information, and daily health advice. How are you feeling today?",
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const lowerInput = userMessage.text.toLowerCase();
            let responseText = MOCK_RESPONSES.default;

            for (const key in MOCK_RESPONSES) {
                if (lowerInput.includes(key) && key !== 'default') {
                    responseText = MOCK_RESPONSES[key];
                    break;
                }
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 pt-24 pb-12">
            <main className="container mx-auto px-4 max-w-4xl h-[calc(100vh-140px)] flex flex-col">
                {/* Header Area */}
                <div className="text-center mb-8 space-y-2 animate-fade-in">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-2">
                        <Sparkles className="w-4 h-4" />
                        AI-Powered Wellness
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">Health <span className="text-primary">Assistant</span></h1>
                    <p className="text-muted-foreground">Your 24/7 personalized companion for medical guidance and wellness.</p>
                </div>

                {/* Chat Container */}
                <Card className="flex-1 border-none shadow-2xl glass-card overflow-hidden flex flex-col mb-4 animate-fade-up">
                    <CardHeader className="border-b border-border/50 bg-background/50 backdrop-blur-md py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="w-10 h-10 border-2 border-primary/20 bg-primary/10">
                                        <AvatarImage src="/ai-avatar.png" />
                                        <AvatarFallback className="text-primary italic font-bold">CC</AvatarFallback>
                                    </Avatar>
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold">CareConnect AI</CardTitle>
                                    <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 uppercase tracking-widest">
                                        Online & Active
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-lg">
                                    <Info className="w-3 h-3" />
                                    General Info Only
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                            <div className="space-y-6">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <Avatar className={`w-8 h-8 rounded-xl ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                            </Avatar>
                                            <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.sender === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-muted/80 backdrop-blur-sm text-foreground rounded-tl-none border border-border/50'
                                                }`}>
                                                {msg.text}
                                                <div className={`mt-2 text-[10px] opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start animate-pulse">
                                        <div className="flex gap-3 max-w-[80%]">
                                            <Avatar className="w-8 h-8 rounded-xl bg-muted text-muted-foreground">
                                                <Bot className="w-4 h-4" />
                                            </Avatar>
                                            <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-none">
                                                <div className="flex gap-1.5 items-center">
                                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                                                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce delay-75"></span>
                                                    <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce delay-150"></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Warnign Banner */}
                        <div className="px-6 py-2 bg-yellow-50/50 border-t border-yellow-100 flex items-center gap-2 text-[11px] text-yellow-800 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Disclaimer: Not a replacement for professional medical consultation.
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-md">
                            <div className="flex gap-3 items-center">
                                <div className="flex-1 relative group">
                                    <Input
                                        placeholder="Describe your symptoms or ask a question..."
                                        className="h-14 rounded-2xl pl-6 pr-14 border-border/50 focus-visible:ring-primary shadow-inner bg-background"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                                    </div>
                                </div>
                                <Button
                                    size="icon"
                                    className="w-14 h-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                    onClick={handleSend}
                                >
                                    <Send className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer info/tags */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] mt-2 opacity-60 font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> AI Analysis</span>
                    <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Certified Content</span>
                    <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                    <span className="flex items-center gap-1 font-bold">HIPAA Secure</span>
                </div>
            </main>
            <div className="mt-12">
                <Footer />
            </div>
        </div>
    );
};

export default HealthAssistant;
