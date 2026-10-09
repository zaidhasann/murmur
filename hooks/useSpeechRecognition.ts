'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type SpeechState = 'idle' | 'requesting' | 'listening' | 'processing' | 'error';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function useSpeechRecognition({
  language = 'en-US',
  onResult,
}: {
  language?: string;
  onResult?: (finalText: string) => void;
}) {
  const [state, setState] = useState<SpeechState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as IWindowWithSpeech;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        setIsSupported(false);
      }
    }
  }, []);

  // Quick fallback simulation test helper for browsers without webkitSpeechRecognition (e.g. Firefox)
  const simulateVoiceInput = useCallback((phrase: string) => {
    setState('listening');
    setInterimTranscript(phrase.slice(0, Math.floor(phrase.length / 2)));
    setTimeout(() => {
      setInterimTranscript(phrase);
    }, 400);
    setTimeout(() => {
      setInterimTranscript('');
      setFinalTranscript(phrase);
      setState('processing');
      if (onResult) {
        onResult(phrase);
      }
      setTimeout(() => setState('idle'), 600);
    }, 1100);
  }, [onResult]);

  // Web Audio Analyser cleanup
  const stopAudioAnalysis = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioVolume(0);
  }, []);

  // Audio Analyser for volume visualization (60fps)
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Compute average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Normalize 0 to 1
        setAudioVolume(Math.min(1, avg / 128));

        animFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch {
      // Audio stream error or denied
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition already stopped
      }
    }
    stopAudioAnalysis();
    setState('processing');
    setTimeout(() => {
      setState((prev) => (prev === 'processing' ? 'idle' : prev));
    }, 400);
  }, [stopAudioAnalysis]);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    setInterimTranscript('');
    setFinalTranscript('');

    if (typeof window === 'undefined') return;
    const win = window as IWindowWithSpeech;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setState('error');
      setErrorMessage('Speech recognition is not supported in this browser. Use the typed command bar below.');
      return;
    }

    setState('requesting');

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setState('listening');
        startAudioAnalysis();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          setFinalTranscript(final);
          setInterimTranscript('');
          setState('processing');
          if (onResult) {
            onResult(final.trim());
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        stopAudioAnalysis();
        setState('error');

        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            setErrorMessage('Microphone access was denied. Please allow microphone permission in your browser address bar.');
            break;
          case 'no-speech':
            setErrorMessage('No speech detected. Tap the mic and try speaking closer.');
            break;
          case 'network':
            setErrorMessage('Network connection lost for speech synthesis. Try typing in the command bar.');
            break;
          case 'audio-capture':
            setErrorMessage('No microphone was found. Please connect an audio input device.');
            break;
          default:
            setErrorMessage(`Speech recognition error: ${event.error}. You can also type your command.`);
            break;
        }

        setTimeout(() => {
          setState('idle');
        }, 4000);
      };

      recognition.onend = () => {
        stopAudioAnalysis();
        setState((current) => (current === 'listening' ? 'idle' : current));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      stopAudioAnalysis();
      setState('error');
      setErrorMessage('Unable to initialize microphone. Please check permissions.');
    }
  }, [language, onResult, startAudioAnalysis, stopAudioAnalysis]);

  const toggleListening = useCallback(() => {
    if (state === 'listening' || state === 'requesting') {
      stopListening();
    } else {
      startListening();
    }
  }, [state, startListening, stopListening]);

  return {
    state,
    interimTranscript,
    finalTranscript,
    errorMessage,
    isSupported,
    audioVolume,
    startListening,
    stopListening,
    toggleListening,
    simulateVoiceInput,
  };
}
