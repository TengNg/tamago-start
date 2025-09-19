import highlightColors from "../../data/highlights";
import useBoardState from "../../hooks/useBoardState";
import Icon from "../shared/Icon";
import { axiosPrivate } from "../../api/axios";

const QuickEditorHighlightPicker = ({ card }) => {
    const { setCardQuickEditorHighlight, setCardHighlight, socket } =
        useBoardState();

    const handleSetCardHighlight = async (value) => {
        if (card.highlight === value) return;

        try {
            setCardQuickEditorHighlight(value);
            setCardHighlight(card._id, card.listId, value);
            await axiosPrivate.patch(`/cards/${card._id}/new-highlight`, {
                highlight: value,
            });
            socket.emit("updateCardHighlight", {
                id: card._id,
                listId: card.listId,
                highlight: value,
            });
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="absolute top-0 left-0 w-[100px] translate-x-[100%] flex flex-col gap-1 cursor-pointer">
            {highlightColors.map((hl) => {
                return (
                    <div
                        key={hl}
                        className={`box-border w-full h-[25px] border-[3px] hover:border-blue-700`}
                        style={{ background: hl }}
                        onClick={() => handleSetCardHighlight(hl)}
                    ></div>
                );
            })}

            <div
                className={`w-full h-[25px] mt-1 bg-transparent flex--center font-bold border-[3px] hover:border-blue-700 hover:text-blue-700 text-gray-400 border-gray-400 text-[0.75rem]`}
                onClick={() => handleSetCardHighlight(null)}
            >
                <Icon className="w-3 h-3" name="xmark" />
            </div>
        </div>
    );
};

export default QuickEditorHighlightPicker;
