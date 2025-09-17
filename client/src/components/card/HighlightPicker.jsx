import highlightColors from "../../data/highlights";
import useBoardState from "../../hooks/useBoardState";
import Icon from "../shared/Icon";
import { axiosPrivate } from "../../api/axios";

const HighlightPicker = ({ setOpen, card }) => {
    const { setCardDetailHighlight, setCardHighlight, socket } =
        useBoardState();

    const handleSetCardHighlight = async (value) => {
        if (value == null) {
            setOpen(false);
        }

        if (card.highlight === value) return;

        try {
            setCardHighlight(card._id, card.listId, value);
            setCardDetailHighlight(value);
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
        <div
            id="card__detail__highlight__picker"
            className="absolute z-10 top-1/2 left-1/2 translate-y-[10%] -translate-x-1/2 flex flex-col gap-1 items-center justify-center bg-gray-200 p-2 border-[2px] border-gray-600 shadow-gray-600 shadow-[4px_5px_0_0] w-[200px]"
        >
            {Object.keys(highlightColors).map((item, index) => {
                return (
                    <div
                        key={index}
                        className={`relative w-full h-[1.25rem] border-[2px] hover:border-blue-400 cursor-pointer`}
                        style={{ background: `${highlightColors[item]}` }}
                        onClick={() =>
                            handleSetCardHighlight(highlightColors[item])
                        }
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
