import type { ReactNode } from 'react';
import { JetBrains_Mono, Schibsted_Grotesk } from 'next/font/google';
import { SiteFooter, SiteNav } from '@/components/site/SiteChrome';
import './site.css';

const display = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-tp-display', weight: ['400', '500', '600', '700', '800'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-tp-mono', weight: ['400', '500'] });

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`tp-site ${display.variable} ${mono.variable}`}>
      <SiteNav />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
