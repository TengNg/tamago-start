import THEMES from "../../constants/themes";

/**
 * @typedef {Object} ThemesDialogProps
 * @property {ThemeStyle} themeStyle
 * @property {React.Dispatch<React.SetStateAction<ThemeStyle>>} setThemeStyle
 */

/**
 * @param {ThemesDialogProps} props
 */
const ThemesDialog = ({ themeStyle, setThemeStyle }) => {
    return (
        <div className="flex flex-col gap-2 p-2">
            {Object.entries(THEMES).map((entry) => {
                const [k, t] = /** @type {[ThemeStyle, ThemeAttributes]} */ (
                    entry
                );
                const isSelected = themeStyle === k;
                return (
                    <button
                        key={k}
                        onClick={() => setThemeStyle(k)}
                        className="w-full text-left border-2 rounded-md p-3 transition-all hover:brightness-105"
                        style={{
                            backgroundColor: `rgb(${t.surface})`,
                            borderColor: isSelected
                                ? `rgb(${t.border})`
                                : `rgb(${t.border}) / 0.3`,
                            boxShadow: isSelected
                                ? `3px 4px 0 0 rgb(${t.shadow})`
                                : "none",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-0.5">
                                <div
                                    className="w-full h-2 rounded-sm"
                                    style={{
                                        backgroundColor: `rgb(${t.bg})`,
                                    }}
                                />
                                <div
                                    className="w-full h-2 rounded-sm"
                                    style={{
                                        backgroundColor: `rgb(${t.surface})`,
                                    }}
                                />
                                <div
                                    className="w-full h-2 rounded-sm"
                                    style={{
                                        backgroundColor: `rgb(${t.tag})`,
                                    }}
                                />
                            </div>
                            <div className="flex flex-col">
                                <span
                                    className="text-sm font-semibold"
                                    style={{
                                        color: `rgb(${t.text})`,
                                    }}
                                >
                                    {k}
                                </span>
                                <span
                                    className="text-xs"
                                    style={{
                                        color: `rgb(${t.muted})`,
                                    }}
                                >
                                    {k}
                                </span>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default ThemesDialog;
