import ModalDialog from "./ModalDialog";

const BoardsHelp = ({ open, setOpen }) => {
    return (
        <ModalDialog title={"help"} open={open} setOpen={setOpen}>
            <div className="flex flex-col h-[175px]">
                <ul className="flex flex-col gap-4 list-disc">
                    <li>
                        <span className="key">?</span> open help
                    </li>

                    <li>
                        <span className="key">Esc</span> close
                    </li>

                    <li>
                        <span className="key">Ctrl</span> +{" "}
                        <span className="key">j</span> open join-board form
                    </li>

                    <li>
                        <span className="key">Ctrl</span> +{" "}
                        <span className="key">;</span> open create-board form
                    </li>
                </ul>
            </div>
        </ModalDialog>
    );
};

export default BoardsHelp;
