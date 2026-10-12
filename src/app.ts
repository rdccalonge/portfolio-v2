import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
@Component({ selector: 'app-root', imports: [RouterOutlet, RouterLink], template: `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header"><a routerLink="/" class="wordmark" aria-label="Reni Calonge home">rc<span>.</span></a>
    <nav aria-label="Main navigation"><a routerLink="/" fragment="work">Work</a><a routerLink="/" fragment="stack">Stack</a><a routerLink="/" fragment="about">About</a></nav>
    <a class="header-contact" routerLink="/" fragment="contact">Let’s connect <span aria-hidden="true">↗</span></a>
  </header><main id="main"><router-outlet /></main>
  <footer><a routerLink="/" class="wordmark">rc<span>.</span></a><span>Built across the stack. Designed with intention.</span><a href="https://app.pagescms.org" target="_blank" rel="noopener noreferrer">Manage content ↗</a></footer>
` })
export class App {}
