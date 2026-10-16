import type { ReactNode } from 'react';

export function LegalDoc({ title, updated, intro, children }: { title: string; updated: string; intro: string; children: ReactNode }) {
  return (
    <>
      <section className="page-hero" aria-labelledby="doc-title">
        <div className="rail">
          <span className="status"><i />Last updated {updated} · Early-access draft</span>
          <h1 id="doc-title">{title}</h1>
          <p className="sub">{intro}</p>
        </div>
      </section>
      <section className="block" style={{ borderBottom: 0, paddingBlock: '64px 112px' }}>
        <div className="rail">
          <article className="doc">{children}</article>
        </div>
      </section>
    </>
  );
}
