import { Directive, ElementRef, afterNextRender, signal, OnDestroy } from '@angular/core';

/** Motion is progressive: server-rendered content is always readable. */
@Directive({ selector: '[motionStage]', exportAs: 'motionStage', host: { '[attr.data-motion]': 'paused() ? "paused" : "running"' } })
export class MotionStage implements OnDestroy {
  paused = signal(false);
  private dispose: (() => void)[] = [];
  constructor(private element: ElementRef<HTMLElement>) {
    afterNextRender(() => {
      const host = element.nativeElement;
      const preference = matchMedia('(prefers-reduced-motion: reduce)');
      try { this.paused.set(preference.matches || localStorage.getItem('portfolio-motion') === 'paused'); } catch { this.paused.set(preference.matches); }
      const change = () => { if (preference.matches) this.paused.set(true); };
      preference.addEventListener('change', change);
      this.dispose.push(() => preference.removeEventListener('change', change));
      const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('revealed'); reveal.unobserve(entry.target); }
      }), { threshold: .08 });
      host.querySelectorAll('.section-heading, .project-card, .system-node, .about-panel, .education, .contact-section > *').forEach((node, i) => {
        if (node.getBoundingClientRect().top > innerHeight && !this.paused()) node.classList.add('reveal-ready');
        (node as HTMLElement).style.setProperty('--reveal-delay', `${(i % 3) * 80}ms`);
        reveal.observe(node);
      });
      const visible = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('in-viewport', e.isIntersecting)));
      host.querySelectorAll('.hero, .project-art, .systems-map, .stack-strip').forEach(node => visible.observe(node));
      this.dispose.push(() => { reveal.disconnect(); visible.disconnect(); });
      const finePointer = matchMedia('(pointer: fine)');
      host.querySelectorAll<HTMLElement>('.hero-portrait, .project-art').forEach(node => {
        let frame = 0;
        const reset = () => { cancelAnimationFrame(frame); node.style.setProperty('--tilt-x', '0deg'); node.style.setProperty('--tilt-y', '0deg'); };
        const move = (event: PointerEvent) => {
          if (this.paused() || !finePointer.matches) return;
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            const rect = node.getBoundingClientRect();
            node.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - .5) * 9}deg`);
            node.style.setProperty('--tilt-x', `${-((event.clientY - rect.top) / rect.height - .5) * 9}deg`);
          });
        };
        node.addEventListener('pointermove', move, { passive: true }); node.addEventListener('pointerleave', reset);
        this.dispose.push(() => { node.removeEventListener('pointermove', move); node.removeEventListener('pointerleave', reset); cancelAnimationFrame(frame); });
      });
      let frame = 0;
      const scroll = () => {
        cancelAnimationFrame(frame); frame = requestAnimationFrame(() => {
          const total = document.documentElement.scrollHeight - innerHeight;
          host.style.setProperty('--scroll-progress', `${total > 0 ? scrollY / total : 0}`);
        });
      };
      addEventListener('scroll', scroll, { passive: true }); scroll();
      this.dispose.push(() => { removeEventListener('scroll', scroll); cancelAnimationFrame(frame); });
    });
  }
  toggle() { this.paused.update(value => !value); try { localStorage.setItem('portfolio-motion', this.paused() ? 'paused' : 'running'); } catch {} }
  ngOnDestroy() { this.dispose.forEach(fn => fn()); }
}
