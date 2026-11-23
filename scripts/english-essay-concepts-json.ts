// Prints the English essay unit's concept list (key -> prompt line) as JSON on stdout, in record order. The Python
// pilot (scripts/pilot-english-essay-marker.py) runs this instead of keeping a second hand-maintained list, so the
// app and the pilot cannot drift (spec 011 T005, data-model §1.4). Usage: npx tsx scripts/english-essay-concepts-json.ts

import { englishConceptLines } from "../content/units/y12-english-essay-writing/concepts";

process.stdout.write(JSON.stringify(englishConceptLines(), null, 2) + "\n");
