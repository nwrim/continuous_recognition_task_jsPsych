# Overview

This repository contains an implementation of the **Continuous Recognition Task**, a commonly used paradigm to measure the memorability of images, built using [jsPsych](https://www.jspsych.org/) (version 6.3.1). It is based on the original JavaScript implementation by Dr. Wilma Bainbridge (available [here](https://www.wilmabainbridge.com/makeexperiments.html)) and extends it with additional functionality and flexibility.

# Quick Start Example

You can try out an example version of the task by visiting [here](https://nwrim.github.io/continuous_recognition_task_jsPsych/example/example.html), or by opening the HTML file `example/example.html` after cloning the repository. This example file can also serve as a good starting point for configuring the task to fit your needs (see parameter descriptions below).

The example stimuli are from the [One Million Impressions (OMI) Dataset](https://github.com/jcpeterson/omi). All images are synthetic faces generated using [StyleGAN2](https://github.com/NVlabs/stylegan2) and do not depict real individuals.

# Parameters for buildTimeline()

In this task, participants are shown a continuous stream of images, with one image presented at a time. Each image is displayed using the `image-keyboard-response` plugin from jsPsych. The main function, `buildTimeline()`, dynamically constructs a sequence of image-keyboard-response trials, adhering to specific presentation rules controlled by parameters described below.

## Stimuli and Related Parameters

To run the experiment, you must define three types of images: **target images**, **filler images**, and a **fixation image**.

### 🎯 Target & Filler Images
* **Target images** are the images for which you want to measure the memorability. Set them using the following parameters:
  * `targetImgSrc` (string): The base path to the target images. This portion will *not* be saved in the results.
  * `targetImgLst` (Array): A list of target image filenames. This portion *will* be saved in the results.
* **Filler images** are the images for which you do not want to measure the memorability. You can provide them in two ways:
  1. If you have a separate set of filler images, you can set them using the following parameters:
    * `fillerImgSrc` (string): The base path to the filler images. This portion will *not* be saved in the results
    * `fillerImgLst` (Array): A list of filler image filenames. This portion *will* be saved in the results.
  2. If you'd like to use the non-selected target images as fillers:
    * Set the `fillerImgSrc` as identical to the `targetImgSrc`.
    * Set the `fillerImgLst` as an empty array ([]).
* **Image dimensions** (for **both** target and filler images) are controlled via:
  * `imgWidth` (number): Width of the images, passed to the `stimulus_width` parameter in the `image-keyboard-response` plugin.
  * `imgHeight` (number): Height of the images, passed to the `stimulus_height` parameters in the `image-keyboard-response` plugin.
> [!TIP]
> If your `targetImgLst` or `fillerImgLst` arrays are long, consider loading them from a separate JavaScript file for readability. Scripts are provided to help generate such a file: `scripts/01_create_stimuli_js.html` and `scripts/01_create_stimuli_js.py`. See the README in the `scripts/` folder for details.

### ➕ Fixation Image
* The fixation image appears during the inter-stimulus interval (ISI), shown between image trials. Set it using the following parameters:
  * `fixationSrc` (string): The base path to the fixation image. This portion will *not* be saved in the results.
  * `fixationImg` (string): The filename of the fixation image. This portion *will* be saved in the results.
  * `fixationWidth` (number): Width of the fixation images, passed to the `stimulus_width` parameter in the `image-keyboard-response` plugin
  * `fixationHeight` (number): Height of the fixation images, passed to the `stimulus_height` parameters in the `image-keyboard-response` plugin.

## Task Setup and Related Parameters

### 📘 Instructions
* Before the task begins, participants will see an instruction screen. Set the instruction text using the following parameter: 
  * `instructions` (string): A string containing the instruction message shown to participants. This is passed to the `stimulus` parameter in the `html-keyboard-response` plugin. You can include HTML formatting in this string for styling.
> [!TIP] 
> Participants must press one of the valid response keys to proceed (even when `recordAllKeys` is `true`). Be sure to specify which key(s) to press in the instructions.

### 🎯 Number of Target Images
One of the most important parameters in the task is the **number of target images** assigned to each participant. This influences several key aspects of your study, including:
* Task duration per participant
* The number of participants needed to collect enough memorability data per image
Set this using:
  * `targetNum` (number): The number of target images to sample from `targetImgLst`
> [!TIP] 
> The number of filler images is automatically calculated based on your task parameters. You can use the file `scripts/00_calculate_num_trials.html` to determine the minimum number of filler images required.

### ⌨️ Response key
* You can configure how participants respond to repeated images using the following parameters:
  * `recordAllKeys` (boolean): If set to `true`, all key presses are recorded. If `false`, only key presses listed in `choiceKeys` are recorded.
  * `choiceKeys` (Array): An array of valid response keys, passed to the `choices` parameter in `image-keyboard-response` plugin. Ignored if `recordAllKeys` is `true`.

### 🕒 Stimulus duration and ISI
* Image trials (where a target or filler image is shown) alternate with fixation trials (where the fixation image is shown) throughout the task. The duration of each trial type is controlled by the following parameters:
  * `stimTime` (number): Duration (in milliseconds) that each stimulus image (target or filler) is displayed. Passed to the `trial_duration` parameter of the `image-keyboard-response` plugin.
  * `isi` (number): Duration (in milliseconds) of each fixation trial (i.e., the inter-stimulus interval). Also passed to the `trial_duration` parameter of the `image-keyboard-response` plugin.

## Sequence Creation and Related Parameters

### 🧱 Block structure
Images are presented in **pseudo-random order** using a **block design**. Each block contains (the order is shuffled every block):
* **One target image presented for the first time**, until all target images are shown at least once.
* **One repeated target image**, after `firstRepeatDelay` blocks have passed (see below)
* **One repeated filler image** (from the **previous block**), for every `vigilanceInterval` block (see below)
* All remaining images in the block are **filler images presented for the first time**
> [!Note] 
> The blocks are not displayed or referenced to participants during the task. This structure is used only internally to organize the trial sequence.

* The number of images per block is controlled by:
  * `imgBlockSize` (number): Total number of trials (i.e., images) in each block. Must be **greater than or equal to 3**.

### 🔁 Target Repeat
There are two methods for determining **how target images are repeated**:
1. **Fixed Order**: Target images are repeated in the same order they were initially shown. For example, if target image 1 appears before target image 2, then it will also be repeated before image 2 is repeated. The delay between first presentation and repeat remains relatively consistent (i.e., same number of blocks in between).
2. **Random Order**: Target images are repeated in a random order, as long as a minimum number of blocks (repeatDelay) has passed since their first appearance.
* The parameter: 
  * `fixedOrder` (boolean): Controls which repeat method is used.
    * If `true`, target repeats occur in the original presentation order (**Option 1**).
    * If `false`, target repeats are randomized with a minimum delay between presentations (**Option 2**).
  * `firstRepeatDelay` (number): How many blocks to wait before starting target repeats.
    * For example, if `firstRepeatDelay = 5`, the first target repeat occurs in **block 6**.
    * If `fixedOrder = true`, this delay establishes a fixed spacing between first and second presentations for **all** target images:
      * For example, if `firstRepeatDelay = 5`, a target first shown in block 1 will be repeated in block 6. If first shown in block 2, it will be repeated in block 7, and so on.
      * This results in a consistent number of intervening blocks (e.g., 4 blocks between original and repeat).
  * `minRepeatDelay` (number): The **minimum** number of blocks between a target’s first presentation and its repeat.
    * Only used when `fixedOrder = false`. Ignored if `fixedOrder = true`.
    * Must be less than `firstRepeatDelay`.
    * For example, if `fixedOrder = false`, `firstRepeatDelay = 8` and `minRepeatDelay = 4`, then:
      * Repeats start in block 9 (the first block after `firstRepeatDelay` has passed).
      * In block 9, one of the eligible target images that hasn't been repeated and presented at least 5 blocks before (target images shown in block 1, 2, 3, 4) will be randomly selected to be repeated.
      * The order of repeats may differ from the order of first presentations.
> [!Note]
> Option 2 (`fixedOrder=false`) was not part of the original implementation by Dr. Wilma Bainbridge. 
> Many memorability works (e.g., Isola et al., 2013, *PAMI*) also used the relatively fixed interval for target repeats.

### 👁️ Vigilance Repeat
* In addition to target repeats, the task includes vigilance repeats, which serve as attention checks. These involve repeating a **filler image** from the **previous block**.
  * `vigilanceInterval` (number): How frequently vigilance repeats occur, in blocks.
    * For example, if `vigilanceInterval = 4`, a vigilance repeat will occur every fourth block.

# Output of `buildTimeline()` and `extractResults()`
* `buildTimeline()` returns:
  * `timeline`: Array of jsPsych trial objects. This should be passed as the `timeline` parameter in `jsPsych.init()`.
  * `img`: Array of image filenames (with fixation trials interleaved). Note that this does *not* include the base path. 
  * `type`: Array of numeric trial type codes corresponding to each stimulus trial (including fixation trials). The codes are:
    * 1: New target presentation.
    * 2: Target repeat.
    * 3: New filler presentation.
    * 4: Vigilance repeat.
* You can also use the `extractResults()` function in the `on_finish` callback when calling `jsPsych.init()` (e.g., `var results = extractResults(jsPsych.data.get().values());`). This function returns:
  * `rt`: Array of reaction times.
  * `keyPress`: Array of key press responses.
* The rest of the code described below assumes that the arrays (except `timeline`) are converted to strings (via `toString()`) for ease of saving the output.

# Validating Interval Structure from Parameters
You can verify that your chosen parameters produce the expected intervals using functions in `jspsych-continuous-recognition-task-validation.js`. An example html file to do this is at `example/validation.html`.

# Saving the Data
This repository does not include built-in functionality for saving experiment output, as saving methods can vary significantly depending on your deployment environment (e.g., local, server, cloud platform).

In our lab, we typically convert the relevant output arrays to strings (see above) and save them in CSV format, with one row per participant. You are free to adapt this approach or implement your own saving mechanism depending on your needs (e.g., using jsPsych.data.get().csv(), sending data to a backend server, or integrating with survey platforms).

# Transforming the data to BIDS format
* `scripts/02_to_bids.py` transforms the experiment output into a human-readable, trial-level `.tsv` file that follows the [BIDS](https://bids.neuroimaging.io/index.html) format. See the README in the `scripts/` folder for more details.
* See [here](https://osf.io/k8snr) for example data transformed using this script.
 
# Calculating the memorability metrics from the BIDS formatted data
* `scripts/03_calculate_metrics.py` processes BIDS-formatted data from the Continuous Recognition Task to compute image-level performance metrics such as hit rate (HR), false alarm rate (FAR), and corrected recognition rate (CRR). It also applies basic exclusion criteria to remove participants with unreliable responses. See the README in the `scripts/` folder for more details.
* See [here](https://github.com/nwrim/naturalness_compression_memorability/blob/main/data/image_level_measure/set3_memorability.csv) for example output of the script.

# 📚 Citation

If you use this implementation of the continuous recognition task in a scientific publication, we would appreciate citations to the following preprint:

Rim, N., Veillette, J., Lee, S., Kardan, O., Krishnan, S., Bainbridge, W. A., & Berman, M. (2025, May 15). Natural scenes are more compressible and less memorable than human-made scenes. https://doi.org/10.31234/osf.io/xw3ek_v1

Bibtex entry:

```bibtex
@misc{rim_veillette_lee_kardan_krishnan_bainbridge_berman_2025,
 title={Natural scenes are more compressible and less memorable than human-made scenes},
 url={osf.io/preprints/psyarxiv/xw3ek_v1},
 DOI={10.31234/osf.io/xw3ek_v1},
 publisher={PsyArXiv},
 author={Rim, Nakwon and Veillette, John and Lee, Sunny and Kardan, Omid and Krishnan, Sanjay and Bainbridge, Wilma A and Berman, Marc},
 year={2025},
 month={May}
}
```
