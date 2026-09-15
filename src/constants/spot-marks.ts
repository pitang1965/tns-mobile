// スポットの印: 「行ったことがあるか」×「次に行きたいか」の組み合わせを1つの値で持つ。
// 画面では4つから1つを選ぶ(行きたい→行ったを選べば「行きたい」は自然に外れる)。詳細はCONTEXT.md参照
export type SpotMark = 'want' | 'visited' | 'again';
export type SpotMarkState = SpotMark | 'none';

export type SpotMarkEntry = {
  mark: SpotMark;
  updatedAt: string;
};

// spotId → 印。印なしのスポットはキーを持たない
export type SpotMarks = Record<string, SpotMarkEntry>;

export const AllSpotMarks: SpotMark[] = ['want', 'visited', 'again'];

export const SpotMarkLabels: Record<SpotMark, string> = {
  want: '♡ 行きたい',
  visited: '✓ 行った',
  again: '♡ また行きたい',
};

// 印ボタン・地図の印マーカーの色(♡系は同じ色で「次に行きたい」を表す)
export const SpotMarkColors: Record<SpotMark, string> = {
  want: '#E0245E',
  visited: '#455A64',
  again: '#E0245E',
};

export function markOf(marks: SpotMarks, spotId: string): SpotMarkState {
  return marks[spotId]?.mark ?? 'none';
}

// 「次に行きたい」側: 行きたい・また行きたい
export function isWantToVisit(mark: SpotMarkState): boolean {
  return mark === 'want' || mark === 'again';
}

export function countMarks(marks: SpotMarks): Record<SpotMark, number> {
  const counts: Record<SpotMark, number> = { want: 0, visited: 0, again: 0 };
  for (const entry of Object.values(marks)) {
    counts[entry.mark] += 1;
  }
  return counts;
}
