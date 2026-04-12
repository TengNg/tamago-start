import ModalDialog from "./ModalDialog";

const ActivitiesHelp = ({ open, setOpen }) => {
    return (
        <ModalDialog title={"help"} open={open} setOpen={setOpen}>
            <div className="flex flex-col h-fit">
                <p>[keybindings]:</p>
                <ul className="flex flex-col gap-4 list-disc mt-3">
                    <li>
                        <span className="key">?</span> open help
                    </li>

                    <li>
                        <span className="key">o</span> open invitations tab
                    </li>

                    <li>
                        <span className="key">i</span> open requests (or
                        join-board-requests) tab
                    </li>
                </ul>

                <div className="h-px bg-black mt-6 mb-4"></div>
                <p>[?]:</p>
                <ul className="flex flex-col gap-4 list-disc mt-2">
                    <li>
                        <span className="fw-bold underline">invitations</span>{" "}
                        tab will show all invitations that other users have sent
                        to you. Accept will let you join the board (with the
                        board code show in the invitation).
                    </li>
                    <li>
                        <span className="fw-bol underline">requests</span> tab
                        will show all join requests that you have received.
                        Accept will let the user (who sent the request) join the
                        board.
                    </li>
                </ul>
            </div>
        </ModalDialog>
    );
};

export default ActivitiesHelp;
