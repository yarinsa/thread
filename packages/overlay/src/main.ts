import { Overlay } from './overlay';
import type { OverlayConfig } from './types';

function readConfig(): OverlayConfig | null {
  const script = document.currentScript as HTMLScriptElement | null;
  const data = script?.dataset ?? {};
  const api = data.api;
  const project = data.project;
  if (!api || !project) {
    console.warn('[review-overlay] missing data-api or data-project on the script tag; not mounting');
    return null;
  }
  return {
    api: api.replace(/\/$/, ''),
    project,
    branch: data.branch ?? 'local',
    author: data.author ?? localStorage.getItem('review-overlay:author') ?? promptAuthor()
  };
}

function promptAuthor(): string {
  const name = window.prompt('Your name for review comments') ?? 'anonymous';
  localStorage.setItem('review-overlay:author', name);
  return name;
}

export function mount(config: OverlayConfig): Overlay {
  return new Overlay(config);
}

const config = readConfig();
if (config) {
  if (document.body) mount(config);
  else document.addEventListener('DOMContentLoaded', () => mount(config));
}
