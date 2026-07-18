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
 * @param {string | number | Date | undefined} miliseconds
 */
export const dateToCompare = (miliseconds) => {
    if (!miliseconds) return "";

    const date = new Date(miliseconds);
    const today = new Date();

    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return date.getTime() <= today.getTime();
};
