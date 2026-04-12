import ModalDialog from "./ModalDialog";

const KeyBindings = ({ open, setOpen }) => {
    return (
        <ModalDialog title={"help"} open={open} setOpen={setOpen}>
            <ul className="flex flex-col gap-4 list-disc">
                <li>
                    <span className="key">?</span> open help
                </li>

                <li>
                    <span className="key">.</span> open chat
                </li>

                <li>
                    <span className="key">a</span>{" "}
                    <span className="key">d</span> scroll left right
                </li>

                <li>
                    <span className="key">Esc</span> close opened
                </li>

                <li>
                    <span className="key">Enter</span> open selected card / send
                    message
                </li>

                <li>
                    <span className="key">q</span> open quick editor of a
                    selected card
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
                    <span className="key">p</span> open filter
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">i</span> open invite
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">m</span> open membership
                </li>

                <li>
                    <span className="key">Ctrl</span> +{" "}
                    <span className="key">e</span> open pinned boards
                </li>

                <li>
                    <span className="key">Ctrl</span> + <span> </span>
                    <span className="key">↑</span>
                    <span> </span>
                    <span className="key">↓</span>
                    <span> </span>
                    <span className="key">←</span>
                    <span> </span>
                    <span className="key">→</span>
                    <span> </span>
                    select card
                    <br />
                    <br />
                    <span className="key">Ctrl</span> + <span> </span>
                    <span className="key">k</span>
                    <span> </span>
                    <span className="key">j</span>
                    <span> </span>
                    <span className="key">h</span>
                    <span> </span>
                    <span className="key">l</span>
                    <span> </span>
                    (vim-like)
                </li>
            </ul>

            <div className="h-[1px] bg-black w-full mt-4"></div>

            <div className="pt-3 text-[12px] sm:text-[0.8rem] text-gray-500">
                format chat message:
                <ul className="flex flex-col gap-3 list-disc ms-4 mt-2">
                    <li className="font-medium">
                        <span className="py-1 px-2 bg-gray-500 rounded text-gray-50">
                            !c [card_code] [?message]
                        </span>
                    </li>
                    <li className="font-medium">
                        <span className="py-1 px-2 bg-gray-500 rounded text-gray-50">
                            !b [board_code] [?message]
                        </span>
                    </li>
                </ul>
            </div>
        </ModalDialog>
    );
};

export default KeyBindings;
