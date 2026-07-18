import highlightColors from "../../../constants/highlights";
import Icon from "../../shared/Icon";

/**
 * @param {object} props
 * @param {(open: boolean) => void} props.setOpen
 * @param {Card} props.card
 * @param {(value: string | null) => void} props.onHighlightChange
 */
const HighlightPicker = ({ setOpen, card, onHighlightChange }) => {
    const handleSetCardHighlight = (/** @type {string | null} */ value) => {
        if (value == null) {
            setOpen(false);
        }

        if (card.highlight === value) return;

        onHighlightChange(value);
    };

    return (
        <div className="absolute z-10 -bottom-1 right-0 translate-y-full translate-x-0 flex flex-col gap-1 items-center justify-center bg-gray-200 p-2 border-2 shadow-[0_3px_0_0] border-gray-600 shadow-gray-600 w-50">
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
