import backgroundThemes from "../../constants/backgroundThemes";

/**
 * @typedef {Object} ThemesDialogProps
 * @property {{ theme: string; hex: string }} backgroundTheme
 * @property {React.Dispatch<React.SetStateAction<{ theme: string; hex: string; }>>} setBackgroundTheme
 */

/**
 * @param {ThemesDialogProps} props
 */
const ThemesDialog = ({ backgroundTheme, setBackgroundTheme }) => {
    return (
        <div className="flex flex-col gap-3 h-fit">
            {Object.entries(backgroundThemes).map((el) => {
                const [title, color] = el;
                return (
                    <button
                        className="w-full h-12.5 border border-gray-700 shadow-gray-700 shadow-[0px_3px_0_0] text-center grid items-center"
                        style={{
                            backgroundColor: color,
                            textDecoration:
                                backgroundTheme?.theme === title
                                    ? "underline"
                                    : "none",
                        }}
                        onClick={() =>
                            setBackgroundTheme({ theme: title, hex: color })
                        }
                        key={color}
                    >
                        {title} [{color}]
                    </button>
                );
            })}
        </div>
    );
};

export default ThemesDialog;
