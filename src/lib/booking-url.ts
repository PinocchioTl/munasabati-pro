// Canonical public domain for shared booking links.
// All share/QR/social links must use this, never window.location.origin
// (which would expose preview / lovable.app URLs).
export const PUBLIC_BOOKING_ORIGIN = "https://www.munasabatipro.online";

export function bookingUrl(slug: string): string {
  if (!slug) return "";
  return `${PUBLIC_BOOKING_ORIGIN}/munasabti-booking/${slug}`;
}
