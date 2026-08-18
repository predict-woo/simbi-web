// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://getsimbi.app',
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		starlight({
			title: 'Simbi',
			description: 'An open-source macOS notetaking app with local audio recording and diarization.',
			logo: { src: './src/assets/simbi-icon.svg' },
			customCss: ['./src/styles/starlight.css'],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/predict-woo/simbi' }],
			editLink: {
				baseUrl: 'https://github.com/predict-woo/simbi-web/edit/main/',
			},
			sidebar: [{ autogenerate: { directory: 'docs' } }],
		}),
	],
});
