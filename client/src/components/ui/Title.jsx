/**
 * @typedef {Object} TitleProps
 * @property {string} titleName
 */

/**
 * @param {TitleProps} props
 */
const Title = ({ titleName }) => {
    return (
        <div className="flex-center select-none mb-8">
            <p className="page-title relative text-gray-600 sm:text-2xl text-lg text-center font-medium transition all mt-3 sm:mt-1">
                {titleName}
            </p>
        </div>
    );
};

export default Title;
