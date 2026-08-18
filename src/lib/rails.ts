/**
 * Seeded generation for the drafting-frame rails.
 *
 * Rail segment lengths and dash patterns are randomized so the frame feels
 * drafted rather than templated, but the randomness is seeded and runs at
 * build time, so the markup is stable across builds.
 */

export interface RailSegment {
	/** Relative length of the segment within the rail. */
	flex: number;
	/** Dashed segments render as 4px-on/4px-off ticks instead of a solid line. */
	dashed: boolean;
}

/** Small deterministic PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** 2 to 4 segments with random lengths, just under half of them dashed. */
export function railSegments(seed: number): RailSegment[] {
	const rand = mulberry32(seed);
	const count = 2 + Math.floor(rand() * 3);
	return Array.from({ length: count }, () => ({
		flex: Number((1 + rand() * 3.5).toFixed(3)),
		dashed: rand() < 0.45,
	}));
}
