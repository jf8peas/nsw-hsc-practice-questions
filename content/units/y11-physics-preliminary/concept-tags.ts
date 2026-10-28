// PUBLIC — which concept each question tests (spec 002). Keyed by concept slug; the values are
// question numbers within this unit ("m" = multiple choice, "s" = short answer). A question has
// exactly one concept, and a repeated or missing question fails `npm run validate`.

const U = "y11-physics-preliminary";

const TAGS: Record<string, string[]> = {
  // --- Fundamentals of mechanics ---
  "scalar-vector": ["m01", "m52", "s01", "s51"],
  "distance-displacement": ["m02", "s02"],
  "speed-velocity": ["s03", "s54"],
  "motion-graphs": ["m03", "m04", "m05", "m54", "m55", "s04", "s05", "s53"],
  acceleration: ["m06", "m51", "s06", "s52"],
  "free-fall": ["m53", "m57", "s55"],
  "newton-first-law": ["m07", "m56", "s07", "s56"],
  "net-force": ["m10", "m12", "m60", "s09", "s58"],
  "newton-second-law": ["m08", "m59", "s57"],
  "newton-third-law": ["m09", "s08", "s59"],
  "mass-weight": ["s60"],
  friction: ["m11", "m58", "s10", "s11", "s61"],
  work: ["m13", "m61", "m63"],
  "energy-conservation": ["m14", "m62", "s12", "s13", "s14", "s62", "s63"],
  "momentum-conservation": ["m15", "m67", "s15", "s64", "s65"],
  "collision-types": ["m16", "m64", "m65", "s16", "s66"],
  "impulse-safety": ["m17", "m18", "m66", "m68", "s17", "s67", "s68"],
  // --- Waves ---
  "wave-types": ["m19", "m20", "m72", "s18"],
  "wave-terms": ["m21", "m22", "m69", "s19", "s20"],
  "wave-equation": ["m23", "m83", "s21", "s71"],
  "wave-energy": ["m70", "m71", "s23", "s69", "s70"],
  "sound-pitch-loudness": ["m34", "m82", "s32"],
  "wave-vacuum": ["s22", "s83"],
  "em-spectrum": ["m24", "m75", "m76", "m84", "s33", "s82"],
  "light-intensity": ["m25", "s24"],
  refraction: ["m26", "m27", "m73", "m77", "s25", "s72", "s73", "s84"],
  "total-internal-reflection": ["m28", "m78", "s26", "s75", "s76"],
  diffraction: ["m29", "m79", "s27", "s74"],
  interference: ["m30", "m80", "s28", "s77", "s78"],
  "standing-waves": ["m31", "m81", "s29", "s79"],
  "doppler-redshift": ["m32", "m33", "m74", "s30", "s31", "s80", "s81"],
  // --- Electricity and magnetism ---
  "charging-friction": ["m35", "m85", "s34", "s85"],
  "conduction-induction": ["m86", "s35", "s86", "s90"],
  "field-lines": ["m36", "m37", "m87", "m88", "s36", "s87", "s88"],
  "coulombs-law": ["m38", "m89", "m90", "s37", "s89"],
  "uniform-field": ["m39", "m91", "s38", "s91"],
  "electric-potential": ["s39", "s92"],
  "current-flow": ["m40", "m92", "s40", "s41", "s93"],
  "resistance-factors": ["m41", "m93", "s42", "s94"],
  ohmic: ["m42", "m94", "s95"],
  "series-parallel": ["m43", "m44", "m95", "m96", "s43", "s96"],
  "parallel-resistance": ["m45", "m97", "s44", "s97"],
  meters: ["m46", "m98", "s45", "s98"],
  "magnetic-fields": ["m47", "m48", "m100", "s46", "s47", "s48", "s99"],
  electromagnets: ["m49", "m50", "m99", "s49", "s50", "s100"],
};

/** { questionId -> conceptId }. */
export const conceptOfQuestionId: Record<string, string> = {};
for (const [slug, numbers] of Object.entries(TAGS)) {
  for (const n of numbers) {
    const id = `${U}.${n}`;
    if (id in conceptOfQuestionId) throw new Error(`${id} is tagged twice (${slug})`);
    conceptOfQuestionId[id] = `${U}.c-${slug}`;
  }
}
