/**
 * Validates the given sequence object according to several rules.
 *
 * @param {Object} sequence - An object containing two arrays:
 *   - sequence.img: an array of image elements.
 *   - sequence.type: an array of numeric type values (expected values: 0, 1, 2, 3, 4).
 * @param {string} fixationImg - The expected image value for every even-indexed element in sequence.img.
 * @param {number} targetNum - The expected number of targets (type 1).
 * @param {number} fillerNum - The expected number of fillers (type 3).
 * @returns {Array} An array of error messages.
 *
 * The function performs the following validations:
 *  1. Checks that sequence.img and sequence.type are arrays of equal length.
 *  2. Uses a configuration to map specific numeric type values to roles:
 *     - 1: target,
 *     - 2: repeat (expected first occurrence type: 1),
 *     - 3: filler,
 *     - 4: vigilance (expected first occurrence type: 3).
 *  3. Counts occurrences and builds subarrays for each role.
 *  4. Ensures that the number of targets (1) matches the number of repeats (2).
 *  5. Verifies uniqueness of each role's subarray.
 *  6. Checks that target and repeat arrays completely overlap.
 *  7. Verifies that target and filler arrays do not overlap.
 *  8. Checks that every vigilance element is present in the filler array.
 *  9. For each element in sequence.type that is 2 (repeat) or 4 (vigilance),
 *     verifies that the corresponding sequence.img element has appeared earlier and that its first occurrence
 *     is of the expected type (1 for repeat and 3 for vigilance).
 * 10. Ensures that no element appears more than twice in sequence.img.
 * 11. Validates that every even-indexed element in sequence.type is 0 and every odd-indexed element is not 0.
 * 12. Checks that every even-indexed element in sequence.img equals the fixationImg.
 */
