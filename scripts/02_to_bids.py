import argparse
import os
import numpy as np
import pandas as pd
from tqdm import tqdm

# CONSTANTS
TASK = 'continuous_recognition'
DATA_TYPE = 'beh'
SUFFIX = 'beh'
# Image types
FIXATION = '0'
TARGET = '1'
REPEAT = '2'
FILLER = '3'
VIGILANCE = '4'
# conversion dictionary for imtype
IMTYPE_DICT = {
    '0': 'FIXATION',
    '1': 'TARGET',
    '2': 'REPEAT',
    '3': 'FILLER',
    '4': 'VIGILANCE'
}
# validation configuration
# these are commented out because the numbers change by your setting
# but they are likely useful to check the data, so I recommend to change the values and use them.
ATTN_CONFIG = {
    # 'target_num': 60,  # there are 60 targets
    # 'filler_num': 135,  # there are 135 fillers
    # 'vigilance_num': 17,  # there are 17 vigilance trials
    # 'min_repeat_interval': 16,  # minimum interval between target and repeat
    # 'max_repeat_interval': # maximum interval between target and repeat
    # 'min_vigilance_interval': 1,  # minimum interval between filler and vigilance
    # 'max_vigilance_interval': 7,  # maximum interval between filler and vigilance
    # 'fixation_img_name': 'fixation.jpg'  # name of the fixation image
}

def validate_data(imseq, imtypeseq, keyPressSequence, RTSequence, attn_config):

    # first check the length of the trials
    assert len(imseq) == len(imtypeseq) == len(keyPressSequence) == len(RTSequence), "Length of sequences do not match"
    if 'target_num' in attn_config:
        assert((imtypeseq == TARGET).sum() == attn_config['target_num']), "Number of target trials does not match expected count"
        assert((imtypeseq == REPEAT).sum() == attn_config['target_num']), "Number of repeat trials does not match expected count"
    if 'filler_num' in attn_config:
        assert((imtypeseq == FILLER).sum() == attn_config['filler_num']), "Number of filler trials does not match expected count"
    if 'vigilance_num' in attn_config:
        assert((imtypeseq == VIGILANCE).sum() == attn_config['vigilance_num']), "Number of vigilance trials does not match expected count"
    if 'target_num' in attn_config and 'filler_num' in attn_config and 'vigilance_num' in attn_config:
        total_trials = (attn_config['target_num'] * 2 + attn_config['filler_num'] + attn_config['vigilance_num']) * 2
        assert len(imseq) == total_trials, f"Total number of trials does not match expected count: {total_trials}"
    
    # check overlap between the categories
    # target and filler should be non-overlapping
    target_images = imseq[imtypeseq == TARGET]
    filler_images = imseq[imtypeseq == FILLER]
    assert(len(set(target_images).intersection(set(filler_images))) == 0)
    # target and repeat should be completely overlapping
    repeat_images = imseq[imtypeseq == REPEAT]
    assert(len(set(target_images).intersection(set(repeat_images))) == len(repeat_images))
    # filler and vigilance should be completely overlapping
    vigilance_images = imseq[imtypeseq == VIGILANCE]
    assert(len(set(filler_images).intersection(set(vigilance_images))) == len(vigilance_images))

    for i in range(len(imseq)):
        if imtypeseq[i] == REPEAT:
            # check that all repeat follows target that was shown before
            assert imseq[i] in imseq[:i][imtypeseq[:i] == TARGET]
            # check that the image only appears twice
            assert (imseq == imseq[i]).sum() == 2
            # check the interval between the target and repeat
            if 'min_repeat_interval' in attn_config:
                assert((np.where(imseq == imseq[i])[0][1] - np.where(imseq == imseq[i])[0][0]) / 2 > attn_config['min_repeat_interval'])
            if 'max_repeat_interval' in attn_config:
                # the interval between the target and repeat should be at most 17
                assert((np.where(imseq == imseq[i])[0][1] - np.where(imseq == imseq[i])[0][0]) / 2 <= attn_config['max_repeat_interval'])
        elif imtypeseq[i] == VIGILANCE:
            # check that all vigilance follows filler that was shown before
            assert imseq[i] in imseq[:i][imtypeseq[:i] == FILLER]
            # check that the image only appears twice
            assert (imseq == imseq[i]).sum() == 2
            # check the interval between the filler and vigilance
            if 'min_vigilance_interval' in attn_config:
                assert((np.where(imseq == imseq[i])[0][1] - np.where(imseq == imseq[i])[0][0]) / 2 >= attn_config['min_vigilance_interval'])
            if 'max_vigilance_interval' in attn_config:
                assert((np.where(imseq == imseq[i])[0][1] - np.where(imseq == imseq[i])[0][0]) / 2 <= attn_config['max_vigilance_interval'])

        # fixation trials should be in between the trials
        assert np.all(imtypeseq[1::2] == FIXATION) 
        if 'fixation_img_name' in attn_config:
            # check that fixation images are the same
            assert np.all(imseq[1::2] == attn_config['fixation_img_name'])

