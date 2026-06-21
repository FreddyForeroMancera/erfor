import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant: "light" | "dark";
  className?: string;
  priority?: boolean;
  size?: "normal" | "large" | "xl";
};

export function BrandLogo({ variant, className, size = "normal" }: BrandLogoProps) {
  const src = variant === "light" ? "/brand/agroambiental_logo_blanco.png" : "/brand/agroambiental_logo_negro.png";
  
  const imgSizeClass = {
    normal: "max-h-[42px]",
    large: "max-h-[60px]",
    xl: "max-h-[120px]"
  }[size];

  const textSizeClass = {
    normal: "text-[1.35rem]",
    large: "text-[1.75rem]",
    xl: "text-[3.5rem]"
  }[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={src}
        alt="Logo"
        className={cn("block w-auto object-contain shrink-0", imgSizeClass)}
        draggable={false}
      />
      <span className={cn(
        "font-bold tracking-tight leading-none",
        textSizeClass,
        variant === "light" ? "text-white" : "text-[#062c28]"
      )}>
        AgroAmbiental
      </span>
    </div>
  );
}
