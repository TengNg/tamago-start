import { useState, useRef, useContext, useMemo, useCallback } from "react";
import useClickOutside from "../../../hooks/useClickOutside";
import { useKeybind } from "../../../hooks/useKeybind";
import ModalStackContext from "../../../context/ModalStackContext";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

/**
 * @param {number} year
 * @param {number} month
 * @returns {number}
 */
function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * @param {{ day: number; month: number; year: number }} d
 * @returns {string}
 */
function formatDisplayDate(d) {
    return `${MONTHS[d.month]} ${d.day}, ${d.year}`;
}

/**
 * @param {{ day: number; month: number; year: number }} d
 * @returns {string}
 */
function toYYYYMMDD(d) {
    return `${d.year}-${String(d.month + 1).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

/**
 * @param {string | null | undefined} value  // "YYYY-MM-DD"
 * @returns {{ day: number; month: number; year: number } | null}
 */
function parseDateValue(value) {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return { year, month: month - 1, day };
}

/**
 * @param {{ day: number; month: number; year: number } | null} a
 * @param {{ day: number; month: number; year: number } | null} b
 * @returns {boolean}
 */
function sameDate(a, b) {
    if (!a || !b) return a === b;
    return a.year === b.year && a.month === b.month && a.day === b.day;
}

/**
 * @param {Object} props
 * @param {string | null | undefined} props.value
 * @param {(value: string | null) => void} props.onChange
 * @param {boolean} [props.isPastDue]
 * @param {boolean} [props.isLoading]
 */
export default function DatePicker({ value, onChange, isPastDue, isLoading }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const { isAnyModalOpen } = useContext(ModalStackContext);

    const selectedDate = useMemo(() => parseDateValue(value), [value]);

    const [pendingDate, setPendingDate] = useState(selectedDate);

    const todayObj = useMemo(() => {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    }, []);

    const [viewYear, setViewYear] = useState(
        selectedDate?.year ?? todayObj.year,
    );

    const [viewMonth, setViewMonth] = useState(
        selectedDate?.month ?? todayObj.month,
    );

    const commit = useCallback(
        /**
         * @param {{ day: number; month: number; year: number } | null} next
         */
        (next) => {
            setOpen(false);
            if (!sameDate(next, selectedDate)) {
                onChange(next ? toYYYYMMDD(next) : null);
            }
        },
        [selectedDate, onChange],
    );

    const commitPending = useCallback(() => {
        commit(pendingDate);
    }, [commit, pendingDate]);

    const handleDismiss = useCallback(() => {
        if (open && !isAnyModalOpen) {
            commitPending();
        }
    }, [open, isAnyModalOpen, commitPending]);

    useKeybind("esc", handleDismiss);

    useClickOutside(containerRef, handleDismiss);

    const handleToggleOpen = useCallback(() => {
        if (open) {
            commitPending();
            return;
        }

        setPendingDate(selectedDate);
        setViewYear(selectedDate?.year ?? todayObj.year);
        setViewMonth(selectedDate?.month ?? todayObj.month);
        setOpen(true);
    }, [open, selectedDate, todayObj, commitPending]);

    const handleSelectDay = useCallback(
        /**
         * @param {number} day
         */
        (day) => {
            const next = { year: viewYear, month: viewMonth, day };
            if (pendingDate && sameDate(pendingDate, next)) {
                setPendingDate(null);
            } else {
                setPendingDate(next);
            }
        },
        [pendingDate, viewYear, viewMonth],
    );

    const handleRemove = useCallback(() => {
        setPendingDate(null);
        commit(null);
    }, [commit]);

    const goPrevMonth = useCallback(() => {
        if (viewMonth === 0) {
            setViewYear(viewYear - 1);
            setViewMonth(11);
        } else {
            setViewMonth(viewMonth - 1);
        }
    }, [viewYear, viewMonth]);

    const goNextMonth = useCallback(() => {
        if (viewMonth === 11) {
            setViewYear(viewYear + 1);
            setViewMonth(0);
        } else {
            setViewMonth(viewMonth + 1);
        }
    }, [viewYear, viewMonth]);

    const isPastDay = useCallback(
        /**
         * @param {number} day
         */
        (day) => {
            const compare = new Date(viewYear, viewMonth, day);
            const today = new Date(todayObj.year, todayObj.month, todayObj.day);
            return compare < today;
        },
        [viewYear, viewMonth, todayObj],
    );

    const isToday = useCallback(
        /**
         * @param {number} day
         */
        (day) => {
            return (
                viewYear === todayObj.year &&
                viewMonth === todayObj.month &&
                day === todayObj.day
            );
        },
        [viewYear, viewMonth, todayObj],
    );

    const renderGrid = () => {
        const totalDays = daysInMonth(viewYear, viewMonth);
        const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
        const cells = [];

        for (let i = 0; i < firstDayOfWeek; i++) {
            cells.push(<div key={`empty-${i}`} className="w-7 h-7" />);
        }

        for (let day = 1; day <= totalDays; day++) {
            const isSelected =
                pendingDate &&
                pendingDate.year === viewYear &&
                pendingDate.month === viewMonth &&
                pendingDate.day === day;
            const past = isPastDay(day);
            const today = isToday(day);

            cells.push(
                <button
                    key={day}
                    type="button"
                    disabled={past || today}
                    onClick={() => {
                        handleSelectDay(day);
                    }}
                    className={`w-7 h-7 text-[12px] flex items-center justify-center
                        ${
                            past || today
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-gray-700 cursor-pointer"
                        }
                        ${
                            isSelected
                                ? "bg-gray-600 text-white rounded-full"
                                : today && !past
                                  ? "rounded-full font-bold border border-gray-400"
                                  : !past
                                    ? "hover:border hover:border-dashed hover:border-gray-700 hover:rounded-full"
                                    : ""
                        }`}
                >
                    {day}
                </button>,
            );
        }

        return cells;
    };

    return (
        <div
            ref={containerRef}
            className="relative w-fit max-w-40 flex items-center gap-1.5"
        >
            {isLoading ? (
                <div className="loader-circle ms-1 w-3.5! h-3.5!"></div>
            ) : (
                <button
                    type="button"
                    className={`appearance-none bg-transparent cursor-pointer text-left font-medium whitespace-nowrap ${isPastDue ? "text-red-700" : "text-gray-700"}`}
                    onClick={handleToggleOpen}
                >
                    {open
                        ? pendingDate
                            ? formatDisplayDate(pendingDate)
                            : "..."
                        : selectedDate
                          ? formatDisplayDate(selectedDate)
                          : "..."}
                </button>
            )}

            {open && (
                <div className="absolute z-10 top-full mt-1 left-0 bg-[rgb(var(--card-item-bg))] border-2 shadow-[0_3px_0_0] border-gray-600 shadow-gray-600 w-56 p-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-1">
                        <button
                            type="button"
                            onClick={goPrevMonth}
                            className="text-gray-400 hover:text-gray-700 px-1"
                        >
                            ‹
                        </button>
                        <span className="text-[12px] font-semibold text-gray-700">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button
                            type="button"
                            onClick={goNextMonth}
                            className="text-gray-400 hover:text-gray-700 px-1"
                        >
                            ›
                        </button>
                    </div>

                    <div className="grid grid-cols-7 text-center text-[10px] text-gray-700 font-medium mb-0.5">
                        {WEEKDAYS.map((d) => (
                            <div key={d}>{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 text-center gap-y-1">
                        {renderGrid()}
                    </div>

                    {pendingDate && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="mt-1 w-full text-[11px] text-gray-400 hover:text-red-600 cursor-pointer font-medium"
                        >
                            remove
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
