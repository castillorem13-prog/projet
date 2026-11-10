/** Hasard à graine (mulberry32) : la même graine redonne toujours le même exercice, sur le serveur comme dans le navigateur. */
export interface Rng {
  /** Nombre dans [0, 1[. */
  next(): number;
  /** Entier entre min et max inclus. */
  int(min: number, max: number): number;
  /** Entier non nul entre −max et max. */
  nonZero(max: number): number;
  pick<T>(list: readonly T[]): T;
  shuffle<T>(list: readonly T[]): T[];
  /** n éléments distincts, dans un ordre quelconque. */
  sample<T>(list: readonly T[], n: number): T[];
  chance(p: number): boolean;
}

/** Empreinte d'une chaîne (FNV-1a), pour donner une graine différente à chaque générateur. */
export function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function rng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const shuffle = <T>(list: readonly T[]): T[] => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  };
  return {
    next,
    int,
    nonZero: (max) => (next() < 0.5 ? -1 : 1) * int(1, max),
    pick: (list) => list[Math.floor(next() * list.length)]!,
    shuffle,
    sample: (list, n) => shuffle(list).slice(0, n),
    chance: (p) => next() < p,
  };
}
