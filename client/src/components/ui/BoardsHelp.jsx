const BoardsHelp = () => {
    return (
        <ul className="flex flex-col gap-4 list-none">
            <li>
                <span className="key">?</span> open help
            </li>

            <li>
                <span className="key">Esc</span> close
            </li>

            <li>
                <span className="key">Ctrl</span> +{" "}
                <span className="key">j</span> open send-join-request form
            </li>

            <li>
                <span className="key">Ctrl</span> +{" "}
                <span className="key">b</span> open new-board form
            </li>
        </ul>
    );
};

export default BoardsHelp;
