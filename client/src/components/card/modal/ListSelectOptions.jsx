/**
 * @param {{
 *   card: Card;
 *   listSelectOptions: { value: string; title: string }[];
 *   handleMoveCardOnListOptionChanged: (e: React.ChangeEvent<HTMLSelectElement>) => void;
 *   moveByIndex: (e: React.ChangeEvent<HTMLSelectElement>) => void;
 *   cardCount: number;
 *   position: number;
 * }} props
 */
export default function ListSelectOptions({
    card,
    listSelectOptions,
    handleMoveCardOnListOptionChanged,
    moveByIndex,
    cardCount,
    position,
}) {
    return (
        <div className="flex gap-2 w-full justify-between items-center">
            <div className="flex flex-1 gap-2">
                <select
                    className={`shadow-[0_2px_0_0] w-40 md:w-60 shadow-gray-600 bg-gray-100 appearance-none cursor-pointer hover:bg-gray-200 truncate border-2 border-gray-600 text-[0.75rem] font-medium py-2 px-4 text-gray-600 ${listSelectOptions.length === 0 ? "bg-gray-400" : ""}`}
                    value={card.listId}
                    onChange={handleMoveCardOnListOptionChanged}
                >
                    {listSelectOptions.map((option) => {
                        const { value, title } = option;
                        return (
                            <option key={value} value={value}>
                                {title}
                            </option>
                        );
                    })}
                </select>

                {position !== -1 && (
                    <select
                        className={`shadow-[0_2px_0_0] shadow-gray-600 bg-gray-100 text-center appearance-none cursor-pointer hover:bg-gray-200 truncate border-2 border-gray-600 text-[0.75rem] font-medium w-fit py-2 px-4 text-gray-600 ${listSelectOptions.length === 0 ? "bg-gray-400" : ""}`}
                        value={position}
                        onChange={moveByIndex}
                    >
                        {Array.from(Array(cardCount).keys()).map((count) => {
                            return (
                                <option key={count} value={count}>
                                    {count + 1}
                                </option>
                            );
                        })}
                    </select>
                )}
            </div>
        </div>
    );
}
