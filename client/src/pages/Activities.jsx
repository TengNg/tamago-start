import { useReducer, useState } from "react";
import Title from "../components/ui/Title";
import Invitations from "../components/invitation/Invitations";
import JoinBoardRequests from "../components/join-board-request/JoinRequests";
import ActivitiesHelp from "../components/ui/ActivitiesHelp";
import Modal from "../components/ui/Modal";

const ACTIONS = Object.freeze({
    TOGGLE_INVITATIONS_SECTION: "toggle_invitation_section",
    TOGGLE_JOIN_BOARD_REQUESTS_SECTION: "toggle_join_board_request_section",
});

/**
 * @typedef {Object} ActivitiesState
 * @property {boolean} showInvitations
 * @property {boolean} showJoinBoardRequests
 */

/**
 * @typedef {Object} ActivitiesAction
 * @property {string} type
 */

/**
 * @param {ActivitiesState} state
 * @param {ActivitiesAction} action
 * @returns {ActivitiesState}
 */
const reducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.TOGGLE_INVITATIONS_SECTION:
            return {
                ...state,
                showInvitations: !state.showInvitations,
            };
        case ACTIONS.TOGGLE_JOIN_BOARD_REQUESTS_SECTION:
            return {
                ...state,
                showJoinBoardRequests: !state.showJoinBoardRequests,
            };
        default:
            return state;
    }
};

const Activities = () => {
    const [state, dispatch] = useReducer(reducer, {
        showInvitations: true,
        showJoinBoardRequests: true,
    });

    const { showInvitations, showJoinBoardRequests } = state;

    const [openHelp, setOpenHelp] = useState(false);

    function handleToggleInvitationsSection() {
        dispatch({ type: ACTIONS.TOGGLE_INVITATIONS_SECTION });
    }

    function handleToggleBoardRequestsSection() {
        dispatch({ type: ACTIONS.TOGGLE_JOIN_BOARD_REQUESTS_SECTION });
    }

    return (
        <>
            <Modal open={openHelp} setOpen={setOpenHelp} title="help">
                <ActivitiesHelp />
            </Modal>

            <section className="w-full h-full overflow-auto pb-8">
                <Title titleName="activities" />

                <div
                    className={`flex justify-center gap-2 mx-auto mb-6 sm:mb-4 lg:w-1/2 md:w-3/4 w-[90%]`}
                >
                    <div className="h-8.75">
                        <button
                            title='press "i" to open'
                            className={`w-fit ${showInvitations ? "mt-[0.15rem] text-gray-100 shadow-[0_1px_0_0]" : "shadow-gray-600 shadow-[0_3px_0_0]"} bg-gray-100/30 border-2 border-gray-600 text-gray-600 px-3 py-2 text-[0.65rem] sm:text-[0.65rem] font-medium`}
                            onClick={handleToggleInvitationsSection}
                        >
                            inivitations
                        </button>
                    </div>

                    <div className="h-8.75">
                        <button
                            title='press "o" to open'
                            className={`w-25 ${showJoinBoardRequests ? "mt-[0.15rem] text-gray-100 shadow-[0_1px_0_0]" : "shadow-gray-600 shadow-[0_3px_0_0]"} bg-gray-100/30 border-2 border-gray-600 text-gray-600 px-3 py-2 text-[0.65rem] sm:text-[0.65rem] font-medium`}
                            onClick={handleToggleBoardRequestsSection}
                        >
                            requests
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Invitations show={showInvitations} />
                    <JoinBoardRequests show={showJoinBoardRequests} />
                </div>
            </section>

            <button
                className="fixed sm:bottom-4 sm:left-4 bottom-2.5 left-2.5 w-5 h-5 text-[12px] bg-gray-500 hover:bg-gray-600 text-white rounded-full"
                onClick={() => {
                    setOpenHelp((prev) => !prev);
                }}
                title="open help"
            >
                ?
            </button>
        </>
    );
};

export default Activities;
