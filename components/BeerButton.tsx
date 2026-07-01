"use client";

import { useCallback, useRef } from "react";
import { HOLD_TO_ADD_START_DELAY_MS, HOLD_TO_ADD_TICK_MS } from "@/lib/config";

interface BeerButtonProps {
  onAdd: () => void;
  disabled?: boolean;
}

export default function BeerButton({ onAdd, disabled }: BeerButtonProps) {
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedOnPress = useRef(false);

  const clearTimers = useCallback(() => {
    if (startTimer.current) clearTimeout(startTimer.current);
    if (repeatTimer.current) clearInterval(repeatTimer.current);
    startTimer.current = null;
    repeatTimer.current = null;
  }, []);

  const handlePressStart = useCallback(() => {
    if (disabled) return;
    firedOnPress.current = true;
    onAdd();
    startTimer.current = setTimeout(() => {
      repeatTimer.current = setInterval(() => {
        onAdd();
      }, HOLD_TO_ADD_TICK_MS);
    }, HOLD_TO_ADD_START_DELAY_MS);
  }, [disabled, onAdd]);

  const handlePressEnd = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  return (
    <button
      disabled={disabled}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onPointerCancel={handlePressEnd}
      className="select-none w-full max-w-xs aspect-square rounded-full bg-gradient-to-b from-gold to-gold-dark text-navy-deep font-black text-2xl shadow-2xl shadow-gold/40 border-4 border-white/30 active:scale-95 transition disabled:opacity-40 flex flex-col items-center justify-center gap-1"
    >
      <span className="text-5xl">🍺</span>
      <span>ADD A BEER</span>
      <span className="text-xs font-bold opacity-60">tap · or hold for more</span>
    </button>
  );
}
