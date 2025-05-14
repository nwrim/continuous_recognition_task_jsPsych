/**
 * Shuffle array in-place using Durstenfeld shuffle algorithm.
 * This function modifies the array in place.
 * Based on https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 *
 * @param {Array} array - The array to be shuffled.
 * @throws {Error} If the input is not an array.
 */
function shuffleArray(array) {
  if (!Array.isArray(array)) {
      throw new Error("Invalid input: Expected an array.");
  }

  // Durstenfeld shuffle
  for (var i = array.length - 1; i >= 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}

/**
 * Shuffles multiple arrays in unison using the Durstenfeld shuffle algorithm.
 * This function modifies the arrays in place, ensuring that corresponding elements 
 * across arrays remain in the same order after shuffling.
 * Based on https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 *
 * @param {Array[]} arrays - An array containing multiple subarrays of equal length.
 * @throws {Error} If input is not an array of arrays or if subarrays have different lengths.
 */
function shuffleArrays(arrays) {
  if (!Array.isArray(arrays) || arrays.length === 0 || !arrays.every(Array.isArray)) {
      throw new Error("Invalid input: Expected an array of arrays.");
  }

  var arrayLength = arrays[0].length;
  
  // Ensure all arrays have the same length
  for (var k = 1; k < arrays.length; k++) {
      if (arrays[k].length !== arrayLength) {
          throw new Error("All arrays must have the same length.");
      }
  }

  // Durstenfeld shuffle
  for (var i = arrayLength - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      for (var arrayIndex = 0; arrayIndex < arrays.length; arrayIndex++) {
          var temp = arrays[arrayIndex][i];
          arrays[arrayIndex][i] = arrays[arrayIndex][j];
          arrays[arrayIndex][j] = temp;
      }
  }
}

/**
 * Samples items from an array by shuffling and selecting the top N items.
 * Allows for multiple sample groups with specified sizes.
 *
 * @param {Array} items - An array of items to sample from.
 * @param {number[]} sample_sizes - An array of sample sizes indicating how many items to select for each group.
 * @returns {Array} - A list of arrays, each containing a group of sampled items.
 * @throws {Error} If items is not an array, if sample_sizes contains invalid values (including 0), or if the sum of sample_sizes exceeds the length of the items array.
 */
function sampleItems(items, sample_sizes) {
  if (!Array.isArray(items)) {
      throw new Error("Invalid input: items should be an array.");
  }
  if (!Array.isArray(sample_sizes) || sample_sizes.some(size => typeof size !== 'number' || size <= 0)) {
      throw new Error("Invalid input: sample_sizes should be an array of positive numbers.");
  }

  // Check if the sum of sample_sizes exceeds the length of items
  var totalSampleSize = sample_sizes.reduce((sum, size) => sum + size, 0);
  if (totalSampleSize > items.length) {
      throw new Error("Total sample size exceeds the number of items in the array.");
  }

  shuffleArray(items); // Shuffle the original array

  var result = [];
  var currentIndex = 0;

  for (var i = 0; i < sample_sizes.length; i++) {
      var sampleSize = sample_sizes[i];
      result.push(items.slice(currentIndex, currentIndex + sampleSize));
      currentIndex += sampleSize;
  }

  return result;
}

/**
 * Calculates the number of each type of trial based on provided parameters.
 *
 * @param {number} targetNum - Number of target images.
 * @param {number} imgBlockSize - Total number of trials per image block.
 * @param {number} firstRepeatDelay - Number of blocks to wait before starting target repeats.
 * @param {number} vigilanceInterval - Interval (in blocks) at which a vigilance trial is inserted.
 * @returns {Object} An object containing:
 *   - total: Total number of trials.
 *   - target: Number of target trials.
 *   - repeat: Number of target repeat trials.
 *   - filler: Number of filler trials.
 *   - vigilance: Number of vigilance trials.
 */
function calculateTrialNumbers(targetNum, imgBlockSize, firstRepeatDelay, vigilanceInterval) {
  // Calculate total number of blocks as the sum of the number of target images and the initial delay.
  var totalBlockNum = targetNum + firstRepeatDelay;
  // Total number of trials is the number of blocks multiplied by the number of trials per block.
  var totalTrialNum = totalBlockNum * imgBlockSize;
  // The number of target and repeat trials equals the number of target images.
  var targetTrialNum = targetNum;
  var repeatTrialNum = targetNum;
  // Compute the number of vigilance trials based on the vigilance interval.
  var vigilanceTrialNum = Math.floor(totalBlockNum / vigilanceInterval);
  // Special adjustment: if vigilanceInterval is 1, decrement the vigilance count by one.
  if (vigilanceInterval === 1) {
    vigilanceTrialNum--;
  }
  // Filler trials are calculated as the remaining trials after subtracting target, repeat, and vigilance trials.
  var fillerTrialNum = totalTrialNum - targetTrialNum - repeatTrialNum - vigilanceTrialNum;
  
  return {
    total: totalTrialNum,
    target: targetTrialNum,
    repeat: repeatTrialNum,
    filler: fillerTrialNum,
    vigilance: vigilanceTrialNum,
  };
}

/**
 * Samples images from target and filler image lists based on whether they share the same source.
 *
 * If the `targetImgSrc` and `fillerImgSrc` are the same, both target and filler images 
 * are sampled from `targetImgLst`. Otherwise, target images are sampled from `targetImgLst`, 
 * and filler images are sampled separately from `fillerImgLst`.
 *
 * @param {string} targetImgSrc - The source identifier for the target images.
 * @param {string} fillerImgSrc - The source identifier for the filler images.
 * @param {string[]} targetImgLst - List of available target images.
 * @param {string[]} fillerImgLst - List of available filler images.
 * @param {number} targetNum - Number of target images to sample.
 * @param {number} fillerNum - Number of filler images to sample.
 * @returns {Object} An object containing:
 *   - target: the sampled targets
 *   - filler: the sampled fillers
 */
function sampleTargetFiller(targetImgSrc, fillerImgSrc, targetImgLst, fillerImgLst, targetNum, fillerNum) {
  var targetSampled, fillerSampled;

  if (targetImgSrc === fillerImgSrc) {
      [targetSampled, fillerSampled] = sampleItems(targetImgLst, [targetNum, fillerNum]);
  } else {
      targetSampled = sampleItems(targetImgLst, [targetNum])[0];
      fillerSampled = sampleItems(fillerImgLst, [fillerNum])[0];
  }

  return {
    target: targetSampled,
    filler: fillerSampled
  };
}

/**
 * Generates a sequence of image stimuli for a jsPsych timeline.
 *
 * @param {string} targetImgSrc - Base path for target images.
 * @param {string} fillerImgSrc - Base path for filler images.
 * @param {Array} targetImgLst - List of target image filenames.
 * @param {Array} fillerImgLst - List of filler image filenames.
 * @param {number} firstRepeatDelay - Number of blocks to wait before starting target repeats.
 * @param {number} minRepeatDelay - Minimum delay (in blocks) between showing a target and its repeat.
 * @param {number} imgBlockSize - Total number of trials per image block.
 * @param {number} vigilanceInterval - Interval (in blocks) at which a vigilance trial is inserted.
 * @param {boolean} fixedOrder - If true, target repeats occur in the original order; otherwise, they are randomized.
 * @returns {Object} An object containing:
 *   - stim: Array of stimulus objects for the jsPsych timeline.
 *   - img: Array of the corresponding image filenames.
 *   - type: Array of numeric trial type codes.
 */
function makeSequence(targetImgSrc, fillerImgSrc, targetImgLst, fillerImgLst, firstRepeatDelay, minRepeatDelay, imgBlockSize, vigilanceInterval, fixedOrder) {
  // --- Input Validation ---
  if (!Array.isArray(targetImgLst) || targetImgLst.length === 0) {
    throw new Error("targetImgLst must be a non-empty array.");
  }
  if (!Array.isArray(fillerImgLst) || fillerImgLst.length === 0) {
    throw new Error("fillerImgLst must be a non-empty array.");
  }
  if (typeof firstRepeatDelay !== 'number' || firstRepeatDelay < 0) {
    throw new Error("firstRepeatDelay must be a non-negative number.");
  }
  if (typeof imgBlockSize !== 'number' || imgBlockSize < 3) {
    throw new Error("imgBlockSize must be a number greater than or equal to 3.");
  }
  if (typeof vigilanceInterval !== 'number' || vigilanceInterval < 0) {
    throw new Error("vigilanceInterval must be a non-negative number.");
  }
  if (typeof fixedOrder !== 'boolean') {
    throw new Error("fixedOrder must be a boolean.");
  }
  if (!fixedOrder && (typeof minRepeatDelay !== 'number' || minRepeatDelay < 0 || minRepeatDelay >= firstRepeatDelay)) {
    throw new Error("minRepeatDelay must be a non-negative number smaller than firstRepeatDelay.");
  }
  
  // --- Trial Type Constants ---
  var TARGET = 1;    // New target presentation.
  var REPEAT = 2;    // Target repeat.
  var FILLER = 3;    // Filler image.
  var VIGILANCE = 4; // Vigilance trial.

  // --- Overall Sequences ---
  var stimuliSequence = []; // Stimulus objects for the timeline.
  var imgSequence = [];     // Image filenames.
  var typeSequence = [];    // Numeric trial type codes.
  
  // --- State Variables ---
  var previousBlockFillers = []; // Fillers from the previous block (for vigilance trials).
  var targetIdx = 0;             // Index for new target images.
  var fillerIdx = 0;             // Index for filler images.
  var repeatIdx = 0;             // Index for target repeats.
  var blockIdx = 1;              // Block counter. Starts at 1 to avoid vigilance in the first block.
  
  // For non-fixed order, arrays to manage target repeat timing.
  var targetShown = fixedOrder ? null : [];
  var targetReadyToRepeat = fixedOrder ? null : [];
  
  /**
   * Adds a filler trial to the current block arrays.
   *
   * Edge-Case Handling: If the filler image list is exhausted, an error is thrown.
   *
   * @param {Array} blockStimuli - Array for stimulus objects.
   * @param {Array} imblock - Array for image filenames.
   * @param {Array} typeblock - Array for trial type codes.
   */
  function addFillerTrial(blockStimuli, imblock, typeblock) {
    if (fillerIdx >= fillerImgLst.length) {
      throw new Error("Not enough filler images provided.");
    }
    blockStimuli.push({
      stimulus: fillerImgSrc + fillerImgLst[fillerIdx],
      trial_type: 'FILLER'
    });
    imblock.push(fillerImgLst[fillerIdx]);
    typeblock.push(FILLER);
    previousBlockFillers.push(fillerImgLst[fillerIdx]);
    fillerIdx++;
  }
  
  /**
   * Adds a target repeat trial to the current block arrays.
   *
   * For fixedOrder, the repeat is in sequence; otherwise, a random target is chosen.
   *
   * @param {Array} blockStimuli - Array for stimulus objects.
   * @param {Array} imblock - Array for image filenames.
   * @param {Array} typeblock - Array for trial type codes.
   */
  function addRepeatTrial(blockStimuli, imblock, typeblock) {
    if (fixedOrder) {
      blockStimuli.push({
        stimulus: targetImgSrc + targetImgLst[repeatIdx],
        trial_type: 'REPEAT'
      });
      imblock.push(targetImgLst[repeatIdx]);
    } else {
      shuffleArray(targetReadyToRepeat);
      var targetImage = targetReadyToRepeat.pop();
      blockStimuli.push({
        stimulus: targetImgSrc + targetImage,
        trial_type: 'REPEAT'
      });
      imblock.push(targetImage);
    }
    typeblock.push(REPEAT);
    repeatIdx++;
  }
  
  /**
   * Adds a new target trial to the current block arrays.
   *
   * For non-fixed order, the target is stored for a later repeat.
   *
   * @param {Array} blockStimuli - Array for stimulus objects.
   * @param {Array} imblock - Array for image filenames.
   * @param {Array} typeblock - Array for trial type codes.
   */
  function addNewTargetTrial(blockStimuli, imblock, typeblock) {
    blockStimuli.push({
      stimulus: targetImgSrc + targetImgLst[targetIdx],
      trial_type: 'TARGET'
    });
    imblock.push(targetImgLst[targetIdx]);
    typeblock.push(TARGET);
    if (!fixedOrder) {
      targetShown.push(targetImgLst[targetIdx]);
    }
    targetIdx++;
  }
  
  /**
   * Adds a vigilance trial to the current block arrays.
   *
   * A random filler image from the previous block is chosen.
   *
   * @param {Array} blockStimuli - Array for stimulus objects.
   * @param {Array} imblock - Array for image filenames.
   * @param {Array} typeblock - Array for trial type codes.
   */
  function addVigilanceTrial(blockStimuli, imblock, typeblock) {
    shuffleArray(previousBlockFillers);
    blockStimuli.push({
      stimulus: fillerImgSrc + previousBlockFillers[0],
      trial_type: 'VIGILANCE'
    });
    imblock.push(previousBlockFillers[0]);
    typeblock.push(VIGILANCE);
    previousBlockFillers = [];
  }
  
  /**
   * Generates a single block of trials.
   *
   * This function builds the block by adding:
   *   1. A vigilance trial (if required) or a regular filler.
   *   2. A target repeat trial (if the block index is past the firstRepeatDelay) or a filler.
   *   3. A new target trial (if available) or a filler.
   *   4. Additional filler trials until the block reaches imgBlockSize.
   *
   * The block arrays are then shuffled and appended to the overall sequences.
   */
  function generateBlock() {
    var blockStimuli = [];
    var imblock = [];
    var typeblock = [];
    
    // For non-fixed order: update targetReadyToRepeat if the repeat delay has passed.
    if (!fixedOrder && blockIdx > minRepeatDelay + 1 && targetShown.length > 0) {
      targetReadyToRepeat.push(targetShown.shift());
    }
    
    // --- Trial 1: Vigilance or Filler ---
    if (previousBlockFillers.length > 0 && blockIdx % vigilanceInterval === 0) {
      addVigilanceTrial(blockStimuli, imblock, typeblock);
    } else {
      // Reset previous fillers and add a regular filler trial.
      previousBlockFillers = [];
      addFillerTrial(blockStimuli, imblock, typeblock);
    }
    
    // --- Trial 2: Target Repeat or Filler ---
    if (blockIdx > firstRepeatDelay) {
      addRepeatTrial(blockStimuli, imblock, typeblock);
    } else {
      addFillerTrial(blockStimuli, imblock, typeblock);
    }
    
    // --- Trial 3: New Target or Filler ---
    if (targetIdx < targetImgLst.length) {
      addNewTargetTrial(blockStimuli, imblock, typeblock);
    } else {
      addFillerTrial(blockStimuli, imblock, typeblock);
    }
    
    // --- Fill Remaining Trials ---
    while (blockStimuli.length < imgBlockSize) {
      addFillerTrial(blockStimuli, imblock, typeblock);
    }
    
    // Randomize order within the block.
    shuffleArrays([blockStimuli, imblock, typeblock]);
    
    // Append the block to the overall sequences.
    stimuliSequence = stimuliSequence.concat(blockStimuli);
    imgSequence = imgSequence.concat(imblock);
    typeSequence = typeSequence.concat(typeblock);
  }
  
  // --- Main Loop: Build Blocks Until All Target Repeats Have Been Done ---
  while (repeatIdx < targetImgLst.length) {
    generateBlock();
    blockIdx++;
  }
  
  return {
    stim: stimuliSequence,
    img: imgSequence,
    type: typeSequence
  };
}

/**
 * Inserts fixation trials after every stimulus trial in the given sequences.
 *
 * @param {Object} An object containing:
 *   - stim: Array of stimulus objects for the jsPsych timeline.
 *   - img: Array of the corresponding image filenames.
 *   - type: Array of numeric trial type codes.
 * @param {string} fixationSrc - Base path for the fixation image.
 * @param {string} fixationImg - Filename for the fixation image.
 * @returns {Object} An object containing three elements:
 *   - stim: Array of stimulus objects for the jsPsych timeline, with fixation trials interleaved.
 *   - img: Array of the corresponding image filenames, with fixation trials interleaved.
 *   - type: Array of numeric trial type codes, with fixation trials interleaved.
 *
 */
function addFixationTrials(sequence, fixationSrc, fixationImg) {
  // --- Input Validation ---
  if (!Array.isArray(sequence.stim) || !Array.isArray(sequence.img) || !Array.isArray(sequence.type)) {
    throw new Error("sequence.stim, sequence.img, and sequence.type must be arrays.");
  }
  if (typeof fixationImg !== 'string' || fixationImg === '') {
    throw new Error("fixationImg must be a non-empty string.");
  }

  // --- Trial Type Constants ---
  var FIXATION = 0;
  var fixationSrcImg = fixationSrc + fixationImg;
  
  // Initialize full sequences.
  var fullStimuliSequence = [];
  var fullImgSequence = [];
  var fullTypeSequence = [];

  // Loop over each trial in the original sequences.
  for (var i = 0; i < sequence.stim.length; i++) {
    // Add the original stimulus.
    fullStimuliSequence.push(sequence.stim[i]);
    fullImgSequence.push(sequence.img[i]);
    fullTypeSequence.push(sequence.type[i]);
    
    // Insert a fixation trial immediately after.
    fullStimuliSequence.push({
      stimulus: fixationSrcImg,
      trial_type: 'FIXATION'
    });
    fullImgSequence.push(fixationImg);
    fullTypeSequence.push(FIXATION);
  }
  
  return {
    stim: fullStimuliSequence,
    img: fullImgSequence,
    type: fullTypeSequence
  };
}

/**
 * Builds a jsPsych timeline by sampling images, creating a sequence with fixation trials interleaved,
 * and then converting these into jsPsych trial objects.
 *
 * @param {string} targetImgSrc - Base path for target images.
 * @param {string} fillerImgSrc - Base path for filler images.
 * @param {Array} targetImgLst - List of target image filenames.
 * @param {Array} fillerImgLst - List of filler image filenames.
 * @param {number} targetNum - Number of target images to sample.
 * @param {number} fillerNum - Number of filler images to sample.
 * @param {number} firstRepeatDelay - Number of blocks to wait before starting target repeats.
 * @param {number} minRepeatDelay - Minimum Delay (in blocks) between showing a target and its repeat.
 * @param {number} imgBlockSize - Total number of trials per image block.
 * @param {number} vigilanceInterval - Interval (in blocks) at which a vigilance trial is inserted.
 * @param {boolean} fixedOrder - If true, target repeats occur in the original order; otherwise, randomized.
 * @param {string} fixationSrc - Base path for the fixation image.
 * @param {string} fixationImg - Filename for the fixation image.
 * @param {string} instructions - Instruction text for the participant.
 * @param {Array} choiceKeys - Array of valid response keys.
 * @param {boolean} recordAllKeys - If true, all keys are recorded; otherwise, only valid choices.
 * @param {number} imgWidth - Width for non-fixation images.
 * @param {number} imgHeight - Height for non-fixation images.
 * @param {number} fixationWidth - Width for fixation images.
 * @param {number} fixationHeight - Height for fixation images.
 * @param {number} isi - Inter-stimulus interval (duration of fixation trials).
 * @param {number} stimTime - Duration of stimulus presentation.
 * @returns {Object} An Object containing three elements:
 *   - timeline: Array of jsPsych timeline trials.
 *   - img: Array of image filenames with fixation trials interleaved.
 *   - type: Array of numeric trial type codes with fixation trials interleaved.
 */
function buildTimeline(targetImgSrc, fillerImgSrc, targetImgLst, fillerImgLst, targetNum,
  firstRepeatDelay, minRepeatDelay, imgBlockSize, vigilanceInterval, fixedOrder, fixationSrc, fixationImg,
  instructions, choiceKeys, recordAllKeys, imgWidth, imgHeight, fixationWidth, fixationHeight, isi, stimTime) {
  
  // Calculate the number of each type of trial.
  var trialNumbers = calculateTrialNumbers(targetNum, imgBlockSize, firstRepeatDelay, vigilanceInterval);

  // Sample target and filler images.
  var sampled = sampleTargetFiller(targetImgSrc, fillerImgSrc, targetImgLst, fillerImgLst, targetNum, trialNumbers.filler);

  // Build the sequence of trials without fixations.
  var sequence = makeSequence(targetImgSrc, fillerImgSrc, sampled.target, sampled.filler, firstRepeatDelay, minRepeatDelay, imgBlockSize, vigilanceInterval, fixedOrder);

  // Interleave fixation trials.
  var sequenceWithFixation = addFixationTrials(sequence, fixationSrc, fixationImg);

  // Initialize timeline and add preloading, fullscreen, and instruction trials.
  var timeline = [];

  timeline.push({
    type: "preload",
    auto_preload: true
  });

  timeline.push({
    type: "fullscreen",
    fullscreen_mode: true
  });

  timeline.push({
    type: "html-keyboard-response",
    stimulus: instructions,
    choices: choiceKeys,
    response_ends_trial: true
  });

  /**
   * Helper function to build a trial object.
   *
   * @param {Object} trial - An object from fullStimuliSequence containing a stimulus and trial_type.
   * @returns {Object} A jsPsych trial object.
   */
  function createTrial(trial) {
    var isFixation = (trial.trial_type === 'FIXATION');
    var trialObj = {
      type: "image-keyboard-response",
      stimulus: trial.stimulus,
      stimulus_width: isFixation ? fixationWidth : imgWidth,
      stimulus_height: isFixation ? fixationHeight : imgHeight,
      trial_duration: isFixation ? isi : stimTime,
      response_ends_trial: false,
      data: { task: trial.trial_type }
    };
    // When not recording all keys, restrict valid response keys.
    if (!recordAllKeys) {
      trialObj.choices = choiceKeys;
    }
    return trialObj;
  }

  // Loop through the full sequence and build timeline trials.
  for (var i = 0; i < sequenceWithFixation.stim.length; i++) {
    timeline.push(createTrial(sequenceWithFixation.stim[i]));
  }

  return {
    timeline: timeline,
    img: sequenceWithFixation.img,
    type: sequenceWithFixation.type
  };
}

/**
 * Extracts reaction times (RT) and key press responses from jsPsych data.
 *
 * @param {Array} jspsychData - Array of trial objects produced by jsPsych.
 * @returns {Object} An object containing:
 *   - rt: Array of reaction times.
 *   - keyPress: Array of key press responses.
 *
 * Note: Only trials with trial_type 'image-keyboard-response' are processed.
 */
function extractResults(jspsychData) {
  var rtSequence = [];
  var keyPressSequence = [];

  for (var i = 0; i < jspsychData.length; i++) {
    // Process only image-keyboard-response trials (skip, e.g., fullscreen trials)
    if (jspsychData[i].trial_type === 'image-keyboard-response') {
      rtSequence.push(jspsychData[i].rt);
      if (jspsychData[i].response === ',') {
        keyPressSequence.push('COMMA');
      }
      else {
        keyPressSequence.push(jspsychData[i].response);
      }
    }
  }

  return {
    rt: rtSequence,
    keyPress: keyPressSequence
  };
}
