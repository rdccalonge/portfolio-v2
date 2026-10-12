import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { PortfolioView, ProjectDetail } from './portfolio-view';
import { CONTENT } from './generated/content';
@Component({ imports: [PortfolioView], template: `<app-portfolio-view [data]="data" />` })
export class Landing { data = CONTENT; constructor() { inject(Title).setTitle('Reni Calonge — Full-stack Developer'); inject(Meta).updateTag({ name: 'description', content: CONTENT.profile.summary }); } }
@Component({ imports: [RouterLink, ProjectDetail], template: `<div class="section-wrap case-page"><a class="text-link" routerLink="/" fragment="work">← Back to work</a>@if(project(); as p) { <app-project-detail [project]="p" /><div class="case-bottom"><a class="button primary" routerLink="/" fragment="contact">Let’s talk about your project ↗</a></div> } @else { <h1>Project not found</h1><a routerLink="/">Return to the portfolio</a> }</div>` })
export class CaseStudy {
  project = signal(CONTENT.projects[0] as typeof CONTENT.projects[number] | undefined);
  constructor() { const title = inject(Title); const meta = inject(Meta); inject(ActivatedRoute).paramMap.subscribe(params => { const project = CONTENT.projects.find(p => p.id === params.get('slug')); this.project.set(project); title.setTitle(project ? `${project.title} — Reni Calonge` : 'Project not found'); meta.updateTag({ name: 'description', content: project?.description || 'Explore Reni Calonge’s portfolio.' }); }); }
}
@Component({ imports: [RouterLink], template: `<section class="section-wrap case-page"><span class="eyebrow">404</span><h1>This page took a detour.</h1><a class="button primary" routerLink="/">Back to the portfolio ↗</a></section>` })
export class NotFound {}
