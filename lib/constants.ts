export const BUSINESS_NAME = "Wear Chimsol";
export const WHATSAPP_NUMBER = "263775178065"; // 0775178065 international format
export const ECOCASH_NUMBER = "0775178065";

export const ADDRESS = {
  line1: "No.9 Eston Road",
  line2: "Mabelreign Shopping Centre",
  city: "Harare",
  country: "Zimbabwe",
};

export const FULL_ADDRESS = `${ADDRESS.line1}, ${ADDRESS.line2}, ${ADDRESS.city}, ${ADDRESS.country}`;

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
