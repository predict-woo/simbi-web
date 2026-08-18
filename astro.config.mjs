// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://getsimbi.app',
	integrations: [
		starlight({
			title: 'Simbi',
			description: 'An open-source macOS notetaking app with local audio recording and diarization.',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/predict-woo/simbi' }],
			editLink: {
				baseUrl: 'https://github.com/predict-woo/simbi-web/edit/main/',
			},
			sidebar: [{ autogenerate: { directory: 'docs' } }],
		}),
	],
});
