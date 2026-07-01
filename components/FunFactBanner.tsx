"use client";

import { useEffect, useState } from "react";
import { FUN_FACTS } from "@/lib/content";
import { FUN_FACT_ROTATE_MS } from "@/lib/config";

export default function FunFactBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % FUN_FACTS.length);
    }, FUN_FACT_ROTATE_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      key={index}
      className="animate-rise bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 text-center"
    >
      💡 Did you know? {FUN_FACTS[index]}
    </div>
  );
}
