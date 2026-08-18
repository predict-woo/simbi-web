import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyDownloadPlatform } from './download-platform.js';

test('classifies supported, unsupported, and privacy-limited devices', () => {
	assert.equal(classifyDownloadPlatform({ platform: 'macOS', architecture: 'arm' }), 'arm');
	assert.equal(classifyDownloadPlatform({ platform: 'macOS', architecture: 'x86' }), 'intel');
	assert.equal(classifyDownloadPlatform({ platform: 'MacIntel' }), 'mac-unknown');
	assert.equal(classifyDownloadPlatform({ platform: 'MacIntel', touchPoints: 5 }), 'mobile');
	assert.equal(classifyDownloadPlatform({ platform: 'Android', mobile: true }), 'mobile');
	assert.equal(classifyDownloadPlatform({ platform: 'Windows', architecture: 'arm' }), 'other');
});
