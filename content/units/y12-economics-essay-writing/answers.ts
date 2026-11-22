import type { AnswerSet } from "@/lib/types";

// SERVER ONLY — the essays' keys (constitution Principle I): the marking notes, the school's own
// criteria (trial essays), the band 1 model essay and the concept tags (as keys of the concept list).
// Written by `npm run essay-build-answers` from the reviewed content in resources/topic011/content/;
// until an essay is approved and the marker check has passed it has no key and stays `live: false`.

export const answers: AnswerSet = {};