function validateSequence(sequence, fixationImg, targetNum, fillerNum) {
  const errors = [];

  // Validate that sequence.img and sequence.type are arrays.
  if (!Array.isArray(sequence.img) || !Array.isArray(sequence.type)) {
    errors.push("Invalid input: sequence.img and sequence.type should be arrays.");
    console.error(errors[0]);
    return errors;
  }
  
  // Ensure that both arrays have the same length.
  if (sequence.img.length !== sequence.type.length) {
    errors.push(`Array length mismatch: sequence.img length (${sequence.img.length}) and sequence.type length (${sequence.type.length}) do not match.`);
    console.error(errors[0]);
    return errors;
  }

  // Define configuration for numeric type values and their associated roles.
  // Mapping:
  //   1: target
  //   2: repeat (expected first occurrence should be a target, i.e. 1)
  //   3: filler
  //   4: vigilance (expected first occurrence should be a filler, i.e. 3)
  const typeConfig = {
    1: { label: 'target' },
    2: { label: 'repeat', expectedFirst: 1 },
    3: { label: 'filler' },
    4: { label: 'vigilance', expectedFirst: 3 }
  };

  // Initialize data containers for each role and a frequency map for sequence.img.
  const data = {
    target: { count: 0, arr: [] },
    repeat: { count: 0, arr: [] },
    filler: { count: 0, arr: [] },
    vigilance: { count: 0, arr: [] }
  };
  
  const frequency = {};

  // Single pass: iterate over the sequence arrays.
  for (let i = 0; i < sequence.type.length; i++) {
    const type = sequence.type[i]; // Numeric value
    const img = sequence.img[i];
    
    // Only record frequency for images that are not the fixationImg.
    if (img !== fixationImg) {
      frequency[img] = (frequency[img] || 0) + 1;
    }
    
    // If the type is one we track, store it in the corresponding data container.
    if (typeConfig[type] !== undefined) {
      const label = typeConfig[type].label;
      data[label].count++;
      data[label].arr.push(img);
    }
  }

  // Check that the number of targets equals targetNum.
  if (data.target.count !== targetNum) {
    errors.push(`Number of targets (1) is ${data.target.count}, but expected ${targetNum}.`);
  }
  
  // Check that the number of fillers equals fillerNum.
  if (data.filler.count !== fillerNum) {
    errors.push(`Number of fillers (3) is ${data.filler.count}, but expected ${fillerNum}.`);
  }
  
  // Check that the number of targets (1) matches the number of repeats (2).
  if (data.target.count !== data.repeat.count) {
    errors.push(`Mismatch found: number of targets (1) (${data.target.count}) does not match number of repeats (2) (${data.repeat.count}).`);
  }
  
  // Helper function: check if an array contains only unique elements.
  const checkUnique = (arr, label) => {
    if (new Set(arr).size !== arr.length) {
      errors.push(`${label} contains duplicate elements.`);
    }
  };
  
  checkUnique(data.target.arr, "targetArray");
  checkUnique(data.repeat.arr, "repeatArray");
  checkUnique(data.filler.arr, "fillerArray");
  checkUnique(data.vigilance.arr, "vigilanceArray");
  
  // Helper function: verify that two sets completely overlap.
  const setsOverlap = (setA, setB) =>
    [...setA].every(item => setB.has(item)) && [...setB].every(item => setA.has(item));

  // Check that targetArray and repeatArray completely overlap.
  const targetSet = new Set(data.target.arr);
  const repeatSet = new Set(data.repeat.arr);
  if (!setsOverlap(targetSet, repeatSet)) {
    errors.push("targetArray and repeatArray do not completely overlap.");
  }
  
  // Ensure that targetArray and fillerArray do not overlap.
  const fillerSet = new Set(data.filler.arr);
  if ([...targetSet].some(item => fillerSet.has(item))) {
    errors.push("targetArray and fillerArray have overlapping elements.");
  }
  
  // Verify that every element in vigilanceArray is present in fillerArray.
  if (!data.vigilance.arr.every(item => fillerSet.has(item))) {
    errors.push("Not all elements in vigilanceArray are present in fillerArray.");
  }
  
  // Loop through sequence.type and sequence.img to validate repeat and vigilance conditions.
  for (let i = 0; i < sequence.type.length; i++) {
    // For repeats (type 2) or vigilance (type 4), perform checks.
    if (sequence.type[i] === 2 || sequence.type[i] === 4) {
      const currentElement = sequence.img[i];
      const firstOccurrenceIndex = sequence.img.indexOf(currentElement);
      
      // If the current index is the first occurrence, then it hasn't appeared before.
      if (firstOccurrenceIndex === i) {
        errors.push(`Element "${currentElement}" at index ${i} (type ${sequence.type[i]}) does not appear earlier in sequence.img.`);
      } else {
        // For type 2 (repeat), expected first occurrence type is 1 (target).
        // For type 4 (vigilance), expected first occurrence type is 3 (filler).
        const expectedType = sequence.type[i] === 2 ? 1 : 3;
        if (sequence.type[firstOccurrenceIndex] !== expectedType) {
          errors.push(`Element "${currentElement}" at index ${i} is of type ${sequence.type[i]} but its first occurrence at index ${firstOccurrenceIndex} is not the expected type (${expectedType}).`);
        }
      }
    }
  }
  
  // Check that no element appears more than twice in sequence.img, except fixationImg.
  for (const [img, count] of Object.entries(frequency)) {
    if (count > 2) {
      errors.push(`Element "${img}" appears more than twice in sequence.img (appears ${count} times).`);
    }
  }
  
  // Validate that every odd-indexed element in sequence.type is 0 
  // and every even-indexed element is not 0.
  for (let i = 0; i < sequence.type.length; i++) {
    if (i % 2 === 0) { // even index
      if (sequence.type[i] === 0) {
        errors.push(`Element at even index ${i} in sequence.type should not be 0.`);
      }
    } else { // odd index
      if (sequence.type[i] !== 0) {
        errors.push(`Element at odd index ${i} in sequence.type should be 0 but found ${sequence.type[i]}.`);
      }
    }
  }
  
  // New Check: Ensure that every even-indexed element in sequence.img equals fixationImg.
  for (let i = 1; i < sequence.img.length; i += 2) { // iterate over even indices only
    if (sequence.img[i] !== fixationImg) {
      errors.push(`Element at even index ${i} in sequence.img should be "${fixationImg}" but found "${sequence.img[i]}".`);
    }
  }
  
  return errors;
}

/**
 * Checks the timing intervals in the given sequence.
 *
 * This function assumes that the sequence has already been validated by
 * validationSequence, so it does not perform redundant checks.
 *
 * It performs the following computations:
 * 1. Finds the index of the first repeat (type 2) and calculates the number
 *    of trials before the first repeat (divided by 2).
 * 2. For each vigilance trial (type 4), computes the interval as:
 *       (i - firstOccurrenceIndex) / 2 - 1,
 *    where i is the index of the vigilance trial and firstOccurrenceIndex is
 *    the index of the first occurrence of the corresponding image.
 *    Then, returns the minimum and maximum vigilance interval.
 * 3. For each repeat trial (type 2), computes the interval in the same way,
 *    and returns the minimum and maximum repeat interval.
 *
 * Mapping:
 *   - 1: target
 *   - 2: repeat
 *   - 3: filler
 *   - 4: vigilance
 *
 * @param {Object} sequence - An object with:
 *   - sequence.img: an array of image elements.
 *   - sequence.type: an array of numeric type values.
 * @returns {Object} An object containing:
 *   - numTrialBeforeFirstRepeat: Number of trials before the first repeat (divided by 2).
 *   - vigilance: An object with { min, max } for vigilance intervals.
 *   - repeat: An object with { min, max } for repeat intervals.
 */
