import type { Anchor } from './types';

const cssEscape = (value: string) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, '\\$&'));

function segment(element: Element): string {
  const testId = element.getAttribute('data-testid');
  if (testId) return `[data-testid="${cssEscape(testId)}"]`;
  if (element.id) return `#${cssEscape(element.id)}`;
  const parent = element.parentElement;
  if (!parent) return element.tagName.toLowerCase();
  const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
  const tag = element.tagName.toLowerCase();
  return siblings.length === 1 ? tag : `${tag}:nth-of-type(${siblings.indexOf(element) + 1})`;
}

export function selectorFor(target: Element, root: Element = document.body): string {
  const parts: string[] = [];
  let current: Element | null = target;
  while (current && current !== root) {
    const part = segment(current);
    parts.unshift(part);
    if (part.startsWith('[data-testid') || part.startsWith('#')) break;
    current = current.parentElement;
  }
  return parts.join(' > ');
}

export function anchorFor(target: Element, clientX: number, clientY: number): Anchor {
  const rect = target.getBoundingClientRect();
  return {
    selector: selectorFor(target),
    route: window.location.pathname,
    offsetX: rect.width ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0,
    offsetY: rect.height ? Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)) : 0
  };
}

export function resolveAnchor(anchor: Anchor): Element | null {
  try {
    return document.querySelector(anchor.selector);
  } catch {
    return null;
  }
}

export function pinPosition(anchor: Anchor): { x: number; y: number; attached: boolean } {
  const element = resolveAnchor(anchor);
  if (!element) return { x: window.innerWidth - 72, y: 24, attached: false };
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width * anchor.offsetX, y: rect.top + rect.height * anchor.offsetY, attached: true };
}
