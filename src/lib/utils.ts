import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getScoreColorClass(score: number): string {
  let className = "text-white hover:text-white border-transparent";

  if (score >= 85) {
    // Mørk grønn
    className += " bg-emerald-700 hover:bg-emerald-800";
  } else if (score >= 75) {
    // Lys grønn
    className += " bg-emerald-500 hover:bg-emerald-600";
  } else if (score >= 70) {
    // Gule
    className += " bg-yellow-500 hover:bg-yellow-600 text-black hover:text-black";
  } else {
    // Under (inkl 65% er rødt)
    className += " bg-red-600 hover:bg-red-700";
  }
  return className;
}
