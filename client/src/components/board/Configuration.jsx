import { useEffect, useRef } from "react";
import Icon from "../shared/Icon";
import { useKeybind } from "../../hooks/useKeybind";
import { kb } from "../../constants/keybinds";
import useBoardState from "../../hooks/useBoardState";

const Configuration = ({
    handleChangeTheme,
    handleToggleEnableDebugMode,
    theme,
    debugModeEnabled,
}) => {
    const { openConfiguration: open, setOpenConfiguration: setOpen } =
        useBoardState();
    const dialog = useRef();

    const themeStyle =
        !theme.itemTheme || theme.itemTheme === "squared"
            ? "squared"
            : "rounded-sm";

    useKeybind(kb.openConfiguration, () => {
        setOpen((prev) => !prev);
    });

    useEffect(() => {
        if (open) {
            dialog.current.showModal();

            const handleOnClose = () => {
                setOpen(false);
            };

            dialog.current.addEventListener("close", handleOnClose);

            return () => {
                dialog.current.removeEventListener("close", handleOnClose);
            };
        } else {
            dialog.current.close();
        }
    }, [open]);

    const handleCloseOnOutsideClick = (e) => {
        if (e.target === dialog.current) {
            dialog.current.close();
        }
    };

    const handleClose = () => {
        dialog.current.close();
    };

    return (
        <>
            <dialog
                ref={dialog}
                className="z-40 backdrop:bg-black/15 fixed top-0 right-0 box--style gap-4 items-start p-3 pb-5 h-fit min-w-75 max-h-125 border-black border-2 bg-gray-200"
                onClick={handleCloseOnOutsideClick}
            >
                <div className="flex w-full justify-between items-center border-b border-black pb-3 mb-3">
                    <p className="font-normal text-[1rem] text-gray-700">
                        configuration
                    </p>
                    <button
                        className="text-gray-600 flex justify-center items-center"
                        onClick={handleClose}
                    >
                        <Icon className="w-4 h-4" name="xmark" />
                    </button>
                </div>

                <div className="w-full flex flex-col items-start justify-start">
                    <div className="w-full">
                        {/* <div className='text-[0.75rem]'>themes:</div> */}
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => handleChangeTheme("squared")}
                                className={`button--style w-full mt-1 py-2 text-[0.75rem] border-2 ${themeStyle === "squared" ? "bg-gray-500 text-white" : ""}`}
                            >
                                squared
                            </button>
                            <button
                                onClick={() => handleChangeTheme("rounded-sm")}
                                className={`button--style w-full mt-1 py-2 text-[0.75rem] border-2 ${themeStyle === "rounded-sm" ? "bg-gray-500 text-white" : ""}`}
                            >
                                rounded
                            </button>
                        </div>
                    </div>

                    <div className="h-px w-full bg-black my-3"></div>

                    <div className="w-full">
                        {/* <div className='text-[0.75rem]'>enable debug mode:</div> */}
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => handleToggleEnableDebugMode()}
                                className={`button--style w-full mt-1 py-2 text-[0.75rem] border-2 ${debugModeEnabled.enabled ? "bg-pink-700 text-white" : "border-pink-700 text-pink-700 "}`}
                            >
                                {debugModeEnabled.enabled
                                    ? "disable debug mode"
                                    : "enable debug mode"}
                            </button>
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    );
};

export default Configuration;
