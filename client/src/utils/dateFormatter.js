export default function dateFormatter(
    miliseconds,
    option = { weekdayFormat: false, withTime: true },
) {
    if (!miliseconds) return "";

    const date = new Date(miliseconds);

    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();

    if (option.weekdayFormat && year === currentYear) {
        const options = {
            weekday: "short",
            month: "short",
            day: "2-digit",
        };

        const formattedDate = date.toLocaleDateString("en-US", options);

        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const time = hours + ":" + minutes;

        if (option.withTime) {
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

    return option.withTime
        ? `${weekday[wday]}, ${month[m]} ${day} ${year} ${hours}:${minutes}:${seconds}`
        : `${weekday[wday]}, ${month[m]} ${day} ${year}`;
}

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

export const dateToCompare = (miliseconds) => {
    if (!miliseconds) return "";

    const date = new Date(miliseconds);
    const today = new Date();

    return date.getTime() <= today.getTime();
};
