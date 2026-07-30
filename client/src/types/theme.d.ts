import THEMES from "../constants/themes";

export { };

declare global {
    type ThemeStyle = keyof typeof THEMES;

    type ThemeAttributes = {
        bg: string;
        surface: string;
        border: string;
        text: string;
        muted: string;
        shadow: string;
        danger: string;
        success: string;
        neutral: string;
        tag: string;
        cardItemBg: string;
        cardItemFocusedBg: string;
        pastDueCardBg: string;
    };
}
