/**
 * Function to determine if a value is empty
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value is empty, false otherwise
 */
const isEmpty = (value) => {
    return (
        value === undefined ||
        value === null ||
        (typeof value === 'object' && Object.keys(value).length === 0) ||
        (typeof value === 'string' && value.trim().length === 0)
    );
};

export default isEmpty;