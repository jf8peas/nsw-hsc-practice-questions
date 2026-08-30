import type { UnitMeta } from "@/lib/types";
import { F, type FormulaDef } from "@/content/formulas";

const list = (defs: FormulaDef[]) =>
  defs.map((d) => ({ formula: d.text, formulaTex: d.tex, name: d.name }));

export const meta: UnitMeta = {
  id: "y11-formula-test",
  year: "Year 11",
  topic: "Foundations",
  type: "Milestone Test",
  title: "Physics Formula Test",
  description:
    "Every question is built from the Year 11 formulae sheet. Short-answer questions ask you to say what a formula tells you and to name a variable and its SI unit. Multiple-choice questions give you a formula and four scenarios — you pick the one it could answer. Each attempt draws 5 short-answer and 5 multiple-choice questions at random.",
  order: 1,
  quiz: { short: 5, mc: 5, passMark: 70 },
  formulas: list([
    // Motion, forces and gravity
    F.suvat_s, F.suvat_v2, F.suvat_v, F.fma, F.gpe, F.work, F.ke, F.powerE,
    F.powerFv, F.consKE, F.consP, F.impulse, F.ugrav,
    // Waves and thermodynamics
    F.wave, F.fT, F.refIndex, F.specHeat, F.beats, F.doppler, F.snell,
    F.critical, F.invSquare, F.conduction,
    // Electricity and magnetism
    F.eField, F.potDiff, F.wqv, F.wqed, F.bWire, F.fqe, F.coulomb, F.current,
    F.ohm, F.pvi, F.fqvb, F.flib, F.parallelWires,
  ]),
};
