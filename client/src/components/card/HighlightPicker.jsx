import highlightColors from "../../data/highlights";
import useBoardState from "../../hooks/useBoardState";
import Icon from "../shared/Icon";
import { axiosPrivate } from "../../api/axios";
import useToast from "../../hooks/useToast";
import { SOCKET_EVENTS } from "@shared/socket-events.js";

const HighlightPicker = ({ setOpen, card }) => {
    const { setCardDetailHighlight, updateCardField, socket } = useBoardState();

    const toast = useToast();

    const handleSetCardHighlight = async (value) => {
        if (value == null) {
            setOpen(false);
        }

        if (card.highlight === value) return;

        try {
            updateCardField({
                id: card._id,
                listId: card.listId,
                field: "highlight",
                value,
            });
            setCardDetailHighlight(value);
            await axiosPrivate.patch(`/cards/${card._id}/new-highlight`, {
                highlight: value,
            });
            socket.emit(SOCKET_EVENTS.CARD_UPDATE_HIGHLIGHT, {
                id: card._id,
                listId: card.listId,
                highlight: value,
            });
        } catch (err) {
            const errMsg =
                err?.response?.data?.message || "Failed to change highlight";
            toast.error(errMsg);
        }
    };

    return (
        <div
            id="card__detail__highlight__picker"
            className="absolute z-10 top-1/2 left-1/2 translate-y-[10%] -translate-x-1/2 flex flex-col gap-1 items-center justify-center bg-gray-200 p-2 border-2 border-gray-600 shadow-gray-600 shadow-[4px_5px_0_0] w-[200px]"
        >
            {highlightColors.map((hl) => {
                return (
                    <div
                        key={hl}
                        className={`relative w-full h-5 border-2 hover:border-blue-400 cursor-pointer`}
                        style={{ background: hl }}
                        onClick={() => handleSetCardHighlight(hl)}
                    ></div>
                );
            })}

            <div
                className={`w-full cursor-pointer mt-1 bg-transparent flex--center font-bold text-gray-400 hover:text-blue-400 text-[0.75rem]`}
                onClick={() => handleSetCardHighlight(null)}
            >
                <Icon className="w-4 h-4" name="xmark" />
            </div>
        </div>
    );
};

export default HighlightPicker;