function checkSequence(sequence) {
  // 1. Calculate the number of trials before the first repeat (type 2).
  const firstRepeatIndex = sequence.type.indexOf(2);
  const numTrialBeforeFirstRepeat = firstRepeatIndex / 2;

  // 2. Compute vigilance intervals for vigilance trials (type 4).
  const vigilanceIntervals = [];
  for (let i = 0; i < sequence.type.length; i++) {
    if (sequence.type[i] === 4) { // vigilance trial
      const firstOccurrenceIndex = sequence.img.indexOf(sequence.img[i]);
      const interval = (i - firstOccurrenceIndex) / 2 - 1;
      vigilanceIntervals.push(interval);
    }
  }
  const minVigilance = Math.min(...vigilanceIntervals);
  const maxVigilance = Math.max(...vigilanceIntervals);

  // 3. Compute repeat intervals for repeat trials (type 2).
  const repeatIntervals = [];
  for (let i = 0; i < sequence.type.length; i++) {
    if (sequence.type[i] === 2) { // repeat trial
      const firstOccurrenceIndex = sequence.img.indexOf(sequence.img[i]);
      const interval = (i - firstOccurrenceIndex) / 2 - 1;
      repeatIntervals.push(interval);
    }
  }
  const minRepeat = Math.min(...repeatIntervals);
  const maxRepeat = Math.max(...repeatIntervals);

  return {
    numTrialBeforeFirstRepeat,
    vigilance: { min: minVigilance, max: maxVigilance },
    repeat: { min: minRepeat, max: maxRepeat }
  };
}

/**
 * Repeats the process of creating, validating, and checking a sequence with fixation trials
 * for a given number of iterations (nRepeat). For each iteration it:
 *  1. Calculates trial numbers.
 *  2. Samples target and filler images.
 *  3. Builds the sequence (without fixations) and interleaves fixation trials.
 *  4. Validates the sequence using validateSequence; errors are collected if any occur.
 *  5. Computes timing metrics using checkSequence.
 *
 * After all iterations, it returns a summary that includes:
 *  - The minimum and maximum number of trials before the first repeat.
 *  - The overall minimum and maximum vigilance intervals.
 *  - The overall minimum and maximum repeat intervals.
 *  - The count of valid iterations versus total iterations.
 *  - An array of error messages (with iteration indices) from iterations that failed validation.
 *
 * This function assumes the following functions and global constants are available in the context:
 *  - calculateTrialNumbers(TARGETNUM, IMGBLOCKSIZE, FIRSTREPEATDELAY, VIGILANCEINTERVAL)
 *  - sampleTargetFiller(TARGETIMGSRC, FILLERIMGSRC, TARGETIMGLST, FILLERIMGLST, TARGETNUM, trialNumbers.filler)
 *  - makeSequence(TARGETIMGSRC, FILLERIMGSRC, sampled.target, sampled.filler, FIRSTREPEATDELAY, REPEATDELAY, IMGBLOCKSIZE, VIGILANCEINTERVAL, FIXEDORDER)
 *  - addFixationTrials(sequence, FIXATIONSRC, FIXATIONIMG)
 *  - validateSequence(sequenceWithFixation, FIXATIONIMG, TARGETNUM, FILLERNUM)
 *  - checkSequence(sequenceWithFixation)
 *
 * Global constants such as TARGETNUM, IMGBLOCKSIZE, FIRSTREPEATDELAY, VIGILANCEINTERVAL,
 * TARGETIMGSRC, FILLERIMGSRC, TARGETIMGLST, FILLERIMGLST, REPEATDELAY, FIXEDORDER, FIXATIONSRC,
 * FIXATIONIMG, and FILLERNUM are assumed to be defined.
 *
 * @param {number} nRepeat - The number of iterations to perform.
 * @returns {Object} A summary object containing the aggregated timing metrics and validation results.
 */
