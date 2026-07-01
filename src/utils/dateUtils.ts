// Utility functions for dates, expiry alerts, and formatting.

/**
 * Returns a formatted date string (YYYY-MM-DD) offset by a number of days from today.
 */
export function getDateWithOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * Calculates the difference in days between today and a target date.
 * Positive means future, negative means past.
 */
export function getDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats a date string (YYYY-MM-DD) to a human-readable format.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

/**
 * Returns document status and a color scheme based on days remaining.
 */
export interface DocumentStatus {
  label: "Expired" | "Due Soon" | "Valid";
  labelHindi: "समाप्त (Expired)" | "जल्द समाप्त (Due Soon)" | "वैध (Valid)";
  colorClass: string; // Tailwind bg/text color classes
  badgeClass: string;
  days: number;
}

export function getDocumentStatus(expiryDateStr: string, warningThresholdDays = 30): DocumentStatus {
  const days = getDaysRemaining(expiryDateStr);
  
  if (days < 0) {
    return {
      label: "Expired",
      labelHindi: "समाप्त (Expired)",
      colorClass: "text-red-600 bg-red-50 border-red-200",
      badgeClass: "bg-red-100 text-red-800 border-red-200",
      days
    };
  } else if (days <= warningThresholdDays) {
    return {
      label: "Due Soon",
      labelHindi: "जल्द समाप्त (Due Soon)",
      colorClass: "text-amber-600 bg-amber-50 border-amber-200",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      days
    };
  } else {
    return {
      label: "Valid",
      labelHindi: "वैध (Valid)",
      colorClass: "text-green-600 bg-green-50 border-green-200",
      badgeClass: "bg-green-100 text-green-800 border-green-200",
      days
    };
  }
}
