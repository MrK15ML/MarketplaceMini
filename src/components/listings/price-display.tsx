type PriceDisplayProps = {
  pricingType: string;
  priceFixed?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  currency?: string;
};

export function PriceDisplay({
  pricingType,
  priceFixed,
  priceMin,
  priceMax,
  currency = "NZD",
}: PriceDisplayProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(n);

  switch (pricingType) {
    case "fixed":
      return <span className="font-semibold">{priceFixed ? fmt(priceFixed) : "Price TBD"}</span>;
    case "range":
      return (
        <span className="font-semibold">
          {priceMin && priceMax ? `${fmt(priceMin)} – ${fmt(priceMax)}` : "Price TBD"}
        </span>
      );
    case "hourly":
      return (
        <span className="font-semibold">
          {priceFixed ? `${fmt(priceFixed)}/hr` : "Rate TBD"}
        </span>
      );
    default:
      return <span className="font-semibold">Price TBD</span>;
  }
}
