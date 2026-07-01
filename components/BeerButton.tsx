interface BeerButtonProps {
  onAdd: () => void;
  disabled?: boolean;
}

export default function BeerButton({ onAdd, disabled }: BeerButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAdd}
      className="select-none touch-pan-y w-full max-w-xs aspect-square rounded-full bg-gradient-to-b from-gold to-gold-dark text-navy-deep font-black text-2xl shadow-2xl shadow-gold/40 border-4 border-white/30 active:scale-95 transition disabled:opacity-40 flex flex-col items-center justify-center gap-1"
    >
      <span className="text-5xl">🍺</span>
      <span>ADD A BEER</span>
      <span className="text-xs font-bold opacity-60">one tap · one beer</span>
    </button>
  );
}