function runSequenceIterations(nRepeat) {
  // Helper function to compute the average of an array.
  const average = arr => arr.reduce((sum, x) => sum + x, 0) / arr.length;

  // Arrays to store timing metrics from each iteration.
  const numTrialBeforeFirstRepeatArr = [];
  const vigilanceMinArr = [];
  const vigilanceMaxArr = [];
  const repeatMinArr = [];
  const repeatMaxArr = [];

  // Array to collect any validation errors (with iteration index).
  const errorMessages = [];
  let validIterations = 0;

  for (let iter = 0; iter < nRepeat; iter++) {
    // 1. Calculate trial numbers.
    const trialNumbers = calculateTrialNumbers(TARGETNUM, IMGBLOCKSIZE, FIRSTREPEATDELAY, VIGILANCEINTERVAL);

    // 2. Sample target and filler images.
    const sampled = sampleTargetFiller(TARGETIMGSRC, FILLERIMGSRC, TARGETIMGLST, FILLERIMGLST, TARGETNUM, trialNumbers.filler);

    // 3. Build the sequence (without fixations) and then interleave fixation trials.
    const sequence = makeSequence(TARGETIMGSRC, FILLERIMGSRC, sampled.target, sampled.filler, FIRSTREPEATDELAY, REPEATDELAY, IMGBLOCKSIZE, VIGILANCEINTERVAL, FIXEDORDER);
    const sequenceWithFixation = addFixationTrials(sequence, FIXATIONSRC, FIXATIONIMG);

    // 4. Validate the sequence.
    const validationErrors = validateSequence(sequenceWithFixation, FIXATIONIMG, TARGETNUM, trialNumbers.filler);
    if (validationErrors.length > 0) {
      errorMessages.push({ iteration: iter, errors: validationErrors });
      // If validation fails, skip timing analysis for this iteration.
      continue;
    } else {
      validIterations++;
    }

    // 5. Calculate timing metrics using checkSequence.
    const checkResults = checkSequence(sequenceWithFixation);
    numTrialBeforeFirstRepeatArr.push(checkResults.numTrialBeforeFirstRepeat);
    vigilanceMinArr.push(checkResults.vigilance.min);
    vigilanceMaxArr.push(checkResults.vigilance.max);
    repeatMinArr.push(checkResults.repeat.min);
    repeatMaxArr.push(checkResults.repeat.max);
  }

  // Build a summary object.
  const summary = {
    minNumTrialBeforeFirstRepeat: numTrialBeforeFirstRepeatArr.length > 0 ? Math.min(...numTrialBeforeFirstRepeatArr) : null,
    maxNumTrialBeforeFirstRepeat: numTrialBeforeFirstRepeatArr.length > 0 ? Math.max(...numTrialBeforeFirstRepeatArr) : null,
    overallVigilance: {
      min: vigilanceMinArr.length > 0 ? Math.min(...vigilanceMinArr) : null,
      max: vigilanceMaxArr.length > 0 ? Math.max(...vigilanceMaxArr) : null
    },
    overallRepeat: {
      min: repeatMinArr.length > 0 ? Math.min(...repeatMinArr) : null,
      max: repeatMaxArr.length > 0 ? Math.max(...repeatMaxArr) : null
    },
    validIterations: validIterations,
    totalIterations: nRepeat,
    errorMessages: errorMessages
  };

  return summary;
}

/**
 * Renders the results summary onto the page.
 *
 * @param {Object} results - The summary object returned by runSequenceIterations.
 */
function renderResults(results) {
  // Create a container element for the results.
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';
  
  // Build the inner HTML with the results.
  container.innerHTML = `
    <h2>Sequence Iteration Results</h2>
    <p><strong>Total Iterations:</strong> ${results.totalIterations}</p>
    <p><strong>Valid Iterations:</strong> ${results.validIterations}</p>
    <h3>Trials Before First Repeat</h3>
    <p><strong>Min:</strong> ${results.minNumTrialBeforeFirstRepeat}</p>
    <p><strong>Max:</strong> ${results.maxNumTrialBeforeFirstRepeat}</p>
    <h3>Vigilance Intervals</h3>
    <p><strong>Min:</strong> ${results.overallVigilance.min}</p>
    <p><strong>Max:</strong> ${results.overallVigilance.max}</p>
    <h3>Repeat Intervals</h3>
    <p><strong>Min:</strong> ${results.overallRepeat.min}</p>
    <p><strong>Max:</strong> ${results.overallRepeat.max}</p>
  `;
  
  // If there are any validation errors, render them as well.
  if (results.errorMessages && results.errorMessages.length > 0) {
    container.innerHTML += `<h3>Validation Errors</h3>`;
    results.errorMessages.forEach(errObj => {
      container.innerHTML += `<p>Iteration ${errObj.iteration}: ${errObj.errors.join('; ')}</p>`;
    });
  }
  
  // Append the container to the body.
  document.body.appendChild(container);
}

