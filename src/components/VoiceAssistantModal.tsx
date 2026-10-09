import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Send,
  RotateCcw,
  Bot,
  User,
  Radio,
  AlertCircle
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

interface TranscriptItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export const VoiceAssistantModal: React.FC = () => {
  const {
    isVoiceAssistantOpen,
    setIsVoiceAssistantOpen,
    inventory,
    sales,
    customers,
    settings
  } = useShop();

  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioOutputMuted, setIsAudioOutputMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [textInput, setTextInput] = useState('');
  const [micVolume, setMicVolume] = useState(0);

  // Audio References
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef(false);
  const isOutputMutedRef = useRef(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  isMutedRef.current = isMuted;
  isOutputMutedRef.current = isAudioOutputMuted;

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcripts]);

  // Clean stop audio playback
  const stopAllAudioOutput = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsSpeaking(false);
  }, []);

  // Teardown connections and media devices
  const disconnectSession = useCallback(() => {
    stopAllAudioOutput();

    // Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    // Stop microphone stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect audio nodes
    if (processorNodeRef.current) {
      try {
        processorNodeRef.current.disconnect();
      } catch {}
      processorNodeRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch {}
      outputAudioCtxRef.current = null;
    }

    setConnectionStatus('disconnected');
    setIsUserSpeaking(false);
    setIsSpeaking(false);
  }, [stopAllAudioOutput]);

  // Play incoming 24kHz PCM chunk from Gemini Live
  const playAudioChunk = useCallback((base64Data: string) => {
    if (isOutputMutedRef.current) return;

    try {
      if (!outputAudioCtxRef.current || outputAudioCtxRef.current.state === 'closed') {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });
        nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
      }

      const audioCtx = outputAudioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Convert base64 to binary ArrayBuffer
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 16-bit PCM mono
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const buffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      buffer.copyToChannel(float32Array, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);

      const startTime = Math.max(audioCtx.currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;

      activeSourcesRef.current.push(source);
      setIsSpeaking(true);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };
    } catch (err) {
      console.warn('[Live Audio] Audio playback error:', err);
    }
  }, []);

  // Connect to Gemini 3.8 Live API via WebSocket
  const startLiveSession = useCallback(async () => {
    disconnectSession();
    setConnectionStatus('connecting');
    setErrorMessage(null);

    // Initial welcome message
    setTranscripts([
      {
        id: 'init-msg',
        sender: 'assistant',
        text: `Salam! I am your Zafar Mobile Store Voice Assistant powered by Gemini 3.8 Live. Ask me about stock inventory, sales, customer balances, or phone specs.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    try {
      // 1. Request microphone access
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        mediaStreamRef.current = stream;
      } catch (micErr: any) {
        throw new Error(
          micErr.name === 'NotAllowedError'
            ? 'Microphone permission was denied. Please allow microphone access in your browser.'
            : 'Could not access microphone on this device.'
        );
      }

      // 2. Setup AudioContext for 16kHz microphone stream
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      inputAudioCtxRef.current = inputCtx;

      const sourceNode = inputCtx.createMediaStreamSource(stream);
      // Buffer size 4096 gives ~250ms chunks at 16kHz
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate simple volume level for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const avg = sum / inputData.length;
        setMicVolume(Math.min(100, Math.round(avg * 400)));
        setIsUserSpeaking(avg > 0.03);

        // Convert Float32 to 16-bit PCM
        const int16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert to Base64
        const uint8 = new Uint8Array(int16.buffer);
        let binary = '';
        const len = uint8.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64Audio = btoa(binary);

        wsRef.current.send(
          JSON.stringify({
            type: 'audio',
            audio: base64Audio
          })
        );
      };

      sourceNode.connect(processor);
      processor.connect(inputCtx.destination);

      // 3. Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live-voice`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            setConnectionStatus('connected');
          } else if (data.type === 'audio' && data.audio) {
            playAudioChunk(data.audio);
          } else if (data.type === 'interrupted') {
            stopAllAudioOutput();
          } else if (data.type === 'output_transcript' && data.text) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'assistant' && last.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + data.text, isStreaming: true }
                ];
              }
              return [
                ...prev,
                {
                  id: `ai-${Date.now()}`,
                  sender: 'assistant',
                  text: data.text,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  isStreaming: true
                }
              ];
            });
          } else if (data.type === 'input_transcript' && data.text) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'user' && last.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + data.text, isStreaming: true }
                ];
              }
              return [
                ...prev,
                {
                  id: `user-${Date.now()}`,
                  sender: 'user',
                  text: data.text,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  isStreaming: true
                }
              ];
            });
          } else if (data.type === 'error') {
            setErrorMessage(data.error);
            setConnectionStatus('error');
          }
        } catch (e) {
          console.warn('[Live Voice] Message parse error:', e);
        }
      };

      ws.onerror = (e) => {
        console.warn('[Live Voice] WS error:', e);
        setErrorMessage('WebSocket connection failed. Ensure Gemini API key is configured.');
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
      };
    } catch (err: any) {
      console.error('[Live Voice] Initialization error:', err);
      setErrorMessage(err.message || 'Could not start live voice session.');
      setConnectionStatus('error');
    }
  }, [disconnectSession, playAudioChunk, stopAllAudioOutput]);

  // Handle modal open/close
  useEffect(() => {
    if (isVoiceAssistantOpen) {
      startLiveSession();
    } else {
      disconnectSession();
    }
    return () => {
      disconnectSession();
    };
  }, [isVoiceAssistantOpen, startLiveSession, disconnectSession]);

  // Send typed message
  const handleSendTextMessage = async () => {
    const text = textInput.trim();
    if (!text) return;

    setTextInput('');
    setTranscripts((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Send via Live WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text }));
    } else {
      // Fallback via HTTP
      try {
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text })
        });
        const data = await res.json();
        if (data.text) {
          setTranscripts((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'assistant',
              text: data.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch (err: any) {
        setErrorMessage('Failed to send text message.');
      }
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setTextInput(prompt);
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'text', text: prompt }));
        setTranscripts((prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: prompt,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setTextInput('');
      } else {
        handleSendTextMessage();
      }
    }, 50);
  };

  if (!isVoiceAssistantOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0D111A] border border-purple-500/30 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#131926] px-5 py-4 border-b border-purple-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
              {connectionStatus === 'connected' && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Live Voice Conversation
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-700/50">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time voice assistant for {settings.shopName || 'Zafar Mobile Store'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio output mute toggle */}
            <button
              onClick={() => setIsAudioOutputMuted((prev) => !prev)}
              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                isAudioOutputMuted
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                  : 'bg-[#1C2333] text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isAudioOutputMuted ? 'Unmute AI voice output' : 'Mute AI voice output'}
            >
              {isAudioOutputMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Reconnect button */}
            <button
              onClick={startLiveSession}
              disabled={connectionStatus === 'connecting'}
              className="p-2 rounded-lg bg-[#1C2333] hover:bg-[#252E42] border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Restart session"
            >
              <RotateCcw className={`w-4 h-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
            </button>

            {/* Close button */}
            <button
              onClick={() => setIsVoiceAssistantOpen(false)}
              className="p-2 rounded-lg bg-[#1C2333] hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Status Orb & Audio Visualizer Bar */}
        <div className="bg-gradient-to-b from-[#111624] to-[#0A0D14] px-6 py-6 border-b border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
          
          {/* Animated Background Aura */}
          <div
            className={`absolute w-72 h-72 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
              isSpeaking
                ? 'bg-purple-600/30 opacity-90'
                : isUserSpeaking
                ? 'bg-emerald-500/25 opacity-80'
                : connectionStatus === 'connected'
                ? 'bg-indigo-600/20 opacity-60'
                : 'bg-slate-700/10 opacity-30'
            }`}
          />

          {/* Central Pulsing Sphere */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                isSpeaking
                  ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 scale-110 ring-8 ring-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.5)]'
                  : isUserSpeaking
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 scale-105 ring-8 ring-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                  : connectionStatus === 'connected'
                  ? 'bg-gradient-to-tr from-indigo-700 to-purple-800 ring-4 ring-indigo-500/20'
                  : 'bg-slate-800 ring-2 ring-slate-700'
              }`}
            >
              {isSpeaking ? (
                <Radio className="w-10 h-10 text-white animate-pulse" />
              ) : isMuted ? (
                <MicOff className="w-10 h-10 text-rose-300" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </div>

            {/* Dynamic Status Text */}
            <div className="mt-3.5 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center justify-center gap-1.5">
                {connectionStatus === 'connecting' && (
                  <span className="text-amber-400">Connecting to Gemini Live...</span>
                )}
                {connectionStatus === 'connected' && (
                  <>
                    {isSpeaking ? (
                      <span className="text-purple-300 animate-pulse">Gemini Spoken Audio...</span>
                    ) : isUserSpeaking ? (
                      <span className="text-emerald-400 font-semibold">Listening to you...</span>
                    ) : isMuted ? (
                      <span className="text-rose-400">Microphone Muted</span>
                    ) : (
                      <span className="text-indigo-300">Live • Speak anytime</span>
                    )}
                  </>
                )}
                {connectionStatus === 'disconnected' && (
                  <span className="text-slate-400">Session Closed</span>
                )}
                {connectionStatus === 'error' && (
                  <span className="text-rose-400">Connection Error</span>
                )}
              </span>

              <p className="text-[11px] text-slate-400 mt-0.5">
                {inventory.length} phones in stock • {sales.length} sales invoices • Real-time 24kHz audio
              </p>
            </div>

            {/* Audio Wave Visualizer Bars */}
            <div className="flex items-center gap-1.5 mt-3 h-5">
              {[...Array(9)].map((_, i) => {
                let height = 4;
                if (isSpeaking) {
                  height = Math.sin(Date.now() / 150 + i) * 12 + 14;
                } else if (isUserSpeaking && !isMuted) {
                  height = Math.min(22, 6 + (micVolume / 5) * ((i % 3) + 1));
                }
                return (
                  <span
                    key={i}
                    style={{ height: `${Math.max(4, height)}px` }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isSpeaking
                        ? 'bg-purple-400'
                        : isUserSpeaking
                        ? 'bg-emerald-400'
                        : 'bg-slate-700'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2 flex items-center gap-2 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="flex-1">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs underline hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Transcript Conversation View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B0E17]/60 min-h-[180px]">
          {transcripts.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                item.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  item.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-purple-600 text-white shadow-sm'
                }`}
              >
                {item.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  item.sender === 'user'
                    ? 'bg-blue-600/90 text-white rounded-tr-none'
                    : 'bg-[#171D2B] text-slate-200 border border-slate-800 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{item.text}</p>
                <span className="block mt-1 text-[9px] opacity-60 text-right">
                  {item.timestamp}
                </span>
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Question Prompts */}
        <div className="px-4 py-2 bg-[#0E121C] border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-slate-400 whitespace-nowrap font-medium">Try asking:</span>
          {[
            'How many phones in stock?',
            'What is our total revenue today?',
            'Who has pending Khata balance?',
            'Explain used phone intake rules'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(prompt)}
              className="bg-[#161D2B] hover:bg-[#20293D] border border-slate-700/80 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Controls & Text Input Footer */}
        <div className="bg-[#121622] p-3 sm:p-4 border-t border-slate-800 flex items-center gap-2">
          {/* Mic Mute/Unmute Button */}
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-900/60 border-rose-700 text-rose-200 hover:bg-rose-900'
                : 'bg-emerald-600/90 border-emerald-500 text-white hover:bg-emerald-600 shadow-md'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text input for fallback typing */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendTextMessage()}
              placeholder="Or type a question for Gemini Live..."
              className="w-full bg-[#181F2E] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              onClick={handleSendTextMessage}
              disabled={!textInput.trim()}
              className="absolute right-1.5 p-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
