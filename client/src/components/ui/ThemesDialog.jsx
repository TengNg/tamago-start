import ModalDialog from "./ModalDialog";
import backgroundThemes from "../../constants/backgroundThemes";

const ThemesDialog = ({
    open,
    setOpen,
    backgroundTheme,
    setBackgroundTheme,
}) => {
    return (
        <ModalDialog
            title={"themes"}
            open={open}
            setOpen={setOpen}
            bodyClassName="px-0!"
        >
            <div className="flex flex-col gap-3 h-fit">
                {Object.entries(backgroundThemes).map((el) => {
                    const [title, color] = el;

                    return (
                        <button
                            className="w-full h-[50px] border border-gray-700 shadow-gray-700 shadow-[0px_3px_0_0] text-center grid items-center"
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
                            key={el}
                        >
                            {title} [{color}]
                        </button>
                    );
                })}
            </div>
        </ModalDialog>
    );
};

export default ThemesDialog;
