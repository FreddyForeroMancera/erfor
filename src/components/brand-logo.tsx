import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant: "light" | "dark";
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ variant, className }: BrandLogoProps) {
  const src = variant === "light" ? "/brand/ERFOR_logo_blanco.png" : "/brand/ERFOR_logo_negro.png";
  return (
    <img
      src={src}
      alt="ERFOR"
      className={cn("block h-auto w-full object-contain", className)}
      draggable={false}
    />
  );
}
