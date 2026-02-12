export { CATEGORIES, getCategoryConfig, type CategoryConfig } from "./categories";

export const PRICING_TYPES = [
  { value: "fixed", label: "Fixed Price" },
  { value: "range", label: "Price Range" },
  { value: "hourly", label: "Hourly Rate" },
] as const;

export const JOB_REQUEST_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "clarifying", label: "Clarifying", color: "bg-blue-100 text-blue-800" },
  { value: "offered", label: "Offer Sent", color: "bg-purple-100 text-purple-800" },
  { value: "accepted", label: "Accepted", color: "bg-green-100 text-green-800" },
  { value: "in_progress", label: "In Progress", color: "bg-indigo-100 text-indigo-800" },
  { value: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-800" },
  { value: "reviewed", label: "Reviewed", color: "bg-teal-100 text-teal-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-800" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-800" },
] as const;

export function getStatusConfig(status: string) {
  return JOB_REQUEST_STATUSES.find((s) => s.value === status);
}

export const LICENSED_TRADE_TYPES = [
  "Electrical",
  "Plumbing",
  "Gas Fitting",
  "Roofing",
  "Building",
  "Drain Laying",
] as const;

export const NZ_CITIES = [
  "Wellington",
  "Auckland",
  "Christchurch",
  "Hamilton",
  "Tauranga",
  "Dunedin",
  "Palmerston North",
  "Napier",
  "Nelson",
  "Rotorua",
  "New Plymouth",
  "Whangarei",
  "Invercargill",
  "Queenstown",
] as const;

export const BANNED_SERVICES = [
  "Anything illegal under New Zealand law",
  "Adult / sexual services",
  "Weapons or firearms services",
  "Drug-related services",
  "Gambling services",
  "Services requiring professional medical licensing (surgery, prescriptions)",
] as const;

export const DEFAULT_CURRENCY = "NZD";

export const OFFER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "accepted", label: "Accepted", color: "bg-green-100 text-green-800" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-800" },
  { value: "expired", label: "Expired", color: "bg-gray-100 text-gray-800" },
  { value: "superseded", label: "Superseded", color: "bg-orange-100 text-orange-800" },
] as const;

export function getOfferStatusConfig(status: string) {
  return OFFER_STATUSES.find((s) => s.value === status);
}

export const DEAL_STATUSES = [
  { value: "active", label: "Active", color: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "disputed", label: "Disputed", color: "bg-red-100 text-red-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-800" },
] as const;

export const REPORT_REASONS = [
  "Fraud or scam",
  "Harassment or abuse",
  "Impersonation",
  "Inappropriate content",
  "Spam",
  "Contact info sharing",
  "Other",
] as const;

export const LISTING_SORT_OPTIONS = [
  { value: "best_match", label: "Best Match" },
  { value: "top_rated", label: "Top Rated" },
  { value: "most_reviews", label: "Most Reviews" },
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
] as const;

export const QUALIFICATION_TYPES = [
  { value: "license", label: "License" },
  { value: "certificate", label: "Certificate" },
  { value: "portfolio", label: "Portfolio Item" },
  { value: "testimonial", label: "Testimonial" },
] as const;
