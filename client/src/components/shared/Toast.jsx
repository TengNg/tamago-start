import Icon from "./Icon";

const Toast = ({ type, message, onClose }) => {
    return (
        <div
            onClick={onClose}
            className={`${type === "success" ? "bg-green-100 border-green-700 text-green-700" : "bg-rose-100 border-rose-700 text-rose-700"} select-none w-fit h-fit border-2 text-[12px] p-2 font-medium`}
        >
            <div className="flex items-start justify-between gap-2">
                <div>{message}</div>
                <button onClick={onClose}>
                    <Icon
                        name="xmark"
                        className={`${type == "success" ? "text-green-700" : "text-rose-700"} w-4 h-4 cursor-pointer flex justify-center items-center`}
                    />
                </button>
            </div>
        </div>
    );
};

export default Toast;
