/** Public, merchant-approved content only. Empty values are intentional launch gates. */
export const funnelConfig = {
  amazon: {} as Record<string, { url: string; asin: string; verified: boolean }>,
  launchLabel: 'Pre-Order on Amazon – Nov 2026',
  author: {
    photoSource: 'assets/founder-biography.jpeg',
    // The supplied artwork contains a genuine portrait. Display it with CSS cropping.
    photoIsBiographyArtwork: true,
    approvedBiography: [] as string[],
    dedication: 'In respectful memory of the late Ezi Achama Eke.',
  },
  checklist: { approvedPdfReady: false },
  testimonials: [] as { id: string; name: string; quote: string; designation?: string; photo?: string; approved: boolean }[],
  analytics: { measurementId: '', approved: false },
};
