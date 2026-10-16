'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  { href: '/#how', label: 'How it works', match: '/#how' },
  { href: '/playbooks', label: 'Playbooks', match: '/playbooks' },
  { href: '/pricing', label: 'Pricing', match: '/pricing' },
  { href: '/security', label: 'Security', match: '/security' },
  { href: '/getting-started', label: 'Get started', match: '/getting-started' }
];

export function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const items = links.map(link => (
    <Link
      key={link.href}
      href={link.href}
      aria-current={pathname === link.match ? 'page' : undefined}
      onClick={() => setOpen(false)}
    >
      {link.label}
    </Link>
  ));

  return (
    <>
      <nav className="nav-links" aria-label="Primary">{items}</nav>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(o => !o)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
      <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile" hidden={!open}>
        {items}
        <Link href="/login?next=/console" onClick={() => setOpen(false)}>Sign in</Link>
      </nav>
    </>
  );
}
