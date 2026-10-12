import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { Landing, CaseStudy, NotFound } from './pages';
export const appConfig: ApplicationConfig = {
  providers: [provideClientHydration(withEventReplay()), provideRouter([
    { path: '', component: Landing }, { path: 'projects/:slug', component: CaseStudy }, { path: '**', component: NotFound }
  ], withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }))]
};
