import Title from "../components/ui/Title";

const Home = () => {
    return (
        <section className="w-full h-[calc(100%-75px)] overflow-auto pb-4">
            <div className="mx-auto sm:w-3/4 w-[90%]">
                <Title titleName={"about"} />

                <section className="flex flex-col gap-4 justify-between items-center">
                    <div className="text-[10px] md:text-[0.65rem] lg:text-sm text-gray-800">
                        <div className="border-[2px] border-dashed border-gray-700 md:p-6 p-3">
                            This project is a simple task management which you
                            can create your own task-boards and collab with your
                            friends (with a simple noting system).
                        </div>

                        <br />

                        <div className="border-[2px] border-dashed border-gray-700 md:p-6 p-3">
                            <div className="underline mb-2">
                                About this project:
                            </div>
                            <ul className="flex flex-col gap-2 ms-4 list-disc">
                                <li>
                                    Created from my own personal interest, and
                                    from everyday-workflow.
                                </li>
                                <li>
                                    I want a task-management app with a simple
                                    notes system (+ keybinds).
                                </li>
                                <li>Easy to collaborate with your friends.</li>
                                <li>
                                    Easy to track your progress &amp;
                                    activities.
                                </li>
                            </ul>
                        </div>

                        <br />

                        <div className="mb-1 w-full text-gray-700">
                            * Tips: Speed up your work with keyboard shortcuts!
                        </div>
                        <div className="border-[2px] border-dashed border-gray-700 md:p-6 p-3">
                            <div className="flex flex-wrap gap-6 lg:gap-12">
                                <div className="flex flex-col gap-2">
                                    <div className="underline">
                                        Global Keybinds
                                    </div>
                                    <ul className="flex flex-col gap-4 ms-4 list-disc">
                                        <li>
                                            <span className="key">0</span>{" "}
                                            navigate to Profile
                                        </li>
                                        <li>
                                            <span className="key">1</span>{" "}
                                            navigate to Home
                                        </li>
                                        <li>
                                            <span className="key">2</span>{" "}
                                            navigate to Boards
                                        </li>
                                        <li>
                                            <span className="key">3</span>{" "}
                                            navigate to Writedown
                                        </li>
                                        <li>
                                            <span className="key">4</span>{" "}
                                            navigate to Activities
                                        </li>
                                        <li>
                                            <span className="key">5</span>{" "}
                                            navigate to Last Viewed Board
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div>
                                        <span className="underline">
                                            In-Board Keybinds
                                        </span>
                                    </div>
                                    <ul className="flex flex-col gap-4 ms-4 list-disc">
                                        <li>
                                            <span className="key">?</span> show
                                            help
                                        </li>
                                        <li>
                                            <span className="key">a</span>{" "}
                                            scroll left
                                        </li>
                                        <li>
                                            <span className="key">d</span>{" "}
                                            scroll right
                                        </li>
                                        <li>
                                            <span className="key">Enter</span>{" "}
                                            confirm / send message
                                        </li>
                                        <li>
                                            <span className="key">Esc</span>{" "}
                                            close opened form / box
                                        </li>
                                        <li>
                                            <span className="key">Ctrl</span> +
                                            key combinations for better workflow
                                        </li>
                                        <li>
                                            <span className="key">...</span> and
                                            more
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <br />
                    </div>
                </section>
            </div>
        </section>
    );
};

export default Home;
