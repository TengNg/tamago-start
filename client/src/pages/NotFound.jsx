import { useNavigate } from "react-router-dom";
import Title from "../components/ui/Title";

export default function NotFound() {
    const navigate = useNavigate();
    return (
        <>
            <section
                id="boards"
                className="w-full h-[calc(100%-75px)] overflow-auto pb-4"
            >
                <div className="flex flex-col items-center mx-auto sm:w-3/4 w-[90%]">
                    <Title titleName={"page not found"} />
                    <p className="my-4 ms-3 text-gray-600 text-center">
                        Oops, looks like you are lost...
                    </p>
                    <button
                        className="button--style text-sm hover:bg-gray-600 hover:text-gray-50"
                        onClick={() => navigate("/boards")}
                    >
                        Back to Boards
                    </button>
                </div>
            </section>
        </>
    );
}
