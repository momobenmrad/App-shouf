import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/**
 * Turns a free-text Tunisian address ("حذا مونوبري المنار", "9odem el jemaa
 * lkbir fi Sousse", "derrière la poste de l'Ariana") into a structured query
 * that OpenStreetMap understands. Only used when ANTHROPIC_API_KEY is set and
 * the built-in gazetteer did not recognise the place.
 */
export const ParsedAddress = z.object({
  landmark: z.string().describe("Lieu ou commerce de référence, en français, tel qu'il s'écrirait sur OpenStreetMap (ex. « Monoprix », « Mosquée Okba »). Vide s'il n'y en a pas."),
  street: z.string().describe("Rue ou avenue en français si mentionnée, sinon vide."),
  neighborhood: z.string().describe("Quartier ou délégation en français (ex. « El Manar », « Ennasr »), sinon vide."),
  city: z.string().describe("Ville en français (ex. « Tunis », « Sousse », « Sfax »). Déduire « Tunis » pour les quartiers du Grand Tunis."),
  relation: z.enum(["near", "front", "behind", "at"]).describe("Position par rapport au repère : حذا/près de = near, قدام/devant = front, ورا/derrière = behind, sinon at."),
  search_query: z.string().describe("Requête complète prête pour OpenStreetMap, du plus précis au plus général, séparée par des virgules, en français."),
  understood_fr: z.string().describe("Reformulation courte en français de ce que l'utilisateur a voulu dire."),
});
export type ParsedAddress = z.infer<typeof ParsedAddress>;

const SYSTEM = `Tu aides une application de taxi en Tunisie à comprendre les adresses tapées par les clients.
Les clients écrivent en derja tunisienne (arabe ou arabizi : 7 = ح, 9 = ق, 3 = ع, 5 = خ, 8 = غ), en français, ou en mélangeant les deux. Ils décrivent souvent un repère plutôt qu'une adresse (« حذا الجامع الكبير », « 9odem el poste », « près de la pharmacie de nuit »).
Extrais le repère, le quartier et la ville, et écris une requête de recherche OpenStreetMap en français. N'invente pas de lieu qui n'est pas suggéré par le texte.`;

let client: Anthropic | null = null;
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function parseAddress(text: string, cityHint?: string): Promise<ParsedAddress | null> {
  if (!aiEnabled()) return null;
  client ??= new Anthropic();
  try {
    const response = await client.beta.messages.parse(
      {
        model: "claude-opus-5-5",
        max_tokens: 2000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low", format: betaZodOutputFormat(ParsedAddress) },
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: cityHint ? `Ville actuelle du client : ${cityHint}\nAdresse : ${text}` : `Adresse : ${text}`,
          },
        ],
      },
      { timeout: 15_000 },
    );
    if (response.stop_reason === "refusal") return null;
    return response.parsed_output ?? null;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) console.error("ANTHROPIC_API_KEY invalide");
    else if (err instanceof Anthropic.RateLimitError) console.warn("Claude: limite de débit atteinte");
    else if (err instanceof Anthropic.APIError) console.warn(`Claude: erreur ${err.status}`);
    else console.warn("Claude indisponible:", (err as Error).message);
    return null;
  }
}
