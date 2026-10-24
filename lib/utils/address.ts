import { countryName } from "@/lib/config/countries";

// Display helpers for delivery addresses (saved ones and order snapshots). Snapshots taken before
// international shipping have no country: they're Indian.

type AddressLike = {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country?: string;
};

/** Street, area, "City, State PIN", and the country when it isn't India. */
export function addressLines(a: AddressLike): string[] {
  const region = [a.state, a.pincode].filter(Boolean).join(" ");
  return [
    a.line1,
    a.line2,
    [a.city, region].filter(Boolean).join(", "),
    a.country && a.country !== "IN" ? countryName(a.country) : null,
  ].filter((line): line is string => Boolean(line));
}

/** Indian numbers are stored without +91; numbers abroad already carry their country code. */
export function displayPhone(a: { phone: string; country?: string }): string {
  return !a.country || a.country === "IN" ? `+91 ${a.phone}` : a.phone;
}
