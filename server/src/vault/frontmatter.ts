import type { Capture } from './writer';

export function buildFrontmatter(c: Capture): string {
  return [
    '---',
    `date: ${c.capturedAt}`,
    `type: ${c.type}`,
    'source: cortex-capture',
    'tags: []',
    '---',
  ].join('\n');
}
