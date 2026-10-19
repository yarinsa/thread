import { beforeEach, describe, expect, it } from 'vitest';
import { resolveAnchor, selectorFor } from './anchor';

describe('selectorFor', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main>
        <section data-testid="settings">
          <button>One</button>
          <button>Two</button>
        </section>
        <div id="footer"><span>a</span></div>
        <ul><li>x</li><li>y</li></ul>
      </main>`;
  });

  it('stops at the nearest data-testid ancestor', () => {
    const second = document.querySelectorAll('button')[1]!;
    const selector = selectorFor(second);
    expect(selector).toBe('[data-testid="settings"] > button:nth-of-type(2)');
    expect(document.querySelector(selector)).toBe(second);
  });

  it('stops at an id ancestor', () => {
    const span = document.querySelector('#footer span')!;
    expect(selectorFor(span)).toBe('#footer > span');
  });

  it('falls back to a structural path when no stable attribute exists', () => {
    const li = document.querySelectorAll('li')[1]!;
    const selector = selectorFor(li);
    expect(selector).toBe('main > ul > li:nth-of-type(2)');
    expect(document.querySelector(selector)).toBe(li);
  });

  it('returns null for a selector that no longer matches or is malformed', () => {
    expect(resolveAnchor({ selector: '#missing', route: '/', offsetX: 0, offsetY: 0 })).toBeNull();
    expect(resolveAnchor({ selector: '[[', route: '/', offsetX: 0, offsetY: 0 })).toBeNull();
  });
});
