/**
 * Utility Functions for Messenger CRM
 * 
 * This file contains common utility functions used throughout the application.
 * These utilities help with styling, data manipulation, and common operations.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Class Name Utility Function
 * 
 * Combines and merges CSS class names using clsx and tailwind-merge.
 * This function is essential for conditional styling and avoiding
 * Tailwind CSS class conflicts.
 * 
 * @param inputs - Variable number of class value inputs (strings, objects, arrays)
 * @returns Optimized string of CSS classes with Tailwind conflicts resolved
 * 
 * @example
 * // Basic usage
 * cn('bg-blue-500', 'text-white') // Returns: 'bg-blue-500 text-white'
 * 
 * // Conditional classes
 * cn('px-4 py-2', isActive && 'bg-blue-500', isDisabled && 'opacity-50')
 * 
 * // Tailwind conflict resolution
 * cn('bg-red-500', 'bg-blue-500') // Returns: 'bg-blue-500' (last one wins)
 * 
 * // Object syntax
 * cn({
 *   'bg-blue-500': isActive,
 *   'bg-gray-300': !isActive,
 *   'text-white': true
 * })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
