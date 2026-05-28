import highlightColors from "../../constants/highlights";
import useBoardState from "../../hooks/useBoardState";
import Icon from "../shared/Icon";
import { axiosPrivate } from "../../api/axios";
import useToast from "../../hooks/useToast";
import { SOCKET_EVENTS } from "@shared/socket-events.js";

const QuickEditorHighlightPicker = ({ card }) => {
    const { setCardQuickEditorHighlight, updateCardField, socket } =
        useBoardState();

    const toast = useToast();

    const handleSetCardHighlight = async (value) => {
        if (card.highlight === value) return;

        try {
            setCardQuickEditorHighlight(value);
            updateCardField({
                id: card._id,
                listId: card.listId,
                field: "highlight",
                value,
            });
            await axiosPrivate.patch(`/cards/${card._id}/new-highlight`, {
                highlight: value,
            });
            socket.emit(SOCKET_EVENTS.CARD_UPDATE_HIGHLIGHT, {
                id: card._id,
                listId: card.listId,
                highlight: value,
            });
        } catch (err) {
            toast.error("Failed to update highlight");
        }
    };

    return (
        <div className="absolute top-0 left-0 w-25 translate-x-[150%] flex flex-col gap-0.75 cursor-pointer">
            {highlightColors.map((hl) => {
                return (
                    <div
                        key={hl}
                        className={`box-border w-full h-5 border-2 border-gray-500 hover:border-blue-700`}
                        style={{ background: hl }}
                        onClick={() => handleSetCardHighlight(hl)}
                    ></div>
                );
            })}

            <div
                className={`w-full h-5 mt-1 bg-transparent flex--center font-bold border-2 hover:border-blue-700 hover:text-blue-700 text-gray-600 border-gray-600 text-[0.75rem]`}
                onClick={() => handleSetCardHighlight(null)}
            >
                <Icon className="w-3 h-3" name="xmark" />
            </div>
        </div>
    );
};

export default QuickEditorHighlightPicker;
