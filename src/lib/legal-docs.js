import { marked } from 'marked';

const repository = 'https://github.com/predict-woo/simbi';
const rawRepository = 'https://raw.githubusercontent.com/predict-woo/simbi/main';

export const legalDocuments = {
	'/privacy': 'PRIVACY.md',
	'/terms': 'TERMS.md',
};

export function legalDocumentForPath(pathname) {
	return legalDocuments[pathname.replace(/\/$/, '')];
}

export function legalSourceUrl(document) {
	return `${rawRepository}/${document}`;
}

export function renderLegalMarkdown(markdown) {
	const links = {
		'PRIVACY.md': '/privacy/',
		'TERMS.md': '/terms/',
		LICENSE: `${repository}/blob/main/LICENSE`,
		'THIRD-PARTY-LICENSES.md': `${repository}/blob/main/THIRD-PARTY-LICENSES.md`,
	};

	for (const [source, target] of Object.entries(links)) {
		markdown = markdown.replaceAll(`](${source})`, `](${target})`);
	}

	return marked.parse(markdown);
}
