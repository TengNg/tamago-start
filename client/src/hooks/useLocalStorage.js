import { useState, useEffect } from "react";

/**
 * @template T
 * @param {string} key
 * @param {T} defaultValue
 * @returns {T}
 */
const getStorageData = (key, defaultValue) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (err) {
        console.error(`Error reading localStorage key "${key}":`, err);
        return defaultValue;
    }
};

/**
 * @template T
 * @param {string} key
 * @param {T} defaultValue
 * @returns {[T, React.Dispatch<import("react").SetStateAction<T>>]}
 */
const useLocalStorage = (key, defaultValue) => {
    const [data, setData] = useState(() => getStorageData(key, defaultValue));

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (err) {
            console.error(`Error saving to localStorage key "${key}":`, err);
        }
    }, [key, data]);

    return [data, setData];
};

export default useLocalStorage;
