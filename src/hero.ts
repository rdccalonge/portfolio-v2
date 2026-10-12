import { Component, ElementRef, ViewChild, afterNextRender, OnDestroy, signal } from '@angular/core';
@Component({ selector: 'app-hero-scene', template: `
  <div class="scene-shell" aria-hidden="true"><div class="scene-grid"></div><canvas #canvas></canvas>
    <div class="orbital-fallback" [class.enhanced]="ready()"><div class="orbit one"></div><div class="orbit two"></div><div class="orbit three"></div><div class="core">&lt;/&gt;</div></div>
    <span class="scene-tag tag-a">INTERFACE</span><span class="scene-tag tag-b">LOGIC</span><span class="scene-tag tag-c">DATA</span><span class="scene-tag tag-d">CLOUD</span>
    <div class="scene-label"><span class="status-dot"></span> CONNECTING THE LAYERS</div>
  </div>
` })
export class HeroScene implements OnDestroy {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  ready = signal(false);
  private cleanup = () => {};
  private destroyed = false;
  constructor() { afterNextRender(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { observer.disconnect(); void this.start(); }
    });
    observer.observe(this.canvas.nativeElement); this.cleanup = () => observer.disconnect();
  }); }
  private async start() {
    try {
      const THREE = await import('three'); if (this.destroyed) return;
      const canvas = this.canvas.nativeElement;
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, .1, 100); camera.position.z = 7;
      const group = new THREE.Group(); scene.add(group);
      const geometry = new THREE.IcosahedronGeometry(1.1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x78efdc, wireframe: true, transparent: true, opacity: .75 });
      group.add(new THREE.Mesh(geometry, material));
      const rings: InstanceType<typeof THREE.Mesh>[] = [];
      [0x78efdc, 0xab9bf5, 0xcef594].forEach((color, i) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7 + i * .28, .009, 8, 100), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .55 }));
        ring.rotation.x = .7 + i * .8; ring.rotation.y = .4 + i * .5; group.add(ring); rings.push(ring);
      });
      const resize = new ResizeObserver(() => {
        const rect = canvas.parentElement!.getBoundingClientRect(); renderer.setSize(rect.width, rect.height); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix();
      }); resize.observe(canvas.parentElement!);
      let visible = true; const visibility = new IntersectionObserver(e => visible = e[0].isIntersecting); visibility.observe(canvas);
      let px = 0, py = 0;
      const pointer = (event: PointerEvent) => { const r = canvas.getBoundingClientRect(); px = ((event.clientX - r.left) / r.width - .5) * .5; py = ((event.clientY - r.top) / r.height - .5) * .5; };
      canvas.addEventListener('pointermove', pointer);
      let elapsed = 0, last = 0;
      renderer.setAnimationLoop((time) => {
        const delta = last ? Math.min(time - last, 50) : 0; last = time;
        if (!visible || document.hidden || canvas.closest('[data-motion="paused"]') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        elapsed += delta; group.rotation.y = elapsed * .00012 + px; group.rotation.x = py;
        rings.forEach((r, i) => r.rotation.z = elapsed * .0001 * (i + 1)); renderer.render(scene, camera);
      });
      this.ready.set(true);
      this.cleanup = () => { renderer.setAnimationLoop(null); resize.disconnect(); visibility.disconnect(); canvas.removeEventListener('pointermove', pointer); scene.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); const m = o.material; (Array.isArray(m) ? m : [m]).forEach(x => x.dispose()); } }); renderer.dispose(); };
    } catch { this.ready.set(false); }
  }
  ngOnDestroy() { this.destroyed = true; this.cleanup(); }
}
