# Review: Circular Motion MC (m145–m180)

## Part 1 — Working Table

| id | my result | key says | agree? |
| --- | --- | --- | --- |
| m145 | D is incorrect (centripetal force ⊥ displacement, W = 0) | D | yes |
| m146 | m = F_T cos θ / g (vertical equilibrium) | A | yes |
| m147 | tan θ = v²/(rg), so θ = tan⁻¹(v²/rg) | A | yes |
| m148 | v = √(gr) = √(9.8 × 256.5) ≈ 50.1 m s⁻¹ | A (50 m s⁻¹) | yes |
| m149 | ω = 2πf, independent of radius | D (not change) | yes |
| m150 | Force toward centre, velocity tangent | D | yes |
| m151 | Normal force ⊥ surface | A | yes |
| m152 | τ = rF sin θ: max when θ = 90°, r max | D | yes |
| m153 | v = √(rg tan θ): banking angle, radius, g | B | yes |
| m154 | Friction up, weight down, normal toward centre | A | yes |
| m155 | N's horizontal component provides centripetal force | C | yes |
| m156 | τ = rF sin θ, r = 5.0 m, θ = 51° | D | yes |
| m157 | F = mω²r, double ω → 4× force | A (4F) | yes |
| m158 | At leftmost point: v down (tangent), a right (centre) | C | yes |
| m159 | 150×49 + 100×30 = m₃×39 → m₃ = 10350/39 ≈ 265 g | C | yes |
| m160 | M = (4π²rm/g)(1/T²), gradient = 4π²rm/g → m ≈ 0.0725 kg | B | yes |
| m161 | ω same for rigid body, v = ωr increases outward | B | yes |
| m162 | Increase θ gives more N_h, increase μ gives more friction | B | yes |
| m163 | τ_A = 1.3×2.9×sin75° ≈ 3.65; τ_B = 0.6×5.3 ≈ 3.18; τ_C = 2.0×3.4×sin30° = 3.4; τ_D = 1.0×4.2×sin45° ≈ 2.97 | A | yes |
| m164 | τ = 0.500×70.0×sin70° ≈ 32.89 N m | B | yes |
| m165 | v = 2π×0.25/2 ≈ 0.785 m s⁻¹, KE ≈ 0.25 J; W = 0 (force ⊥ displacement) | D | yes |
| m166 | Net force = mv²/r toward centre | B | yes |
| m167 | N sin θ points to centre (horizontal component) | A | yes |
| m168 | Friction provides centripetal force on flat road | B | yes |
| m169 | F = 2KE/r; double KE, halve r → 4× F | D (4F) | yes |
| m170 | At top: mg = mv²/r; energy: mgh = mg(2r) + ½mv² → h = 2.5r | B | yes |
| m171 | T = mv²/r − mg = 0.20×8.2²/0.90 − 0.20×9.8 ≈ 14.94 − 1.96 ≈ 13.0 N | B | yes |
| m172 | tan θ = v²/(rg) = 121/(25×9.8) ≈ 0.494 → θ ≈ 26.3° | C | yes |
| m173 | v = √(63×9.8×tan12°) ≈ 11.45 m s⁻¹ ≈ 41.2 km h⁻¹ | D | yes |
| m174 | Vary speed, measure radius, control stopper mass & string length | D | yes |
| m175 | F = mv²/r constant → r ∝ v²; double v → 4× r = 800 m | D | yes |
| m176 | F = mv²/r → F ∝ v² (parabola through origin) | A | yes |
| m177 | At bottom: N − mg = mv²/r (net upward = centripetal) | C (sum equals centripetal) | yes |
| m178 | r = 1.10 cos30° ≈ 0.953 m; ω = 240 rpm = 8π rad/s; F = 0.020×(8π)²×0.953 ≈ 3.0 N | C | yes |
| m179 | a = 4π²×5.0/4.0² ≈ 12.3 m s⁻² | C | yes |
| m180 | μmg = mv²/r constant → v² ∝ 1/m; v_B = v√(1/1.5) ≈ 0.816v | Wait — recalculate | **no** |

---

## Part 2 — Findings

| id | severity | what is wrong | correct version |
| --- | --- | --- | --- |
| m180 | CRITICAL | The keyed answer C (1.2v) is incorrect. For the same curve radius r and same coefficient of friction μ, the maximum centripetal force is μmg. So μmg = mv²/r, which gives v² = μgr. The mass cancels out — the maximum speed is **independent of mass**. Both cars can take the curve at the **same speed v**. | The correct answer is **B: v** (same speed). The explanation "m v² constant" is wrong — it's v² = μgr, which doesn't depend on mass. |

---

## Verification of m180

**Question:** Car A of mass m can take a curve of radius r at a maximum speed v before skidding. Car B of mass 1.5m can take the same curve at a maximum speed of:

**My working:**
- Maximum centripetal force before skidding: F_max = μN = μmg (where μ is the coefficient of friction)
- Centripetal force required: F_c = mv²/r
- At maximum speed: μmg = mv²/r
- Solving: v² = μgr
- **The mass m cancels out** — the maximum speed depends only on μ, g, and r
- Since both cars use the same curve (same r) and presumably the same tyres on the same road (same μ), the maximum speed is **the same**: v_B = v

**Keyed answer says:** C (1.2v), with explanation "The same maximum force F = mv²/r on the same curve gives m v² constant: v_B = v√(m_A/m_B) = v√1.5 ≈ 1.2v"

**Why the key is wrong:** The key assumes "the same maximum force" for both cars, but the maximum friction force is **not** the same — it's proportional to mass (F_max = μmg). Car B has 1.5× the mass, so it has 1.5× the maximum friction force available, which exactly compensates for its 1.5× greater inertia. The result is that both cars can corner at the same maximum speed.

This is a well-known result in physics: on a flat road, the maximum cornering speed is independent of the vehicle's mass.

---

CHECKED: 36 questions, 1 critical, 0 major, 0 minor.
