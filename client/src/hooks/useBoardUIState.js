import { useMemo, useState } from "react";

export function useBoardUIState() {
    const [openMoveListForm, setOpenMoveListForm] = useState(false);

    const [openFilter, setOpenFilter] = useState(false);
    const [openChatBox, setOpenChatBox] = useState(false);

    const [openInvitationForm, setOpenInvitationForm] = useState(false);
    const [openAddList, setOpenAddList] = useState(false);

    const [openKeyBindings, setOpenKeyBindings] = useState(false);
    const [openConfiguration, setOpenConfiguration] = useState(false);
    const [openBoardActivities, setOpenBoardActivities] = useState(false);
    const [openVisibilityConfig, setOpenVisibilityConfig] = useState(false);

    return useMemo(
        () => ({
            openMoveListForm,
            setOpenMoveListForm,
            openFilter,
            setOpenFilter,
            openChatBox,
            setOpenChatBox,
            openInvitationForm,
            setOpenInvitationForm,
            openAddList,
            setOpenAddList,
            openKeyBindings,
            setOpenKeyBindings,
            openConfiguration,
            setOpenConfiguration,
            openBoardActivities,
            setOpenBoardActivities,
            openVisibilityConfig,
            setOpenVisibilityConfig,
        }),
        [
            openMoveListForm,
            openFilter,
            openChatBox,
            openInvitationForm,
            openAddList,
            openKeyBindings,
            openConfiguration,
            openBoardActivities,
            openVisibilityConfig,
        ],
    );
}
