'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Scroll reveals for the marketing site.
 * - Section headings appear word by word, each word moving from blurred to sharp.
 * - Cards, panels and paragraphs fade up softly as they enter the viewport.
 * Content stays fully visible without JavaScript or with reduced motion: the hidden
 * starting state is only applied once this script has marked the page as ready.
 */
const HEADINGS = '.tp-site main h2';
const BLOCKS = [
  '.tp-site main .lede',
  '.tp-site main .node',
  '.tp-site main .card',
  '.tp-site main .plan',
  '.tp-site main .pb',
  '.tp-site main .measure',
  '.tp-site main .reasons article',
  '.tp-site main .addon',
  '.tp-site main .features .window',
  '.tp-site main .path',
  '.tp-site main .cta-band',
  '.tp-site main .stakes .count',
  '.tp-site main .closing .ctas'
].join(',');

function splitWords(heading: HTMLElement) {
  if (heading.dataset.split) return;
  heading.dataset.split = '1';
  let index = 0;
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? '').split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement('span');
            span.className = 'rv-w';
            span.style.setProperty('--i', String(index++));
            span.textContent = part;
            fragment.appendChild(span);
          }
        }
        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };
  walk(heading);
}

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;

    const headings = Array.from(document.querySelectorAll<HTMLElement>(HEADINGS)).filter(el => !el.closest('[data-no-reveal]'));
    const blocks = Array.from(document.querySelectorAll<HTMLElement>(BLOCKS)).filter(el => !el.closest('[data-no-reveal]'));
    headings.forEach(heading => { splitWords(heading); heading.classList.add('rv-h'); });
    blocks.forEach(block => {
      block.classList.add('rv-b');
      // Stagger siblings in a row (cards, plans, measures) by their position in the parent.
      const siblings = block.parentElement ? Array.from(block.parentElement.children) : [];
      block.style.setProperty('--d', `${Math.max(0, Math.min(siblings.indexOf(block), 6)) * 70}ms`);
    });

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('rv-in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );
    [...headings, ...blocks].forEach(el => observer.observe(el));
    root.classList.add('rv-ready');

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
