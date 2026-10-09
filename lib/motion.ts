import { Transition } from 'framer-motion';

export const durationTokens = {
  instant: 0.09,
  micro: 0.14,
  standard: 0.24,
  emphasis: 0.42,
  signature: 0.7,
} as const;

export const easeBezier = [0.2, 0.8, 0.2, 1] as const;

export const springPhysics = {
  tight: { type: 'spring' as const, stiffness: 450, damping: 32 },
  default: { type: 'spring' as const, stiffness: 350, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 240, damping: 26 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 22 },
};

export const standardTween: Transition = {
  duration: durationTokens.standard,
  ease: [0.2, 0.8, 0.2, 1],
};

export const emphasisTween: Transition = {
  duration: durationTokens.emphasis,
  ease: [0.2, 0.8, 0.2, 1],
};

export const staggerTransition = {
  staggerChildren: 0.035,
  delayChildren: 0.05,
};
