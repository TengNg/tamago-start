import { kb } from "../../constants/keybinds";
import useBoardState from "../../hooks/useBoardState";
import { useKeybind } from "../../hooks/useKeybind";
import ModalDialog from "./ModalDialog";

const KeyBindings = () => {
    const { openKeyBindings: open, setOpenKeyBindings: setOpen } =
        useBoardState();

    useKeybind(
        kb.openKeyBindings,
        () => {
            setOpen((prev) => !prev);
        },
        { ignoreInInputs: true },
    );

    return (
        <ModalDialog title={"help"} open={open} setOpen={setOpen}>
            <ul className="flex flex-col gap-4 list-disc">
                <li>
                    <span className="key">?</span> open help
                </li>

                <li>
                    <span className="key">q</span> open card's quick editor (if
                    it's focused)
                </li>

                <li>
                    <span className="key">a</span>{" "}
                    <span className="key">d</span> scroll left right
                </li>

                <li>
                    <span className="key">Enter</span> open selected card / send
                    message
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">Enter</span> open chat
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">.</span> open board activities
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">;</span> open new list composer
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">/</span> focus card description
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">x</span> open board configuration
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">f</span> open filter
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">i</span> open invite
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">m</span> open members
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">p</span> open pinned boards
                </li>

                <li>
                    <span className="key">Ctrl</span> + <span> </span>
                    <span className="key">←</span>
                    <span> </span>
                    <span className="key">↓</span>
                    <span> </span>
                    <span className="key">↑</span>
                    <span> </span>
                    <span className="key">→</span>
                    <span> </span>
                    navigate &amp; focus card
                    <br />
                    <br />
                    <span className="key">Ctrl</span> + <span> </span>
                    <span className="key">h</span>
                    <span> </span>
                    <span className="key">j</span>
                    <span> </span>
                    <span className="key">k</span>
                    <span> </span>
                    <span className="key">l</span>
                    <span> </span>
                </li>
            </ul>

            <div className="h-px bg-black w-full mt-4"></div>

            <div className="pt-2 text-[12px] sm:text-[0.8rem] text-gray-500">
                format chat message with:
                <ul className="flex flex-col gap-3 list-disc ms-4 mt-2">
                    <li className="font-medium">
                        <span className="py-1 px-2 bg-gray-500 text-gray-50">
                            !c [card_code] [your_message]
                        </span>
                    </li>
                    <li className="font-medium">
                        <span className="py-1 px-2 bg-gray-500 text-gray-50">
                            !b [board_code] [your_message]
                        </span>
                    </li>
                </ul>
            </div>
        </ModalDialog>
    );
};

export default KeyBindings;
