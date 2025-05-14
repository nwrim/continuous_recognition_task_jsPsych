/**
 * Generates an array of numbers from `start` to `end` (exclusive).
 * 
 * @param {number} start - The starting value of the range (inclusive).
 * @param {number} end - The ending value of the range (exclusive).
 * @returns {number[]} An array containing numbers from `start` to `end - 1`.
 */
function range(start, end) {
    var result = [];
    for (var i = start; i < end; i++) {
        result.push(i);
    }
    return result;
}

