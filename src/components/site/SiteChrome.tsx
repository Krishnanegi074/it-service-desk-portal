import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { NavLinks } from './NavLinks';

export function Mark() {
  return <i aria-hidden="true" />;
}

export function SiteNav() {
  return (
    <header className="nav">
      <div className="rail">
        <Link href="/" className="mark" aria-label="Triage Portal home">
          <Mark />
          Triage Portal
        </Link>
        <NavLinks />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/login?next=/console" className="btn btn-ghost nav-signin">Sign in</Link>
          <Link href="/report" className="btn btn-primary">Report an issue</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="rail">
        <div className="foot">
          <div>
            <Link href="/" className="mark"><Mark />Triage Portal</Link>
            <p className="tag">{siteConfig.tagline}</p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><Link href="/#how">How it works</Link></li>
              <li><Link href="/playbooks">Playbook library</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/security">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4>Get started</h4>
            <ul>
              <li><Link href="/getting-started">Getting started</Link></li>
              <li><Link href="/report">Report an issue</Link></li>
              <li><Link href="/console">Engineer console</Link></li>
              <li><Link href="/pricing#setup">Setup service</Link></li>
            </ul>
          </div>
          <div>
            <h4>Resources</h4>
            <ul>
              <li><a href={siteConfig.githubUrl} target="_blank" rel="noreferrer">GitHub</a></li>
              <li><a href={siteConfig.roadmapUrl} target="_blank" rel="noreferrer">Roadmap</a></li>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© 2026 Triage Portal</span>
          <span>Designed and built by Krishna Negi</span>
        </div>
      </div>
    </footer>
  );
}