def build_trial_df(imseq, imtypeseq, keyPressSequence, RTSequence, stim_time, isi):
    # build onset and duration sequences
    onsets = []
    onset = 0
    durations = []
    for imtype in imtypeseq:
        onsets.append(onset)
        if imtype == FIXATION:
            onset += isi
            durations.append(isi)
        else:
            onset += stim_time
            durations.append(stim_time)
    
    trial_df = pd.DataFrame({
        'onset': np.array(onsets),
        'duration': np.array(durations),
        'trial_type': np.array([IMTYPE_DICT[x] for x in imtypeseq]),
        'response': np.array([None if not k else k for k in keyPressSequence]),
        'response_time': np.array([None if not r else r for r in RTSequence]),
        'stim_file': imseq
    })
    
    return trial_df

def main(raw_data_path, root, stim_time, isi):
    # first load the raw data
    df = pd.read_csv(raw_data_path)
    # remove rows that don't have data (people who got kicked out due to sceen size, etc)
    # delete the qualtrics formats (first two rows)
    df = df[df['Answer.imseq'].notna()].iloc[2:, :].reset_index(drop=True)
    # for experiment 3, this participant pressed "," ast some point messing up the keyPressSequence
    df = df[df['PROLIFIC_PID'] != '63d148b2255821a940922c1a'].reset_index(drop=True)
    df = df.iloc[:1392, :].copy()

    participant_ids = []
    for idx, row in tqdm(df.iterrows()):
        imseq = np.array(row['Answer.imseq'].split(','))
        imtypeseq = np.array(row['Answer.imtypeseq'].split(','))
        keyPressSequence = np.array(row['keyPressSequence'].split(','))
        RTSequence = np.array(row['RTSequence'].split(','))

        # Validate the data
        validate_data(imseq, imtypeseq, keyPressSequence, RTSequence, ATTN_CONFIG)

        # build trial-level tsv
        trial_df = build_trial_df(imseq, imtypeseq, keyPressSequence, RTSequence, stim_time, isi)

        # participant id is just the index
        subject = str(idx + 1).zfill(4)
        # making BIDSPath if it does not exists
        bids_path = os.path.join(root, f'sub-{subject}', DATA_TYPE)
        if not os.path.exists(bids_path):
            os.makedirs(bids_path)
        bids_file = f'sub-{subject}_task-{TASK}_{SUFFIX}.tsv'

        # save the trial-level tsv
        trial_df.to_csv(os.path.join(bids_path, bids_file), sep = '\t', index = False, na_rep='n/a')

        #### building the participant.csv ####
        participant_ids.append(subject)

    # Save the participant data
    participant_df = pd.DataFrame({
        'participant_id': participant_ids,
    })

    participant_df.to_csv(os.path.join(root, 'participants.tsv'), sep = '\t', index = False, na_rep='n/a')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--raw_data_path', type=str)
    parser.add_argument('--output_path', type=str)
    parser.add_argument('--stim_time', type=int)
    parser.add_argument('--isi', type=int)

    args = parser.parse_args()
    raw_data_path = args.raw_data_path
    root = args.output_path
    stim_time = args.stim_time
    isi = args.isi

    # create the output directory if it does not exist
    if not os.path.exists(root):
        os.makedirs(root)

    main(raw_data_path, root, stim_time, isi)