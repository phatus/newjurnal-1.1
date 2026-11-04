export function parseActivityMonth(dateString: string): number | null {
    if (!dateString) return null;

    // Prefer explicit YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS parsing to avoid timezone offset shifts
    const datePart = String(dateString).split('T')[0];
    const parts = datePart.split('-');
    if (parts.length >= 2) {
        const mo = parseInt(parts[1], 10);
        if (!isNaN(mo) && mo >= 1 && mo <= 12) return mo - 1;
    }

    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
        return parsed.getMonth();
    }

    return null;
}

export function calculateMonthlyCounts(activities: { activity_date: string }[]): number[] {
    const counts = Array(12).fill(0);
    for (const act of activities) {
        const monthIndex = parseActivityMonth(act.activity_date);
        if (monthIndex !== null && monthIndex >= 0 && monthIndex <= 11) {
            counts[monthIndex] += 1;
        }
    }
    return counts;
}
