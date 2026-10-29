"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Radio,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTranscript: (text: string) => void;
}

export function VoiceChatModal({ isOpen, onClose, onSendTranscript }: VoiceChatModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [handsFree, setHandsFree] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [statusText, setStatusText] = useState("Ready to listen");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        setStatusText("Transcribing...");

        // Hands-Free silence detection
        if (handsFree && currentTranscript.trim().length > 3) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            handleSend(currentTranscript);
          }, 1800);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e.error);
        setStatusText(`Voice recognition: ${e.error}`);
      };

      recognition.onend = () => {
        if (isRecording) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
    }
  }, [handsFree, isRecording]);

  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      drawWaveform();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }

      setIsRecording(true);
      setStatusText("Listening to voice input...");
    } catch (err: any) {
      console.error("Microphone access failed:", err);
      setStatusText("Microphone access denied");
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    setIsRecording(false);
    setStatusText("Microphone off");
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

        // Gradient styling
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, "#10b981");
        grad.addColorStop(0.5, "#06b6d4");
        grad.addColorStop(1, "#8b5cf6");

        ctx.fillStyle = grad;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    render();
  };

  useEffect(() => {
    if (isOpen) {
      startAudioVisualizer();
    } else {
      stopAudioVisualizer();
      setTranscript("");
    }
    return () => {
      stopAudioVisualizer();
    };
  }, [isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || transcript).trim();
    if (!text) return;
    onSendTranscript(text);
    setTranscript("");
    if (!handsFree) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-primary/30 bg-[#0b0f19] p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-6">
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 blur-3xl rounded-full pointer-events-none" />

        {/* Top bar */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Radio className={cn("size-4", isRecording ? "text-emerald-400 animate-pulse" : "text-zinc-500")} />
            <span className="text-xs font-mono font-medium text-foreground">GlyteOS Live Voice</span>
            {handsFree && (
              <Badge variant="outline" className="text-[9px] font-mono border-primary/40 text-primary">
                Hands-Free
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Real-time Waveform Canvas */}
        <div className="relative w-full h-28 flex items-center justify-center rounded-2xl bg-black/40 border border-border/40 overflow-hidden px-4">
          <canvas
            ref={canvasRef}
            width={380}
            height={100}
            className="w-full h-full"
          />
          {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-zinc-500">
              Mic is muted
            </div>
          )}
        </div>

        {/* Status & Live Transcript */}
        <div className="w-full space-y-2">
          <div className="text-xs font-mono text-primary flex items-center justify-center gap-1.5">
            <Sparkles className="size-3 text-cyan-400" />
            <span>{statusText}</span>
          </div>

          <div className="min-h-16 max-h-28 overflow-y-auto p-3 rounded-xl bg-card/20 border border-border/30 text-sm font-medium text-foreground text-left leading-relaxed">
            {transcript ? (
              <span>{transcript}</span>
            ) : (
              <span className="text-zinc-500 italic">Speak naturally. Real-time audio will transcribe here...</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAudioFeedback(!audioFeedback)}
            className="size-11 rounded-2xl border-border/50 text-zinc-400 hover:text-foreground bg-card/40"
            title="Toggle Audio Feedback"
          >
            {audioFeedback ? <Volume2 className="size-5 text-cyan-400" /> : <VolumeX className="size-5" />}
          </Button>

          <Button
            size="icon"
            onClick={isRecording ? stopAudioVisualizer : startAudioVisualizer}
            className={cn(
              "size-16 rounded-full shadow-lg transition-transform active:scale-95",
              isRecording
                ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isRecording ? <MicOff className="size-7" /> : <Mic className="size-7" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setHandsFree(!handsFree)}
            className={cn(
              "size-11 rounded-2xl border-border/50 bg-card/40 transition-colors",
              handsFree ? "border-primary/50 text-primary bg-primary/10" : "text-zinc-400 hover:text-foreground"
            )}
            title="Toggle Hands-Free Auto-Send Mode"
          >
            <Zap className="size-5" />
          </Button>
        </div>

        {/* Bottom Actions */}
        <div className="w-full flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
          <span className="font-mono text-[11px]">Whisper + TTS Native Pipeline</span>
          <Button
            size="sm"
            disabled={!transcript.trim()}
            onClick={() => handleSend()}
            className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="size-3.5" />
            Send to Hermes
          </Button>
        </div>
      </div>
    </div>
  );
}
