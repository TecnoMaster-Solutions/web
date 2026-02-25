
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * Combines clsx for conditional classes and tailwind-merge for conflicting classes
 * @param inputs - Array of class values (strings, objects, arrays, etc.)
 * @returns Merged and optimized class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}