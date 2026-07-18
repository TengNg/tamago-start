import useBoardState from "../../hooks/useBoardState";
import { useKeybind } from "../../hooks/useKeybind";
import { kb } from "../../constants/keybinds";
import Modal from "../ui/Modal";

const ConfigurationModal = () => {
    const {
        theme,
        setTheme,
        debugModeEnabled,
        setDebugModeEnabled,
        openConfiguration: open,
        setOpenConfiguration: setOpen,
    } = useBoardState();

    /** @param {string} value */
    const handleChangeTheme = (value) => {
        setTheme((prev) => {
            return { ...prev, itemTheme: value };
        });
    };

    const handleToggleEnableDebugMode = () => {
        setDebugModeEnabled((prev) => {
            return { ...prev, enabled: !prev.enabled };
        });
    };

    const themeStyle =
        !theme.itemTheme || theme.itemTheme === "squared"
            ? "squared"
            : "rounded-sm";

    useKeybind(kb.openConfiguration, () => {
        setOpen((prev) => !prev);
    });

    return (
        <Modal title="configuration" open={open} setOpen={setOpen}>
            <div className="w-full flex flex-col items-start justify-start">
                <div className="w-full">
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
        </Modal>
    );
};

export default ConfigurationModal;
