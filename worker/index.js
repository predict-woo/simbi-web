const DOWNLOAD_HOST = 'download.getsimbi.app';
const DOWNLOAD_PATH = '/darwin-arm64';
const DOWNLOAD_URL = `https://${DOWNLOAD_HOST}${DOWNLOAD_PATH}`;
const EMAIL_PATH = '/api/email-download';
const SITE_HOSTS = new Set(['getsimbi.app', 'www.getsimbi.app']);
const SITE_ORIGINS = new Set(['https://getsimbi.app', 'https://www.getsimbi.app']);
const LATEST_RELEASE_API = 'https://api.github.com/repos/predict-woo/simbi/releases/latest';

function json(body, status = 200, headers = {}) {
	return Response.json(body, { status, headers });
}

export function normalizeEmail(value) {
	if (typeof value !== 'string') return undefined;
	const email = value.trim().toLowerCase();
	return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}

export function downloadEmail(to) {
	return {
		to,
		from: { email: 'downloads@getsimbi.app', name: 'Simbi' },
		subject: 'Your Simbi download link',
		text: `Thanks for trying Simbi.\n\nOpen this email on your Apple silicon Mac and download Simbi here:\n${DOWNLOAD_URL}\n\nYou received this one-time email because this address was entered on getsimbi.app.`,
		html: `<!doctype html>
<html lang="en">
	<body style="margin:0;background:#faf9f6;color:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f6;padding:32px 16px">
			<tr><td align="center">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #ddded2;border-radius:8px">
					<tr><td style="padding:40px">
						<p style="margin:0 0 16px;color:#596423;font-size:18px;font-weight:700">Simbi</p>
						<h1 style="margin:0 0 16px;font-size:30px;line-height:1.2">Thanks for trying Simbi.</h1>
						<p style="margin:0 0 28px;font-size:16px;line-height:1.6">Open this email on your Apple silicon Mac, then use the button below to download the latest version.</p>
						<a href="${DOWNLOAD_URL}" style="display:inline-block;background:#596423;color:#fff;padding:12px 18px;border-radius:4px;text-decoration:none;font-weight:600">Download Simbi</a>
						<p style="margin:32px 0 0;color:#6b6d64;font-size:13px;line-height:1.5">You received this one-time email because this address was entered on getsimbi.app.</p>
					</td></tr>
				</table>
			</td></tr>
		</table>
	</body>
</html>`,
	};
}

async function sendDownloadEmail(request, env) {
	if (request.method !== 'POST') {
		return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
	}

	if (!request.headers.get('content-type')?.startsWith('application/json')) {
		return json({ error: 'Expected JSON.' }, 415);
	}
	if (!SITE_ORIGINS.has(request.headers.get('origin'))) {
		return json({ error: 'Forbidden.' }, 403);
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request.' }, 400);
	}

	if (body.website) return json({ sent: true });
	const email = normalizeEmail(body.email);
	if (!email) return json({ error: 'Enter a valid email address.' }, 400);

	const [addressLimit, globalLimit] = await Promise.all([
		env.EMAIL_ADDRESS_RATE_LIMITER.limit({ key: email }),
		env.EMAIL_GLOBAL_RATE_LIMITER.limit({ key: 'download-email' }),
	]);
	if (!addressLimit.success || !globalLimit.success) {
		return json({ error: 'Please wait a minute before trying again.' }, 429, {
			'Retry-After': '60',
		});
	}

	try {
		await env.EMAIL.send(downloadEmail(email));
		return json({ sent: true });
	} catch (error) {
		console.error('Download email failed', error);
		return json({ error: 'Could not send the email. Please try again.' }, 502);
	}
}

export function selectArmDmg(assets = []) {
	const dmgs = assets.filter(
		(asset) => asset.name?.toLowerCase().endsWith('.dmg') && asset.browser_download_url,
	);
	const namedArmDmg = dmgs.find((asset) => /(arm64|aarch64|apple[-_ ]silicon)/i.test(asset.name));

	// ponytail: releases currently contain one DMG; require architecture in filenames before adding Intel.
	return namedArmDmg || (dmgs.length === 1 ? dmgs[0] : undefined);
}

export async function resolveLatestArmDmg(fetchRelease = fetch) {
	const response = await fetchRelease(LATEST_RELEASE_API, {
		headers: {
			Accept: 'application/vnd.github+json',
			'User-Agent': 'simbi-download-redirect',
			'X-GitHub-Api-Version': '2022-11-28',
		},
		cf: { cacheEverything: true, cacheTtl: 300 },
	});

	if (!response.ok) throw new Error(`GitHub latest release request failed: ${response.status}`);

	const asset = selectArmDmg((await response.json()).assets);
	if (!asset) throw new Error('Latest release has no unambiguous ARM DMG');

	const download = new URL(asset.browser_download_url);
	if (download.protocol !== 'https:' || download.hostname !== 'github.com') {
		throw new Error('Latest release returned an unexpected download URL');
	}

	return download.href;
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (SITE_HOSTS.has(url.hostname) && url.pathname === EMAIL_PATH) {
			return sendDownloadEmail(request, env);
		}

		if (url.hostname !== DOWNLOAD_HOST || url.pathname !== DOWNLOAD_PATH) {
			return env.ASSETS.fetch(request);
		}

		if (request.method !== 'GET' && request.method !== 'HEAD') {
			return new Response('Method not allowed\n', {
				status: 405,
				headers: { Allow: 'GET, HEAD' },
			});
		}

		try {
			return new Response(null, {
				status: 302,
				headers: {
					Location: await resolveLatestArmDmg(),
					'Cache-Control': 'no-store',
				},
			});
		} catch (error) {
			console.error(error);
			return new Response('Download temporarily unavailable\n', { status: 502 });
		}
	},
};
