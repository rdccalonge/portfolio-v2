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
    <div class="art-grid"></div><div class="mock-window"><div class="mock-toolbar"><i></i><i></i><i></i><span>{{ project().category }}</span></div><div class="mock-body"><div class="mock-sidebar"><b></b><b></b><b></b><b></b></div><div class="mock-content"><div class="mock-heading"></div><div class="mock-stats"><i></i><i></i><i></i></div><div class="mock-chart"><b></b><b></b><b></b><b></b><b></b><b></b><b></b></div></div></div></div>
    <span class="art-caption">CONCEPT VISUAL · {{ project().category }}</span>
  </div>` })
export class ProjectArt { project = input.required<Project>(); }
@Component({ selector: 'app-project-detail', imports: [ProjectArt], template: `
  <div class="case-heading"><span class="eyebrow">{{ project().category }}</span><h1>{{ project().title }}</h1><p>{{ project().description }}</p><div class="tags">@for (tech of project().technologies; track tech) { <span>{{ tech }}</span> }</div></div>
  <app-project-art [project]="project()" />
  <div class="case-sections">@for (section of sections(); track section.title) { @if(section.text) { <section><span class="eyebrow">{{ section.title }}</span><p>{{ section.text }}</p></section> } }</div>
  @if (!hasStory()) { <p class="case-note">This project is part of my existing work collection. A detailed case study will be added here.</p> }
  @for (shot of project().screenshots; track shot.src) { <figure><img [src]="assetBase() + shot.src" [alt]="shot.alt" loading="lazy"><figcaption>{{ shot.alt }}</figcaption></figure> }
` })
export class ProjectDetail {
  project = input.required<Project>(); assetBase = input('');
  sections = computed(() => [{ title: '01 / The problem', text: this.project().problem }, { title: '02 / My contribution', text: this.project().contribution }, { title: '03 / Technical decisions', text: this.project().decisions }, { title: '04 / The outcome', text: this.project().outcome }]);
  hasStory = computed(() => this.sections().some(s => s.text));
}
@Component({ selector: 'app-portfolio-view', imports: [FormsModule, RouterLink, HeroScene, ProjectArt, ProjectDetail, MotionStage], templateUrl: './portfolio-view.html' })
export class PortfolioView {
  data = input.required<Portfolio>(); preview = input(false); assetBase = input('');
  query = signal(''); selected = signal<Layer | 'All'>('All');
  layers: Layer[] = ['Frontend', 'Backend', 'Data', 'Cloud'];
  downloads = DOWNLOADS;
  opened = signal<Project | null>(null);
  visible = computed(() => this.data().projects.filter(p => p.published && (this.selected() === 'All' || p.layers.includes(this.selected() as Layer)) && `${p.title} ${p.category} ${p.technologies.join(' ')}`.toLowerCase().includes(this.query().toLowerCase())).sort((a, b) => Number(b.featured) - Number(a.featured)));
  choose(layer: Layer | 'All') { this.selected.set(layer); }
  skills(layer: Layer) { return this.data().skills.filter(s => s.layer === layer); }
  setQuery(event: Event) { this.query.set((event.target as HTMLInputElement).value); }
}
