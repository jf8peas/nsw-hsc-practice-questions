# Y12 English Advanced unseen-text short answers: sources (Principle V)

Unit: `y12-english-advanced-unseen-texts` (spec 008). Syllabus: NSW English Advanced 11-12 (2024),
Year 12 Module A-style "Texts and Human Experiences" (Paper 1, Section I: short-answer questions on
unseen texts; 5 or 6 questions from the 2027 HSC). Syllabus outcomes tagged on questions: EAV-12-01,
EAV-12-02 and EAV-12-04. Sources:

- NESA Section I marking feedback, English Advanced Paper 1, for the
  [2022](https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/english-advanced/2022),
  [2023](https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/english-advanced/2023) and
  [2024](https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/english-advanced/2024)
  papers: the source of the seven tracked skills.
- [Year 12 Texts and human experiences content](https://curriculum.nsw.edu.au/learning-areas/english/english-advanced-11-12-2024/content/year-12/fa9fce92f8)
  and the [syllabus outcomes](https://curriculum.nsw.edu.au/learning-areas/english/english-advanced-11-12-2024/outcomes).

## The seven skills

| Skill | What a full-mark answer does | Syllabus link |
|---|---|---|
| Answers every part of the question | Covers each idea the question names | Responding: informed interpretations |
| Follows the directive verb | Explains, analyses or assesses as asked | Understanding: evaluative language for informed judgements |
| Analyses, doesn't retell | Interprets what the text means | Responding: close textual analysis |
| Explains a technique's effect | Names a technique and shows how it shapes meaning, with accurate metalanguage | EAV-12-01; Understanding: metalanguage |
| Uses apt evidence | Short, precise quotations or visual details that prove the point | Responding: close textual analysis |
| Links to the human experience | Ties the analysis to the experience or emotion in the question | Understanding: texts shape diverse human experiences |
| Writes succinctly | A sustained, coherent answer scaled to the marks | EAV-12-04 |

Comparison is not tracked: this unit has only single-text questions.

## Where the content comes from

Every question is copied word for word from a school trial paper, with its source shown (school, year,
paper type, question number), under the school-paper exception in constitution Principle V (2.15.0:
which also covers the stimulus text printed with the question and the school's marking guidelines and
sample answers). No real HSC question or text is used: each text carries an `hscChecked` date, the day
it was compared with the NESA HSC papers, and a question whose text reuses an HSC text is skipped.

The papers are the 37 school trial papers (15 schools, 2023 to 2026) in
`resources/y12_english_advanced_paper1_trial_exams/` (gitignored, not deployed). The full inventory,
extraction, OCR (Roseville 2026 is a scan) and review report are a separate content task; the starter
bank below is what ships with the feature.

### Starter bank

| Question | Paper | Form | Marks | Rubric and model answer |
|---|---|---|---|---|
| `fs25-q1` | Fort St 2025 Trial, Q1 | Poem ("Coconut", Paul Hostovsky) | 3 | school criteria and notes; school sample answer |
| `fs25-q2` | Fort St 2025 Trial, Q2 | Prose fiction | 4 | school criteria and notes; school sample answer |
| `fs25-q3` | Fort St 2025 Trial, Q3 | Non-fiction | 3 | school criteria and notes; school sample answer |
| `fs23-q4` | Fort St 2023 Trial, Q4 | Prose fiction | 4 | school feedback; school sample answer |
| `fs23-q1` | Fort St 2023 Trial, Q1 | Visual (image) | 3 | school feedback; school sample answer |

`hscChecked` was recorded on 19 Nov 2026 from knowledge of the 2019 to 2025 HSC papers and **should be
confirmed against the NESA papers before launch**.

## Visual texts and accessibility

A visual text is a cropped image from the paper, committed under
`content/units/y12-english-advanced-unseen-texts/images/` and served only to a signed-in student by
`/api/unseen/image/<text id>` (constitution Principle V exception). It must be removed or replaced
before the app goes commercial. The marker reads a written description, not the image; the description
is answer-key material and never reaches a browser. The image's `alt` is therefore a short neutral label,
not the description, so a screen-reader user is not given the analytic description. This is a known
limitation: visual-text questions are an accessibility cost of the school-paper format.
