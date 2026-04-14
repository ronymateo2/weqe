import { sampleCorrelation } from "simple-statistics";

function getAverageRank(values: number[]): number[] {
  const indexed = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const ranks = new Array<number>(values.length);

  let cursor = 0;
  while (cursor < indexed.length) {
    let end = cursor + 1;
    while (end < indexed.length && indexed[end].value === indexed[cursor].value) {
      end += 1;
    }
    const averageRank = (cursor + 1 + end) / 2;
    for (let i = cursor; i < end; i += 1) {
      ranks[indexed[i].index] = averageRank;
    }
    cursor = end;
  }

  return ranks;
}

export function getSpearmanCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 2) return null;
  return sampleCorrelation(getAverageRank(x), getAverageRank(y));
}
