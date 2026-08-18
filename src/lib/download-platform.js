export function classifyDownloadPlatform({
	platform = '',
	userAgent = '',
	touchPoints = 0,
	architecture = '',
	mobile = false,
}) {
	const isIPad = touchPoints > 1 && /^Mac/.test(platform);
	if (mobile || isIPad || /Android|iPhone|iPad|iPod/i.test(userAgent)) return 'mobile';

	const isMac =
		platform.toLowerCase() === 'macos' || /^Mac/.test(platform) || /Macintosh/.test(userAgent);

	if (!isMac) return 'other';
	if (/^(arm|aarch64)/i.test(architecture)) return 'arm';
	if (/^x86/i.test(architecture)) return 'intel';
	return 'mac-unknown';
}

export async function detectDownloadPlatform(navigatorValue = navigator) {
	const userAgentData = navigatorValue.userAgentData;
	let architecture = '';

	if (userAgentData?.getHighEntropyValues) {
		try {
			({ architecture = '' } = await userAgentData.getHighEntropyValues(['architecture']));
		} catch {}
	}

	return classifyDownloadPlatform({
		platform: userAgentData?.platform || navigatorValue.platform,
		userAgent: navigatorValue.userAgent,
		touchPoints: navigatorValue.maxTouchPoints,
		architecture,
		mobile: userAgentData?.mobile,
	});
}
