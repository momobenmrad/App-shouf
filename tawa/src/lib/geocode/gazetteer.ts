import type { LatLng } from "../geo";

/**
 * Built-in list of well-known Tunisian landmarks with the names people actually
 * use for them (derja, Arabic, French, Arabizi). Coordinates are approximate
 * (within a few hundred metres) and are refined through OpenStreetMap when it
 * answers; extend this list per city when the app launches somewhere new.
 */
export type Place = {
  id: string;
  name: string; // display name (French)
  nameAr: string;
  city: "Tunis" | "Sousse" | "Sfax" | "Monastir" | "Nabeul" | "Bizerte";
  pos: LatLng;
  /** Query sent to OpenStreetMap to refine the position. */
  osmQuery: string;
  aliases: string[];
};

export const PLACES: Place[] = [
  { id: "bourguiba", name: "Avenue Habib Bourguiba", nameAr: "شارع الحبيب بورقيبة", city: "Tunis", pos: { lat: 36.8003, lng: 10.1857 }, osmQuery: "Avenue Habib Bourguiba, Tunis",
    aliases: ["شارع الحبيب بورقيبة", "شارع بورقيبة", "الشارع الكبير", "avenue bourguiba", "av bourguiba", "bourguiba", "chare3 bourguiba", "lavenue"] },
  { id: "bab-bhar", name: "Bab Bhar (Porte de France)", nameAr: "باب البحر", city: "Tunis", pos: { lat: 36.7993, lng: 10.1801 }, osmQuery: "Bab Bhar, Tunis",
    aliases: ["باب البحر", "bab bhar", "bab el bhar", "porte de france"] },
  { id: "zitouna", name: "Mosquée Zitouna (Médina)", nameAr: "جامع الزيتونة", city: "Tunis", pos: { lat: 36.7976, lng: 10.1712 }, osmQuery: "Mosquée Zitouna, Tunis",
    aliases: ["جامع الزيتونة", "الزيتونة", "المدينة العربي", "zitouna", "jemaa zitouna", "medina tunis", "la medina"] },
  { id: "barcelone", name: "Gare de Tunis (Place Barcelone)", nameAr: "محطة برشلونة", city: "Tunis", pos: { lat: 36.7953, lng: 10.181 }, osmQuery: "Gare de Tunis, Place Barcelone",
    aliases: ["برشلونة", "محطة برشلونة", "الغار", "barcelone", "place barcelone", "gare de tunis", "lagare"] },
  { id: "tun-airport", name: "Aéroport Tunis-Carthage", nameAr: "مطار تونس قرطاج", city: "Tunis", pos: { lat: 36.851, lng: 10.2272 }, osmQuery: "Aéroport international de Tunis-Carthage",
    aliases: ["المطار", "مطار قرطاج", "مطار تونس قرطاج", "aeroport", "aeroport tunis carthage", "aeroport de tunis", "matar", "l aeroport"] },
  { id: "manar-monoprix", name: "Monoprix El Manar", nameAr: "مونوبري المنار", city: "Tunis", pos: { lat: 36.8389, lng: 10.1569 }, osmQuery: "Monoprix, El Manar, Tunis",
    aliases: ["مونوبري المنار", "مونوبري منار", "monoprix el manar", "monoprix manar", "monop manar"] },
  { id: "manar", name: "El Manar", nameAr: "المنار", city: "Tunis", pos: { lat: 36.835, lng: 10.155 }, osmQuery: "El Manar, Tunis",
    aliases: ["المنار", "منار", "el manar", "manar", "el menar"] },
  { id: "fst", name: "Faculté des sciences de Tunis (Campus El Manar)", nameAr: "كلية العلوم بتونس", city: "Tunis", pos: { lat: 36.8326, lng: 10.1453 }, osmQuery: "Faculté des Sciences de Tunis",
    aliases: ["كلية العلوم", "الكامبيس", "الفاك متاع العلوم", "fac des sciences", "faculte des sciences", "campus", "el campus", "fst"] },
  { id: "lac1", name: "Les Berges du Lac 1", nameAr: "البحيرة 1", city: "Tunis", pos: { lat: 36.833, lng: 10.233 }, osmQuery: "Les Berges du Lac, Tunis",
    aliases: ["البحيرة", "البحيره", "البحيرة 1", "lac 1", "le lac", "berges du lac", "lac"] },
  { id: "lac2", name: "Les Berges du Lac 2", nameAr: "البحيرة 2", city: "Tunis", pos: { lat: 36.846, lng: 10.272 }, osmQuery: "Lac 2, Tunis",
    aliases: ["البحيرة 2", "lac 2", "lac ii", "berges du lac 2"] },
  { id: "tunisia-mall", name: "Tunisia Mall", nameAr: "تونيزيا مول", city: "Tunis", pos: { lat: 36.8455, lng: 10.2788 }, osmQuery: "Tunisia Mall, Lac 2",
    aliases: ["تونيزيا مول", "tunisia mall", "tunisiamall"] },
  { id: "marsa", name: "La Marsa (centre)", nameAr: "المرسى", city: "Tunis", pos: { lat: 36.878, lng: 10.325 }, osmQuery: "La Marsa, Tunis",
    aliases: ["المرسى", "المرسي", "la marsa", "marsa", "el marsa"] },
  { id: "sidi-bou-said", name: "Sidi Bou Saïd", nameAr: "سيدي بوسعيد", city: "Tunis", pos: { lat: 36.87, lng: 10.341 }, osmQuery: "Sidi Bou Said",
    aliases: ["سيدي بوسعيد", "سيدي بو سعيد", "sidi bou said", "sidi bousaid", "sidi bou"] },
  { id: "carthage", name: "Carthage", nameAr: "قرطاج", city: "Tunis", pos: { lat: 36.853, lng: 10.323 }, osmQuery: "Carthage, Tunis",
    aliases: ["قرطاج", "carthage", "kartaj"] },
  { id: "ennasr", name: "Ennasr", nameAr: "النصر", city: "Tunis", pos: { lat: 36.859, lng: 10.165 }, osmQuery: "Ennasr, Ariana",
    aliases: ["النصر", "حي النصر", "ennasr", "nasr", "cite ennasr"] },
  { id: "ariana", name: "Ariana (centre)", nameAr: "أريانة", city: "Tunis", pos: { lat: 36.8625, lng: 10.1956 }, osmQuery: "Ariana",
    aliases: ["اريانة", "اريانه", "ariana", "aryana"] },
  { id: "menzah6", name: "El Menzah 6", nameAr: "المنزه 6", city: "Tunis", pos: { lat: 36.844, lng: 10.172 }, osmQuery: "El Menzah 6, Ariana",
    aliases: ["المنزه 6", "المنزه السادس", "menzah 6", "el menzah 6", "menzah six"] },
  { id: "bardo", name: "Musée du Bardo", nameAr: "متحف باردو", city: "Tunis", pos: { lat: 36.8095, lng: 10.134 }, osmQuery: "Musée national du Bardo",
    aliases: ["باردو", "متحف باردو", "bardo", "musee du bardo", "le bardo"] },
  { id: "charles-nicolle", name: "Hôpital Charles Nicolle", nameAr: "مستشفى شارل نيكول", city: "Tunis", pos: { lat: 36.803, lng: 10.161 }, osmQuery: "Hôpital Charles Nicolle, Tunis",
    aliases: ["شارل نيكول", "سبيطار شارل نيكول", "charles nicolle", "hopital charles nicolle"] },
  { id: "bab-saadoun", name: "Bab Saadoun", nameAr: "باب سعدون", city: "Tunis", pos: { lat: 36.807, lng: 10.165 }, osmQuery: "Bab Saadoun, Tunis",
    aliases: ["باب سعدون", "bab saadoun", "bab sadoun"] },
  { id: "cun", name: "Centre Urbain Nord", nameAr: "المركز العمراني الشمالي", city: "Tunis", pos: { lat: 36.843, lng: 10.196 }, osmQuery: "Centre Urbain Nord, Tunis",
    aliases: ["المركز العمراني الشمالي", "السنتر عمراني", "centre urbain nord", "cun", "centre urbain"] },
  { id: "rades-stadium", name: "Stade de Radès", nameAr: "ملعب رادس", city: "Tunis", pos: { lat: 36.747, lng: 10.273 }, osmQuery: "Stade olympique de Radès",
    aliases: ["ملعب رادس", "رادس", "stade de rades", "stade rades", "rades"] },
  { id: "sousse-medina", name: "Médina de Sousse", nameAr: "مدينة سوسة العتيقة", city: "Sousse", pos: { lat: 35.827, lng: 10.638 }, osmQuery: "Médina de Sousse",
    aliases: ["سوسة", "مدينة سوسة", "sousse", "medina sousse", "sousse medina"] },
  { id: "kantaoui", name: "Port El Kantaoui", nameAr: "القنطاوي", city: "Sousse", pos: { lat: 35.892, lng: 10.598 }, osmQuery: "Port El Kantaoui",
    aliases: ["القنطاوي", "مرسى القنطاوي", "kantaoui", "port el kantaoui", "el kantaoui"] },
  { id: "sahloul", name: "Hôpital Sahloul", nameAr: "مستشفى سهلول", city: "Sousse", pos: { lat: 35.837, lng: 10.59 }, osmQuery: "Hôpital Sahloul, Sousse",
    aliases: ["سهلول", "سبيطار سهلول", "sahloul", "hopital sahloul"] },
  { id: "sfax-medina", name: "Médina de Sfax (Bab Diwan)", nameAr: "باب الديوان صفاقس", city: "Sfax", pos: { lat: 34.733, lng: 10.763 }, osmQuery: "Bab Diwan, Sfax",
    aliases: ["صفاقس", "باب الديوان", "sfax", "bab diwan", "medina sfax"] },
  { id: "sfax-airport", name: "Aéroport Sfax-Thyna", nameAr: "مطار صفاقس", city: "Sfax", pos: { lat: 34.718, lng: 10.691 }, osmQuery: "Aéroport international de Sfax-Thyna",
    aliases: ["مطار صفاقس", "aeroport sfax", "aeroport de sfax"] },
  { id: "monastir-airport", name: "Aéroport Monastir Habib-Bourguiba", nameAr: "مطار المنستير", city: "Monastir", pos: { lat: 35.758, lng: 10.755 }, osmQuery: "Aéroport international Monastir Habib-Bourguiba",
    aliases: ["مطار المنستير", "aeroport monastir", "aeroport de monastir"] },
  { id: "nabeul", name: "Nabeul (centre)", nameAr: "نابل", city: "Nabeul", pos: { lat: 36.456, lng: 10.735 }, osmQuery: "Nabeul",
    aliases: ["نابل", "nabeul"] },
  { id: "hammamet", name: "Hammamet (centre)", nameAr: "الحمامات", city: "Nabeul", pos: { lat: 36.4, lng: 10.616 }, osmQuery: "Hammamet",
    aliases: ["الحمامات", "hammamet", "hamamet"] },
  { id: "bizerte", name: "Bizerte (Vieux port)", nameAr: "بنزرت", city: "Bizerte", pos: { lat: 37.274, lng: 9.873 }, osmQuery: "Vieux port de Bizerte",
    aliases: ["بنزرت", "bizerte", "binzart"] },
];
