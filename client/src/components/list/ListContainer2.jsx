import React, { useRef, useEffect } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { StrictModeDroppable as Droppable } from "../../helpers/StrictModeDroppable";
import List from "./List2";
import useBoardState from "../../hooks/useBoardState";
import AddList from "./AddList";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { lexorank } from "../../utils/class/Lexorank";
import useAuth from "../../hooks/useAuth";

const ListContainer = ({ openAddList, setOpenAddList }) => {
    const { boardState, setBoardState, socket } = useBoardState();

    const { auth } = useAuth();

    const listContainerRef = useRef();

    const axiosPrivate = useAxiosPrivate();

    useEffect(() => {
        if (listContainerRef.current) {
            listContainerRef.current.scrollLeft = 0;
        }
    }, []);

    const handleOnDragEnd = async (result) => {
        if (
            boardState?.board?.createdBy?._id !== auth?.user?._id &&
            !boardState?.board?.members
                .map((member) => member._id)
                .includes(auth?.user?._id)
        ) {
            alert("You don't have permission, please join the board first");
            return;
        }

        const { destination, source, type } = result;

        if (!destination) return;

        const { index: destIndex } = destination;
        const { index: srcIndex } = source;

        // deep copy, need this when failed to reorder
        let tempLists = JSON.parse(JSON.stringify([...boardState.lists]));

        if (type === "LIST") {
            const newLists = [...boardState.lists];
            const [removed] = newLists.splice(source.index, 1);

            if (destIndex === srcIndex) return;

            newLists.splice(destination.index, 0, removed);

            let prevRank = newLists[destIndex - 1]?.order;
            let nextRank = newLists[destIndex + 1]?.order;

            let [rank, ok] = lexorank.insert(prevRank, nextRank);

            // failed to reorder
            if (!ok) {
                alert(
                    "Failed to reorder list, rank is not valid. You can try to drag to another place, then drag back to this position again.",
                );
                return;
            }

            const removedId = removed._id;

            removed.order = rank;

            try {
                setBoardState((prev) => {
                    return { ...prev, lists: newLists };
                });

                await axiosPrivate.patch(
                    `/lists/${removedId}/reorder`,
                    JSON.stringify({
                        rank,
                        sourceIndex: srcIndex,
                        destinationIndex: destIndex,
                    }),
                );
                socket.emit("moveList", {
                    listId: removedId,
                    fromIndex: srcIndex,
                    toIndex: destIndex,
                });
            } catch (err) {
                alert("Failed to reorder list");
                setBoardState((prev) => {
                    return { ...prev, lists: tempLists };
                });
            }

            return;
        }

        // type CARD ============================================================================================

        let currentLists = boardState.lists;

        const fromList = currentLists.find(
            (list) => list._id === source.droppableId,
        );
        const toList = currentLists.find(
            (list) => list._id === destination.droppableId,
        );

        // dragging outside
        if (!fromList || !toList) {
            return;
        }

        // dragging to the same location
        if (fromList._id === toList._id && source.index === destination.index) {
            return;
        }

        const fromListCards = fromList.cards;
        const toListCards = toList.cards;

        // get dragged card
        const [removed] = fromListCards.splice(source.index, 1);
        const removedId = removed._id;

        let prevRank = "";
        let nextRank = "";

        if (fromList._id === toList._id) {
            fromListCards.splice(destination.index, 0, removed);
            prevRank = fromListCards[destIndex - 1]?.order;
            nextRank = fromListCards[destIndex + 1]?.order;
        } else {
            toListCards.splice(destination.index, 0, removed);
            removed.listId = destination.droppableId;
            prevRank = toListCards[destIndex - 1]?.order;
            nextRank = toListCards[destIndex + 1]?.order;
        }

        let [rank, ok] = lexorank.insert(prevRank, nextRank);

        if (!ok) {
            alert(
                "Failed to reorder card, rank is not valid. You can try to drag to another place, then drag back to this position again.",
            );
            return;
        }

        removed.order = rank;
        removed.updatedAt = new Date();

        try {
            setBoardState((prev) => {
                return { ...prev, lists: currentLists };
            });

            const response = await axiosPrivate.patch(
                `/cards/${removedId}/reorder`,
                JSON.stringify({
                    rank,
                    listId: removed.listId,
                    timestamp: removed.updatedAt,
                    sourceIndex: srcIndex,
                    destinationIndex: destIndex,
                }),
            );
            const newCard = response.data.newCard;

            socket.emit("moveCardToList", {
                oldListId: source.droppableId,
                newListId: newCard.listId,
                insertedIndex: destIndex,
                card: newCard,
            });
        } catch (err) {
            alert("Failed to reorder card");
            setBoardState((prev) => {
                return { ...prev, lists: tempLists };
            });
        }
    };

    return (
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable
                droppableId="list-container"
                direction="horizontal"
                type="LIST"
            >
                {(provided) => (
                    <div
                        {...provided.droppableProps}
                        ref={(element) => {
                            provided.innerRef(element);
                            listContainerRef.current = element;
                        }}
                        id="list-container"
                        ignoreContainerClipping={true}
                        className="flex justify-start items-start h-full overflow-x-auto border-black px-4 pb-4"
                    >
                        {boardState.lists.map((list, index) => (
                            <List
                                key={list._id}
                                list={list}
                                index={index}
                                cards={list?.cards || []}
                            />
                        ))}

                        {provided.placeholder}

                        <AddList open={openAddList} setOpen={setOpenAddList} />
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default ListContainer;
