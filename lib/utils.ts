import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge";
import pdfi from "@/public/images/files/pdf.png";
import htmli from "@/public/images/files/html.png";
import zipi from "@/public/images/files/zip.png";
import figmai from "@/public/images/files/figma.png";
import aii from "@/public/images/files/ai.png";
import file from "@/public/images/files/file.png"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Translations {
  [key: string]: string;
}

export const translate = (title: string, trans: Translations): string => {
  const lowercaseTitle = title.toLowerCase();

  if (trans?.hasOwnProperty(lowercaseTitle)) {
    return trans[lowercaseTitle];
  }

  return title;
};

export function getDynamicPath(pathname: any): any {
  const prefixes = ["en"];

  for (const prefix of prefixes) {
    if (pathname.startsWith(`/${prefix}/`)) {
      return `/${pathname.slice(prefix.length + 2)}`;
    }
  }

  return pathname;
}

export const isLocationMatch = (
  targetLocation: any,
  locationName: any
): boolean => {
  return (
    locationName === targetLocation ||
    locationName.startsWith(`${targetLocation}/`)
  );
};

export const formatDate = (date: Date) => {
  const validDate = new Date(date);
  const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }; // Formats date as '07 Aug 2024'
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true }; // Formats time as '8:15 AM'
  return `${validDate.toLocaleDateString('en-US', dateOptions)} ${validDate.toLocaleTimeString('en-US', timeOptions)}`;
}

export const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getImageSource(ext: string) {
  switch (ext) {
    case "pdf":
      return pdfi;
    case "html":
      return htmli;
    case "ai":
      return aii;
    case "fig":
      return figmai;
    case "zip":
      return zipi;
    default:
      return file;
  }
}