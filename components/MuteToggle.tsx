"use client";

interface MuteToggleProps {
  muted: boolean;
  onToggle: () => void;
}

export default function MuteToggle({ muted, onToggle }: MuteToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={muted ? "Unmute" : "Mute"}
      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
