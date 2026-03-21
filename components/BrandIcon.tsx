import Image from "next/image";

interface BrandIconProps {
  size: number;
  className?: string;
  alt?: string;
}

export function BrandIcon({
  size,
  className,
  alt = "Castaway icon",
}: BrandIconProps) {
  return (
    <Image
      src="/castaway-icon.png"
      alt={alt}
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
