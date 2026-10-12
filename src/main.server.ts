import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes, RenderMode } from '@angular/ssr';
import { App } from './app';
import { appConfig } from './app.config';
import { CONTENT } from './generated/content';
const config = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering(withRoutes([
    { path: '', renderMode: RenderMode.Prerender },
    { path: 'projects/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: async () => CONTENT.projects.map(p => ({ slug: p.id })) },
    { path: '**', renderMode: RenderMode.Prerender }
  ]))]
});
export default (context: BootstrapContext) => bootstrapApplication(App, config, context);
