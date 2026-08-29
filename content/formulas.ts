// The Year 11 formulae in scope for y11-formula-test — the single source of
// truth for each formula's plain text, its LaTeX (for KaTeX rendering) and its
// name. Questions and the unit page both reference these by key.
//
// Keys match the `TELLS` map in units/y11-formula-test/answers.ts.

export interface FormulaDef {
  /** Plain-text form, used as a fallback and for the LLM grader prompt. */
  text: string;
  /** LaTeX form, rendered with KaTeX. */
  tex: string;
  /** What the formula is. */
  name: string;
}

export const F = {
  // Motion, forces and gravity
  suvat_s: {
    text: "s = ut + ½at²",
    tex: "s = ut + \\tfrac{1}{2}at^{2}",
    name: "Displacement under uniform acceleration",
  },
  suvat_v2: {
    text: "v² = u² + 2as",
    tex: "v^{2} = u^{2} + 2as",
    name: "Velocity and displacement (uniform acceleration)",
  },
  suvat_v: {
    text: "v = u + at",
    tex: "v = u + at",
    name: "Velocity and time (uniform acceleration)",
  },
  fma: {
    text: "F_net = ma",
    tex: "\\vec{F}_{\\text{net}} = m\\vec{a}",
    name: "Newton's second law",
  },
  gpe: {
    text: "ΔU = mgΔh",
    tex: "\\Delta U = mg\\,\\Delta h",
    name: "Change in gravitational potential energy (near Earth)",
  },
  work: {
    text: "W = Fs cos θ",
    tex: "W = F_{\\parallel}s = Fs\\cos\\theta",
    name: "Work done by a force",
  },
  ke: {
    text: "K = ½mv²",
    tex: "K = \\tfrac{1}{2}mv^{2}",
    name: "Kinetic energy",
  },
  powerE: {
    text: "P = ΔE / Δt",
    tex: "P = \\dfrac{\\Delta E}{\\Delta t}",
    name: "Power as the rate of energy transfer",
  },
  powerFv: {
    text: "P = Fv cos θ",
    tex: "P = F_{\\parallel}v = Fv\\cos\\theta",
    name: "Power delivered by a force",
  },
  consKE: {
    text: "Σ½mv²(before) = Σ½mv²(after)",
    tex: "\\sum \\tfrac{1}{2}mv^{2}_{\\text{before}} = \\sum \\tfrac{1}{2}mv^{2}_{\\text{after}}",
    name: "Conservation of kinetic energy (elastic collisions)",
  },
  consP: {
    text: "Σmv(before) = Σmv(after)",
    tex: "\\sum m\\vec{v}_{\\text{before}} = \\sum m\\vec{v}_{\\text{after}}",
    name: "Conservation of momentum",
  },
  impulse: {
    text: "Δp = F_net Δt",
    tex: "\\Delta \\vec{p} = \\vec{F}_{\\text{net}}\\,\\Delta t",
    name: "Impulse and change in momentum",
  },
  ugrav: {
    text: "U = −GMm / r",
    tex: "U = -\\dfrac{GMm}{r}",
    name: "Gravitational potential energy (universal)",
  },
  // Waves and thermodynamics
  wave: { text: "v = fλ", tex: "v = f\\lambda", name: "The wave equation" },
  fT: { text: "f = 1 / T", tex: "f = \\dfrac{1}{T}", name: "Frequency and period" },
  refIndex: {
    text: "n = c / v",
    tex: "n = \\dfrac{c}{v}",
    name: "Refractive index from wave speed",
  },
  specHeat: {
    text: "Q = mcΔT",
    tex: "Q = mc\\,\\Delta T",
    name: "Specific heat capacity",
  },
  beats: {
    text: "f_beat = |f₂ − f₁|",
    tex: "f_{\\text{beat}} = \\lvert f_2 - f_1 \\rvert",
    name: "Beat frequency",
  },
  doppler: {
    text: "f ′ = f (v_wave + v_observer) / (v_wave − v_source)",
    tex: "f' = f\\,\\dfrac{v_{\\text{wave}} + v_{\\text{observer}}}{v_{\\text{wave}} - v_{\\text{source}}}",
    name: "The Doppler effect",
  },
  snell: {
    text: "n₁ sin θ₁ = n₂ sin θ₂",
    tex: "n_1\\sin\\theta_1 = n_2\\sin\\theta_2",
    name: "Snell's law of refraction",
  },
  critical: {
    text: "sin θ_c = n₂ / n₁",
    tex: "\\sin\\theta_c = \\dfrac{n_2}{n_1}",
    name: "Critical angle for total internal reflection",
  },
  invSquare: {
    text: "I₁r₁² = I₂r₂²",
    tex: "I_1 r_1^{2} = I_2 r_2^{2}",
    name: "Inverse-square law for intensity",
  },
  conduction: {
    text: "Q / t = kAΔT / d",
    tex: "\\dfrac{Q}{t} = \\dfrac{kA\\,\\Delta T}{d}",
    name: "Rate of heat conduction",
  },
  // Electricity and magnetism
  eField: {
    text: "E = V / d",
    tex: "E = \\dfrac{V}{d}",
    name: "Uniform electric field between parallel plates",
  },
  potDiff: {
    text: "V = ΔU / q",
    tex: "V = \\dfrac{\\Delta U}{q}",
    name: "Electric potential difference",
  },
  wqv: { text: "W = qV", tex: "W = qV", name: "Work to move a charge through a potential difference" },
  wqed: { text: "W = qEd", tex: "W = qEd", name: "Work on a charge in a uniform electric field" },
  bWire: {
    text: "B = μ₀I / 2πr",
    tex: "B = \\dfrac{\\mu_0 I}{2\\pi r}",
    name: "Magnetic field around a straight current-carrying wire",
  },
  fqe: { text: "F = qE", tex: "\\vec{F} = q\\vec{E}", name: "Force on a charge in an electric field" },
  coulomb: {
    text: "F = (1 / 4πε₀)(q₁q₂ / r²)",
    tex: "F = \\dfrac{1}{4\\pi\\varepsilon_0}\\dfrac{q_1 q_2}{r^{2}}",
    name: "Coulomb's law",
  },
  current: {
    text: "I = q / t",
    tex: "I = \\dfrac{q}{t}",
    name: "Current as the rate of flow of charge",
  },
  ohm: { text: "V = IR", tex: "V = IR", name: "Ohm's law" },
  pvi: { text: "P = VI", tex: "P = VI", name: "Electrical power" },
  fqvb: {
    text: "F = qvB sin θ",
    tex: "F = qv_{\\perp}B = qvB\\sin\\theta",
    name: "Force on a moving charge in a magnetic field",
  },
  flib: {
    text: "F = lIB sin θ",
    tex: "F = lI_{\\perp}B = lIB\\sin\\theta",
    name: "Force on a current-carrying conductor in a magnetic field",
  },
  parallelWires: {
    text: "F / l = (μ₀ / 2π)(I₁I₂ / r)",
    tex: "\\dfrac{F}{l} = \\dfrac{\\mu_0}{2\\pi}\\dfrac{I_1 I_2}{r}",
    name: "Force per unit length between parallel conductors",
  },
} satisfies Record<string, FormulaDef>;

export type FormulaKey = keyof typeof F;
