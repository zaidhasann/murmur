'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Check, AlertCircle } from 'lucide-react';
import { SpeechState } from '@/hooks/useSpeechRecognition';

interface MicOrbProps {
  state: SpeechState;
  audioVolume: number;
  onClick: () => void;
  motionSetting?: 'full' | 'reduced' | 'off';
  isSupported?: boolean;
}

export const MicOrb: React.FC<MicOrbProps> = ({
  state,
  audioVolume,
  onClick,
  motionSetting = 'full',
  isSupported = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas 2D organic blob driven by Web Audio API volume
  useEffect(() => {
    if (motionSetting === 'off' || state !== 'listening') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;
    const numPoints = 8;
    const baseRadius = 24;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // React to audio volume smoothly
      const dynamicRadius = baseRadius + audioVolume * 14;

      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const theta = (i / numPoints) * Math.PI * 2;
        // wobble wave
        const wobble = Math.sin(theta * 3 + angle) * (3 + audioVolume * 8);
        const r = dynamicRadius + wobble;
        const x = centerX + Math.cos(theta) * r;
        const y = centerY + Math.sin(theta) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Deep Ink Blue gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, dynamicRadius + 12);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
      gradient.addColorStop(0.7, 'rgba(37, 99, 235, 0.25)');
      gradient.addColorStop(1, 'rgba(29, 78, 216, 0)');

      ctx.fillStyle = gradient;
      ctx.fill();

      angle += 0.05 + audioVolume * 0.08;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, audioVolume, motionSetting]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Listening Audio Canvas */}
      {state === 'listening' && motionSetting !== 'off' && (
        <canvas
          ref={canvasRef}
          width={128}
          height={128}
          className="absolute -inset-8 pointer-events-none z-0"
        />
      )}

      {/* Outer audio reactive rings when listening */}
      <AnimatePresence>
        {state === 'listening' && (
          <>
            <motion.div
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{
                scale: 1 + audioVolume * 0.5,
                opacity: 0.2 + audioVolume * 0.4,
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ ease: 'easeOut', duration: 0.15 }}
              className="absolute -inset-3 rounded-full border border-blue-400/40 pointer-events-none"
            />
            <motion.div
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{
                scale: 1.1 + audioVolume * 0.8,
                opacity: 0.1 + audioVolume * 0.3,
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
              className="absolute -inset-6 rounded-full border border-blue-500/20 pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>

      {/* Main Orb Button */}
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={
          !isSupported
            ? 'Voice input unsupported'
            : state === 'listening'
            ? 'Stop listening'
            : 'Start voice input (press Space)'
        }
        aria-live="polite"
        whileTap={{ scale: 0.94 }}
        animate={
          motionSetting === 'off'
            ? {}
            : state === 'idle'
            ? {
                scale: [1, 1.03, 1],
                transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              }
            : state === 'error'
            ? {
                x: [-4, 4, -3, 3, 0],
                transition: { duration: 0.3 },
              }
            : {}
        }
        className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
          state === 'listening'
            ? 'bg-blue-600 text-white shadow-blue-500/30'
            : state === 'processing'
            ? 'bg-blue-700 text-white'
            : state === 'error'
            ? 'bg-red-600 text-white'
            : !isSupported
            ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed'
            : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200'
        }`}
      >
        {/* Processing arc animation */}
        {state === 'processing' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-1 rounded-full border-2 border-white/20 border-t-white"
          />
        )}

        {/* State icons */}
        <AnimatePresence mode="wait">
          {!isSupported ? (
            <motion.div key="unsupported" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MicOff className="w-6 h-6 stroke-[1.5]" />
            </motion.div>
          ) : state === 'listening' ? (
            <motion.div
              key="listening"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 + audioVolume * 0.2 }}
              exit={{ scale: 0.8 }}
            >
              <Mic className="w-6 h-6 stroke-[1.5] text-white" />
            </motion.div>
          ) : state === 'processing' ? (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="w-2.5 h-2.5 rounded-full bg-white block animate-pulse" />
            </motion.div>
          ) : state === 'error' ? (
            <motion.div key="error" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <AlertCircle className="w-6 h-6 stroke-[1.5]" />
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Mic className="w-6 h-6 stroke-[1.5]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
