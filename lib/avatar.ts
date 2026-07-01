const EMOJIS = ["🦅", "🎆", "🍺", "🌟", "🔥", "⭐", "🎯", "🏆", "🚀", "🎉", "🌭", "🥇"];
const COLORS = ["#e0264f", "#f4b942", "#3ea6ff", "#5ce6a0", "#c98a1b", "#ff8a5c", "#9d7bff", "#5cd6d6"];

export function avatarFor(memberId: string): { emoji: string; color: string } {
  let hash = 0;
  for (let i = 0; i < memberId.length; i++) {
    hash = (hash * 31 + memberId.charCodeAt(i)) >>> 0;
  }
  return {
    emoji: EMOJIS[hash % EMOJIS.length],
    color: COLORS[Math.floor(hash / EMOJIS.length) % COLORS.length],
  };
}
