These utility scripts are not required to run the Continuous Recognition Task but can assist with setup, data conversion, and analysis.

# Calculating the number of trials/number of images needed
`scripts/00_calculate_num_trials.html` gives you the number of total/target/repeat/filler/vigilance trials, and how many images you need based on the parameters you provide.

# `stimuli.js` Creation
1. `scripts/01_create_stimuli_js.html`
    - Open the file in a web browser.
    - Select the folder that contains the target and (optionally) filler images.
    - Click "Generate & Download stimuli.js" to download the `stimuli.js` file.
2. `scripts/01_create_stimuli_js.py`
    - Run using:
        ```sh
        python scripts/01_create_stimuli_js.py --target_dir path/to/target --output_dir path/to/output
        ```
    - To include filler images, add:
        ```sh
        python scripts/01_create_stimuli_js.py --target_dir path/to/target --filler_dir path/to/filler --output_dir path/to/output
        ```
    - If the specified output directory doesn’t exist, it will be created automatically.

> [!WARNING]  
> I have only used the python script (`scripts/01_create_stimuli_js.py`) in running the experiment. While the HTML/javascript script (`scripts/00_create_stimuli_js.html`) is added here in case people who are not familiar with python/cli find it useful, please verify that the generated `stimuli.js` file is correct before using. If you find errors, please report them via the Issues page.

# Transforming to BIDS format
* `scripts/02_to_bids.py` transforms raw jsPsych output into a human-readable, trial-level `.tsv` file following the [BIDS](https://bids.neuroimaging.io/) format.
  * Arguments:
    * `--raw_data_path` (string): Path to the raw CSV file containing jsPsych output. The CSV should have one row per participant, with columns:
      * imSeqString: `img` from `buildTimeline()` function, converted to a comma-separated string using `.toString()` (in JavaScript).
      * typeSeqString: `type` from `buildTimeline()` function, converted to a comma-separated string using `.toString()` (in JavaScript).
      * keyPressSeqString: `keyPress` from `extractResults()` function, converted to a comma-separated string using `.toString()` (in JavaScript).
      * RTSeqString: `rt` from `extractResults()` function, converted to a comma-separated string using `.toString()` (in JavaScript).
    * `--output_path` (string): Directory where BIDS transformed data will be saved.
    * `--stim_time` (int): Duration (in milliseconds) that each stimulus image (target or filler) is displayed.
    * `--isi` (int): Duration (in milliseconds) of each fixation trial (i.e., the inter-stimulus interval).
> [!WARNING]  
> The script does not check if the `stim_time` or the `isi` is correct with the experiment setup (in fact, the experiment output does not contain that information), so ensure you pass the correct values when calling the script.
* Example usage:
    ```sh
    python scripts/02_to_bids.py --raw_data_path data/raw_data.csv --output_path data/bids_output --stim_time 750 --isi 800
    ```
* See [here](https://osf.io/k8snr) for example data transformed using this script

# Calculating the memorability metrics from the BIDS formatted data
* `scripts/03_calculate_metrics.py` processes BIDS-formatted data from the Continuous Recognition Task to compute image-level performance metrics such as hit rate (HR), false alarm rate (FAR), and corrected recognition rate (CRR). It also applies basic exclusion criteria to remove participants with unreliable responses.
  * Arguments
    * `--root_path` (string): Path to the root BIDS directory containing participant data.
    * `--output_path` (string): File path to save the image-level results (e.g., image_metrics.csv).
    * `--no_consolidate_fixation` (flag): If set, keypresses during fixation will NOT be counted as valid responses. By default (i.e., when the flag is not set), fixation responses are included in the response evaluation.
    * `--far_threshold`: Threshold for filler false alarm rate. Participants with filler false alarm rate higher than or equal to the threshold will be removed from the calculation (default: 0.7).
    * `--vigilance_miss_threshold`: Threshold for vigilance miss rate. Participants with vigilance miss rate higher than or equal to the threshold will be removed from the calculation (default: 0.7).
  * Output CSV file columns
    * `image_name`: Filename of the stimulus image (from `stim_file` in the BIDS formatted data).
    * `n_participants_target`: Number of participants who saw the image as a target.
    * `target_crr`: Corrected Recognition Rate (i.e., HR − FAR).
    * `target_hr`: Hit rate for repeated targets.
    * `target_far`: False alarm rate for target first presentations.
    * The CSV also includes raw counts for hits, misses, false alarms, and correct rejections, separately for target and filler images.
* Example usage:
    ```sh
    python scripts/03_aggregate_image_metrics.py --root_path data/bids_output --output_path ./image_metrics.csv --far_threshold 0.7 --vigilance_miss_threshold 0.7
    ```
* See [here](https://github.com/nwrim/naturalness_compression_memorability/blob/main/data/image_level_measure/set3_memorability.csv) for example output of the script.
