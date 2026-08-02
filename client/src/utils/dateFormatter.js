/**
 * @param {string | number | Date | undefined} miliseconds
 * @param {Object} [opts]
 * @param {boolean} [opts.weekdayFormat=false]
 * @param {boolean} [opts.withTime=true]
 * @returns {string}
 */
export default function dateFormatter(
    miliseconds,
    opts = { weekdayFormat: false, withTime: true },
) {
    if (!miliseconds) return "";

    const date = new Date(miliseconds);

    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();

    if (opts.weekdayFormat && year === currentYear) {
        /** @type {Intl.DateTimeFormatOptions} */
        const options = {
            weekday: "short",
            month: "short",
            day: "2-digit",
        };

        const formattedDate = date.toLocaleDateString("en-US", options);

        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const time = hours + ":" + minutes;

        if (opts.withTime) {
            return `${formattedDate} ${time}`;
        }

        return `${formattedDate}`;
    }

    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const wday = date.getDay();

    const month = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const m = date.getMonth();

    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return opts.withTime
        ? `${weekday[wday]}, ${month[m]} ${day} ${year} ${hours}:${minutes}:${seconds}`
        : `${weekday[wday]}, ${month[m]} ${day} ${year}`;
}

/**
 * @param {string | number | Date | undefined} miliseconds
 * @param {Object} [opts]
 * @param {boolean} [opts.withTime=true]
 * @returns {string}
 */
export const formatDateToYYYYMMDD = (
    miliseconds,
    option = { withTime: false },
) => {
    if (!miliseconds) return "";

    const date = new Date(miliseconds);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    if (option.withTime) {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    return `${year}-${month}-${day}`;
};

/**
 * @param {string | null | undefined} dateValue  // "YYYY-MM-DD"
 * @returns {boolean}
 */
export const isPastDue = (dateValue) => {
    if (!dateValue) return false;

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const today = `${y}-${m}-${d}`;

    return dateValue <= today;
};

/**
 * Format a due date string to a short display string (e.g. "Mon, Apr 01").
 * @param {string | null | undefined} dateValue  // "YYYY-MM-DD"
 * @returns {string}
 */
export const formatDueDate = (dateValue) => {
    if (!dateValue) return "";

    const [year, month, day] = dateValue.split("-").map(Number);
    if (!year || !month || !day) return "";

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    const d = new Date(year, month - 1, day);
    const wday = weekdays[d.getDay()];
    const monthName = months[d.getMonth()];

    return `${wday}, ${monthName} ${String(day).padStart(2, "0")}`;
};

/**
 * Returns a relative label for a due date (e.g. "due today", "1 day overdue").
 * @param {string | null | undefined} dateValue  // "YYYY-MM-DD"
 * @returns {string}
 */
export const getRelativeDueLabel = (dateValue) => {
    if (!dateValue) return "";

    const [year, month, day] = dateValue.split("-").map(Number);
    if (!year || !month || !day) return "";

    const dueDay = Date.UTC(year, month - 1, day);
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((dueDay - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return Math.abs(diffDays) === 1
            ? "1 day overdue"
            : `${Math.abs(diffDays)} days overdue`;
    }

    if (diffDays === 0) {
        return "due today";
    }

    if (diffDays === 1) {
        return "due tomorrow";
    }

    return `due in ${diffDays} days`;
};
