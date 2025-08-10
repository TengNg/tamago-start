import Title from "../components/ui/Title";

export default function SomethingWentWrong() {
    return (
        <>
            <section
                id="boards"
                className="w-full h-[calc(100%-75px)] overflow-auto pb-4"
            >
                <div className="flex flex-col items-center mx-auto sm:w-3/4 w-[90%]">
                    <Title titleName={"error."} />
                    <p className="my-4 ms-3 text-[12px] sm:text-sm text-gray-600 text-center">
                        something went wrong, please try again :(
                    </p>
                </div>
            </section>
        </>
    );
}
