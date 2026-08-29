import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://fieldguide.dev',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      // Two themes so code blocks follow the site's light/dark.
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },
});
