import assert from 'node:assert/strict';
import test from 'node:test';
import { legalDocumentForPath, renderLegalMarkdown } from '../src/lib/legal-docs.js';
import worker, { downloadEmail, normalizeEmail, resolveLatestArmDmg, selectArmDmg } from './index.js';

test('resolves the latest ARM DMG and rejects an ambiguous release', async () => {
	const downloadUrl = 'https://github.com/predict-woo/simbi/releases/download/v1.2.3/Simbi-1.2.3.dmg';
	const fetchRelease = async () =>
		new Response(JSON.stringify({ assets: [{ name: 'Simbi-1.2.3.dmg', browser_download_url: downloadUrl }] }));

	assert.equal(await resolveLatestArmDmg(fetchRelease), downloadUrl);
	assert.equal(
		selectArmDmg([
			{ name: 'Simbi-arm64.dmg', browser_download_url: 'https://example.com/arm' },
			{ name: 'Simbi-x64.dmg', browser_download_url: 'https://example.com/intel' },
		]).name,
		'Simbi-arm64.dmg',
	);
	assert.equal(
		selectArmDmg([
			{ name: 'Simbi-one.dmg', browser_download_url: 'https://example.com/one' },
			{ name: 'Simbi-two.dmg', browser_download_url: 'https://example.com/two' },
		]),
		undefined,
	);
});

test('sends a rate-limited mobile download email', async () => {
	let sent;
	const env = {
		ASSETS: { fetch: () => new Response('asset') },
		EMAIL: { send: async (message) => (sent = message) },
		EMAIL_ADDRESS_RATE_LIMITER: { limit: async () => ({ success: true }) },
		EMAIL_GLOBAL_RATE_LIMITER: { limit: async () => ({ success: true }) },
	};
	const response = await worker.fetch(
		new Request('https://getsimbi.app/api/email-download', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Origin: 'https://getsimbi.app',
			},
			body: JSON.stringify({ email: ' Person@Example.com ' }),
		}),
		env,
	);

	assert.equal(response.status, 200);
	assert.equal(sent.to, 'person@example.com');
	assert.match(sent.html, /download\.getsimbi\.app\/darwin-arm64/);
	assert.equal(normalizeEmail('not-an-email'), undefined);
	assert.match(downloadEmail('person@example.com').text, /Thanks for trying Simbi/);
});

test('renders legal Markdown with website-safe links', () => {
	assert.equal(legalDocumentForPath('/terms/'), 'TERMS.md');
	assert.equal(legalDocumentForPath('/privacy'), 'PRIVACY.md');
	const html = renderLegalMarkdown('# Policy\n\nSee [terms](TERMS.md) and [license](LICENSE).');
	assert.match(html, /href="\/terms\/"/);
	assert.match(html, /github\.com\/predict-woo\/simbi\/blob\/main\/LICENSE/);
});
