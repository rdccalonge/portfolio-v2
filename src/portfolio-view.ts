import { Component, input, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeroScene } from './hero';
import { MotionStage } from './motion';
import type { Portfolio } from './generated/model';
import { DOWNLOADS } from './generated/downloads';
export type Project = Portfolio['projects'][number];
export type Layer = Portfolio['skills'][number]['layer'];
@Component({ selector: 'app-project-art', template: `
  <div class="project-art" [attr.data-accent]="project().accent" aria-hidden="true">
    @if(project().screenshots[0]; as cover) { <img class="project-cover" [src]="assetBase() + cover.src" alt="" loading="lazy"><span class="art-caption">{{ project().category }}</span> } @else {
    <div class="art-grid"></div><div class="mock-window"><div class="mock-toolbar"><i></i><i></i><i></i><span>{{ project().category }}</span></div><div class="mock-body"><div class="mock-sidebar"><b></b><b></b><b></b><b></b></div><div class="mock-content"><div class="mock-heading"></div><div class="mock-stats"><i></i><i></i><i></i></div><div class="mock-chart"><b></b><b></b><b></b><b></b><b></b><b></b><b></b></div></div></div></div>
    <span class="art-caption">CONCEPT VISUAL · {{ project().category }}</span>
    }
  </div>` })
export class ProjectArt { project = input.required<Project>(); assetBase = input(''); }
@Component({ selector: 'app-project-detail', imports: [ProjectArt], template: `
  <div class="case-heading"><span class="eyebrow">{{ project().category }}</span><h1>{{ project().title }}</h1><p>{{ project().description }}</p></div>
  @if (!project().screenshots.length) { <app-project-art [project]="project()" /> }
  <div class="case-sections">@for (section of sections(); track section.title) { @if(section.text) { <section><span class="eyebrow">{{ section.title }}</span><p>{{ section.text }}</p></section> } }</div>
  @if (project().technologies.length) { <section class="case-tech-stack" aria-label="Tech stack used"><h2 class="eyebrow">Tech stack used</h2><div class="tags">@for (tech of project().technologies; track tech) { <span>{{ tech }}</span> }</div></section> }
  @if (project().screenshots.length) {
    <section class="screenshot-gallery" aria-label="Project screenshots">
      <div class="gallery-heading"><span class="eyebrow">Inside the project</span><span aria-live="polite">{{ selected() + 1 }} / {{ project().screenshots.length }}</span></div>
      <figure class="gallery-frame">
        <div class="gallery-toolbar" aria-hidden="true"><i></i><i></i><i></i><span>{{ project().title }}</span></div>
        <button class="gallery-open" aria-label="Open screenshot full screen" (click)="viewer.showModal()" (touchstart)="touchStart($event)" (touchend)="touchEnd($event)"><img [src]="assetBase() + active().src" [alt]="active().alt" (load)="classify($event)"><span>↗ View full screen</span></button>
        <figcaption>{{ active().alt }}</figcaption>
      </figure>
      <div class="gallery-controls"><button aria-label="Previous screenshot" (click)="move(-1)">←</button><p>Select a screen to explore</p><button aria-label="Next screenshot" (click)="move(1)">→</button></div>
      <div class="gallery-thumbnails">@for (shot of project().screenshots; track shot.src; let i = $index) { <button [attr.aria-label]="'Show screenshot ' + (i + 1)" [attr.aria-pressed]="selected() === i" (click)="selected.set(i)"><img [src]="assetBase() + shot.src" alt="" loading="lazy"><span>{{ i + 1 }}</span></button> }</div>
    </section>
    <dialog #viewer class="screenshot-viewer" aria-label="Screenshot viewer" (keydown.arrowleft)="move(-1); $event.preventDefault()" (keydown.arrowright)="move(1); $event.preventDefault()">
      <div class="viewer-header"><span>{{ selected() + 1 }} / {{ project().screenshots.length }}</span><button autofocus aria-label="Close screenshot viewer" (click)="viewer.close()">Close ×</button></div>
      <div class="viewer-image" (touchstart)="touchStart($event)" (touchend)="touchEnd($event)"><img [src]="assetBase() + active().src" [alt]="active().alt"></div>
      <div class="viewer-footer"><button aria-label="Previous screenshot" (click)="move(-1)">←</button><p>{{ active().alt }}</p><button aria-label="Next screenshot" (click)="move(1)">→</button></div>
    </dialog>
  }
` })
export class ProjectDetail {
  project = input.required<Project>(); assetBase = input('');
  selected = signal(0);
  active = computed(() => this.project().screenshots[this.selected()] ?? this.project().screenshots[0]);
  classify(event: Event) { const image = event.target as HTMLImageElement; image.classList.toggle('portrait-shot', image.naturalHeight > image.naturalWidth * 1.3); }
  private startX = 0;
  move(direction: number) { const count = this.project().screenshots.length; if (count) this.selected.update(index => (index + direction + count) % count); }
  touchStart(event: TouchEvent) { this.startX = event.changedTouches[0].clientX; }
  touchEnd(event: TouchEvent) { const distance = event.changedTouches[0].clientX - this.startX; if (Math.abs(distance) > 60) this.move(distance < 0 ? 1 : -1); }
  sections = computed(() => [{ title: '01 / The problem', text: this.project().problem }, { title: '02 / My contribution', text: this.project().contribution }, { title: '03 / Technical decisions', text: this.project().decisions }, { title: '04 / The outcome', text: this.project().outcome }]);
  hasStory = computed(() => this.sections().some(s => s.text));
}
@Component({ selector: 'app-portfolio-view', imports: [FormsModule, RouterLink, HeroScene, ProjectArt, ProjectDetail, MotionStage], templateUrl: './portfolio-view.html' })
export class PortfolioView {
  data = input.required<Portfolio>(); preview = input(false); assetBase = input('');
  query = signal(''); selected = signal<Layer | null>(null);
  layers = computed(() => this.data().layers ?? []);
  downloads = DOWNLOADS;
  opened = signal<Project | null>(null);
  visible = computed(() => this.data().projects.filter(p => p.published && (this.selected() === null || p.layers.includes(this.selected() as Layer)) && `${p.title} ${p.category} ${p.technologies.join(' ')}`.toLowerCase().includes(this.query().toLowerCase())).sort((a, b) => Number(b.featured) - Number(a.featured)));
  choose(layer: Layer | null) { this.selected.set(layer); }
  skills(layer: Layer) { return this.data().skills.filter(s => s.layer === layer); }
  setQuery(event: Event) { this.query.set((event.target as HTMLInputElement).value); }
}


