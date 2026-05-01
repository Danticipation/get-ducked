export interface StoryContext {
  targetName: string;
  isRevenge?: boolean;
  chainLength?: number;
  isSelfDuck?: boolean;
  timestampMs?: number;
}

export interface FeedContext {
  direction: 'gave' | 'received';
  otherName: string;
  isRevenge?: boolean;
  timestampMs?: number;
}

function hourOf(ts?: number): number {
  if (!ts) return new Date().getHours();
  return new Date(ts).getHours();
}

function isNight(h: number): boolean {
  return h >= 22 || h < 5;
}

function isEarly(h: number): boolean {
  return h >= 5 && h < 8;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function postScanHeadline(ctx: StoryContext): string {
  if (ctx.isSelfDuck) {
    return pick([
      'Self-duck? Come on now.',
      'That is not how this works.',
      'Caught yourself. Shame.',
    ]);
  }
  const h = hourOf(ctx.timestampMs);
  if (ctx.chainLength && ctx.chainLength >= 3) {
    return pick([
      `Chain unlocked! ${ctx.targetName} fell next.`,
      `On fire. ${ctx.targetName} was powerless.`,
      `${ctx.chainLength} in a row. ${ctx.targetName} never stood a chance.`,
    ]);
  }
  if (ctx.isRevenge) {
    return pick([
      `Revenge complete. ${ctx.targetName} knows what they did.`,
      `Balance restored. ${ctx.targetName} got theirs.`,
      `An eye for an eye. ${ctx.targetName} gets ducked.`,
    ]);
  }
  if (isNight(h)) {
    return pick([
      `Midnight strike. ${ctx.targetName} never saw it coming.`,
      `Late-night predator. ${ctx.targetName} caught sleeping.`,
      `Night shift closed. ${ctx.targetName} ducked.`,
    ]);
  }
  if (isEarly(h)) {
    return pick([
      `Early bird gets ${ctx.targetName}.`,
      `Sunrise snipe. ${ctx.targetName} ducked.`,
      `Dawn patrol. ${ctx.targetName} caught.`,
    ]);
  }
  return pick([
    `You ducked ${ctx.targetName} clean.`,
    `${ctx.targetName} got theirs.`,
    `Nice hit. ${ctx.targetName} ducked.`,
  ]);
}

export function feedLine(ctx: FeedContext): string {
  const h = hourOf(ctx.timestampMs);
  if (ctx.direction === 'gave') {
    if (ctx.isRevenge) return `Revenge on ${ctx.otherName}`;
    if (isNight(h)) return `Night hit: ${ctx.otherName}`;
    return `You ducked ${ctx.otherName}`;
  }
  if (ctx.isRevenge) return `${ctx.otherName} got revenge`;
  if (isNight(h)) return `Ambushed by ${ctx.otherName} (night)`;
  return `${ctx.otherName} ducked you`;
}

export function taglineForRank(rankTitle?: string, currentStreak?: number): string {
  if ((currentStreak ?? 0) >= 5) return 'On a heater.';
  if ((currentStreak ?? 0) >= 3) return 'Cooking.';
  switch (rankTitle || '') {
    case 'Supreme Duckinator': return 'The apex.'
    case 'Quack Assassin': return 'Silent and deadly.';
    case 'Quack Lord': return 'Everyone knows the name.';
    default: return 'Time to go hunting.';
  }
}
