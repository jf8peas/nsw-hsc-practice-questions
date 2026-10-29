// PUBLIC — which concept each question tests (spec 002). Keyed by concept slug; the values are
// question numbers within this unit ("m" = multiple choice, "s" = short answer). A question has
// exactly one concept, and a repeated or missing question fails `npm run validate`. This unit's
// ids are three digits, so entries look like "m001", never "m01".

import { defineTags } from "../../concept-helpers";
import { concepts } from "./concepts";

const U = "y12-physics-advanced-mechanics";

const TAGS: Record<string, string[]> = {
  // --- Motion in gravitational fields ---
  "newtons-law-gravitation": ["m012", "m054", "m055", "m071", "m075", "m078", "m082", "m087", "s027", "s032", "s052", "s053", "s063", "s066", "s076", "s082"],
  "gravitational-field-strength": ["m005", "m018", "m027", "m029", "m036", "m042", "m045", "m052", "m061", "m063", "m065", "m073", "s001", "s007", "s021", "s028", "s029", "s036", "s049", "s050", "s060", "s068"],
  "keplers-laws": ["m015", "m026", "m033", "m034", "m069", "m086", "s008", "s016", "s025", "s041", "s045", "s081", "s083"],
  "keplers-third-law": ["m001", "m003", "m006", "m014", "m016", "m030", "m038", "m040", "m044", "m058", "m076", "m079", "m084", "m088", "m090", "s003", "s006", "s010", "s011", "s012", "s035", "s040", "s042", "s056", "s058", "s067", "s070", "s072", "s075", "s090"],
  "orbital-velocity": ["m017", "m020", "m041", "m047", "m056", "m068", "m074", "m080", "s005", "s017", "s019", "s020", "s038", "s078", "s084", "s089"],
  "orbital-energy": ["m002", "m004", "m010", "m019", "m021", "m024", "m028", "m031", "m035", "m046", "m048", "m051", "m053", "m057", "m059", "m072", "m083", "s009", "s015", "s026", "s037", "s043", "s044", "s047", "s048", "s051", "s061", "s062", "s064", "s065", "s069", "s074", "s085", "s086", "s087", "s088"],
  "escape-velocity": ["m011", "m022", "m025", "m037", "m050", "m062", "m067", "m077", "m085", "s004", "s013", "s022", "s046", "s055", "s057", "s059", "s071", "s073", "s080"],
  "geostationary-orbit": ["m007", "m013", "s018", "s023", "s030", "s031", "s034", "s077"],
  "work-by-gravity": ["m023", "m049", "m070", "m081"],
  "weightlessness": ["m009", "s014"],
  "orbit-comparison": ["m039", "m043", "m064", "m066", "m089", "s002", "s033", "s039", "s079"],
  // --- Projectile motion ---
  "projectile-independence": ["m091", "m101", "m107", "s132"],
  "projectile-horizontal-velocity": ["m095", "m114", "m126", "m135", "m139", "m143", "s092", "s105"],
  "projectile-vertical-motion": ["m096", "m100", "m102", "m110", "m113", "m115", "m116", "m124", "m127", "m129", "m130", "m132", "m133", "m134", "m141", "s097", "s106", "s107", "s109", "s113", "s116", "s118", "s122", "s130", "s131", "s134", "s138", "s142", "s144"],
  "projectile-range-height": ["m092", "m097", "m098", "m099", "m103", "m117", "m121", "s024", "s101", "s102", "s104", "s108", "s117", "s119", "s121", "s124", "s125", "s140", "s143"],
  "projectile-components": ["m093", "m104", "m106", "m109", "m111", "m112", "m118", "m128", "m131", "m136", "m144", "s091", "s093", "s094", "s095", "s096", "s098", "s100", "s110", "s112", "s114", "s115", "s120", "s128", "s129", "s135", "s137", "s141"],
  "projectile-graphs": ["m138", "m142", "s099", "s111", "s139"],
  "projectile-energy": ["m094", "m105", "m108", "m119", "m123", "s103", "s123", "s126", "s127", "s133"],
  "air-resistance": ["m122", "m125"],
  "projectile-assumptions": ["m120", "m137"],
  "projectile-investigation": ["m140", "s136"],
  // --- Circular motion ---
  "centripetal-force": ["m008", "m060", "m150", "m157", "m166", "m169", "m175", "m177", "m178", "m180", "s054", "s165", "s167"],
  "centripetal-acceleration": ["m032", "m148", "m158", "m179"],
  "angular-velocity": ["m149", "m161", "s156", "s177"],
  "banked-tracks": ["m151", "m153", "m155", "m162", "m167", "m172", "m173", "s146", "s147", "s148", "s149", "s150", "s151", "s153", "s155", "s159", "s161", "s173", "s178"],
  "conical-pendulum": ["m146", "m147", "s152", "s157", "s162", "s164", "s171", "s180"],
  "vertical-circles": ["m170", "m171", "s145", "s160", "s166", "s169", "s175"],
  "torque": ["m152", "m156", "m159", "m163", "m164", "s158", "s172", "s179"],
  "circular-work": ["m145", "m165", "s174"],
  "friction-centripetal": ["m154", "m168", "s168", "s170", "s176"],
  "circular-investigation": ["m160", "m174", "m176", "s154", "s163"],
};

/** { questionId -> conceptId }. */
export const conceptOfQuestionId: Record<string, string> = defineTags(U, concepts, TAGS);