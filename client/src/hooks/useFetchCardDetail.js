import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { axiosPrivate } from "../api/axios";

const useFetchCardDetail = ({ stateHooks }) => {
    const { setCardDetailAbortController, setOpenCardDetail, setOpenedCard } =
        stateHooks;
    const [searchParams, _setSearchParams] = useSearchParams();

    useEffect(() => {
        const cardId = searchParams.get("card");
        if (!cardId) {
            return;
        }

        const getCardData = async () => {
            try {
                const controller = new AbortController();
                setCardDetailAbortController(controller);
                setOpenCardDetail(true);
                setOpenedCard(undefined);
                const response = await axiosPrivate.get(`/cards/${cardId}`, {
                    signal: controller.signal,
                });
                const { card } = response.data;
                setOpenedCard(card);

                // Set document title as card title
                document.title = `[card] ${card.title}`;
            } catch (err) {
                const errMsg =
                    err?.response?.data?.message || "Failed to get card data";
                setOpenedCard({ failedToLoad: true, errMsg });
            }
        };

        getCardData();
    }, [searchParams]);
};

export default useFetchCardDetail;
