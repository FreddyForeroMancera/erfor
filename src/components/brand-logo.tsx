import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant: "light" | "dark";
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ variant, className }: BrandLogoProps) {
  const src = variant === "light" ? "/brand/agroambiental_logo_blanco.png" : "/brand/agroambiental_logo_negro.png";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={src}
        alt="Logo"
        className="block max-h-[42px] w-auto object-contain shrink-0"
        draggable={false}
      />
      <span className={cn(
        "font-bold tracking-tight text-[1.35rem] leading-none",
        variant === "light" ? "text-white" : "text-[#062c28]"
      )}>
        AgroAmbiental
      </span>
    </div>
  );
}
