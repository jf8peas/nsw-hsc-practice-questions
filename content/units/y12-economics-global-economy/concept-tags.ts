// PUBLIC — which concept each question tests (spec 002). Keyed by concept slug; the values
// are question numbers within this unit ("m" = multiple choice, "s" = short answer). A
// question has exactly one concept, and a repeated or missing question fails `npm run
// validate`. This unit's ids are three digits, so entries look like "m001", never "m01".

import { defineTags } from "../../concept-helpers";
import { concepts } from "./concepts";

const U = "y12-economics-global-economy";

const TAGS: Record<string, string[]> = {
  "global-economy": ["m053", "m081", "m082", "m083", "s019", "s032", "s073"],
  "globalisation": ["m002", "m003", "m029", "m040", "m041", "m045", "m048", "s008", "s020", "s041", "s056"],
  "global-interdependence": ["m074", "m075", "m076", "m077", "s065", "s066", "s067"],
  "international-business-cycle": ["m069", "m086", "m087", "m088", "s009", "s017", "s025", "s064"],
  "free-trade": ["m023", "m035", "m051", "m072", "s013", "s016", "s039", "s061", "s062"],
  "international-organisations": ["m012", "m015", "m018", "m024", "m036", "m037", "m054", "m062", "m067", "s002", "s007", "s012", "s021", "s035", "s043", "s046"],
  "economic-forums": ["m004", "m078", "m079", "m080", "s068", "s069", "s070"],
  "trading-blocs": ["m008", "m014", "m022", "m026", "m031", "m033", "m044", "m063", "s001", "s057", "s058"],
  "protection": ["m005", "m006", "m007", "m009", "m010", "m011", "m013", "m016", "m020", "m021", "m025", "m030", "m039", "m043", "m047", "m050", "m052", "m056", "m058", "m059", "m061", "m064", "m065", "m070", "m073", "s005", "s006", "s015", "s026", "s027", "s028", "s029", "s030", "s040", "s042", "s044", "s045", "s048", "s063"],
  "growth-vs-development": ["m001", "m019", "m034", "m038", "m042", "m049", "m060", "s014", "s024", "s031", "s033", "s049", "s051", "s054"],
  "economy-classification": ["m017", "m027", "m032", "m055", "m057", "m066", "m068", "s023", "s036", "s038", "s047", "s052", "s055"],
  "income-wealth-distribution": ["m046", "m089", "m090", "m091", "s010", "s011", "s018"],
  "globalisation-effects": ["m028", "m071", "m092", "m093", "m094", "s003", "s004", "s022", "s050", "s053", "s059", "s060"],
  "development-strategies": ["m084", "m085", "m095", "m096", "s034", "s037", "s071", "s072"],
};

/** { questionId -> conceptId }. */
export const conceptOfQuestionId: Record<string, string> = defineTags(U, concepts, TAGS);
