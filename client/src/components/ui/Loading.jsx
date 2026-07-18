/**
 * @typedef {Object} LoadingProps
 * @property {"fixed" | "absolute" | "relative" | "sticky"} [position="fixed"]
 * @property {boolean} loading
 * @property {string} [displayText="Loading..."]
 * @property {string} [fontSize="1.25rem"]
 * @property {string | number} [zIndex="50"]
 * @property {string} [displayTextClassName=""]
 * @property {boolean} [withLoader=false]
 */

/**
 * @param {LoadingProps} props
 */
const Loading = ({
    position = "fixed",
    loading,
    displayText = "Loading...",
    fontSize = "1.25rem",
    zIndex = "50",
    displayTextClassName = "",
    withLoader = false,
}) => {
    return (
        <div
            className={`${loading ? position : "hidden"} ${position} text-[${fontSize}] z-${zIndex} select-none top-0 left-0 text-gray-600 font-medium h-full w-full bg-white opacity-50 flex--center`}
        >
            <div className={displayTextClassName}>
                {displayText}
                {withLoader && <div className="loader mt-2 mx-auto"></div>}
            </div>
        </div>
    );
};

export default Loading;
