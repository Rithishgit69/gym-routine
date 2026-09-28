/* Training program (v2): 3 upper days + 1 leg day, no deadlifts.
   Exercise IDs refer to github.com/hasaneyldrm/exercises-dataset. */
window.PROGRAM = {
  defaultStart: '2026-09-28',
  // No fixed weekdays: sessions rotate in this order, based on the last workout logged.
  order: ['push', 'pull', 'legs', 'upper'],

  sessions: {
    push: {
      name: 'Push', focus: 'Chest, shoulders, triceps, abs', duration: '~60 min',
      items: [
        { n: '1', id: '0025', sets: 3, reps: [6, 8], rest: 180, rir: '2–3', inc: 'barbell', swap: ['0289'], main: true },
        { n: '2', id: '0314', sets: 3, reps: [8, 12], rest: 120, rir: '1–2', inc: 'dumbbell', swap: ['0757'] },
        { n: '3', id: '0405', sets: 2, reps: [8, 12], rest: 120, rir: '1–2', inc: 'dumbbell', swap: ['0603'] },
        { n: '4', id: '0334', sets: 3, reps: [12, 20], rest: 60, rir: '0–1', inc: 'reps20', swap: ['0178'] },
        { n: '5', id: '0596', sets: 2, reps: [12, 15], rest: 90, rir: '0–1', inc: 'machine', swap: ['0227'] },
        { n: '6', id: '0200', sets: 3, reps: [10, 15], rest: 60, rir: '0–1', inc: 'machine', swap: ['0241'] },
        { n: '7', id: '0175', sets: 2, reps: [10, 15], rest: 60, rir: '1', inc: 'machine', swap: ['0872'] }
      ]
    },
    pull: {
      name: 'Pull', focus: 'Back, rear delts, biceps, abs', duration: '~65 min',
      items: [
        { n: '1', id: '0652', sets: 3, reps: [6, 10], rest: 150, rir: '1–2', inc: 'bodyweight', swap: ['0017', '0818'], main: true },
        { n: '2', id: '0027', sets: 3, reps: [8, 10], rest: 150, rir: '2', inc: 'barbell', swap: ['1350'] },
        { n: '3', id: '0861', sets: 3, reps: [10, 12], rest: 120, rir: '1–2', inc: 'machine', swap: ['0292'] },
        { n: '4', id: '0203', sets: 3, reps: [12, 15], rest: 60, rir: '0–1', inc: 'machine', swap: ['0602'] },
        { n: '5', id: '0447', sets: 3, reps: [8, 12], rest: 90, rir: '0–1', inc: 'barbell', swap: ['0294'] },
        { n: '6', id: '0313', sets: 2, reps: [10, 12], rest: 60, rir: '0–1', inc: 'dumbbell', swap: ['0165'] },
        { n: '7', id: '0472', sets: 3, reps: [8, 15], rest: 60, rir: '1', inc: 'bodyweight', swap: ['0872'] }
      ]
    },
    legs: {
      name: 'Legs', focus: 'Quads, hamstrings, glutes, calves', duration: '~70 min',
      items: [
        { n: '1', id: '0043', sets: 3, reps: [6, 8], rest: 180, rir: '2–3', inc: 'squat', swap: ['0743'], main: true },
        { n: '2', id: '1463', sets: 3, reps: [10, 12], rest: 120, rir: '1–2', inc: 'legpress', swap: ['3281'] },
        { n: '3', id: '0586', sets: 3, reps: [10, 12], rest: 90, rir: '0–1', inc: 'machine', swap: ['0599'] },
        { n: '4', id: '0410', sets: 2, reps: [8, 12], per: 'per leg', rest: 120, rir: '1–2', inc: 'dumbbell', swap: ['0336'] },
        { n: '5', id: '0599', sets: 3, reps: [10, 12], rest: 90, rir: '0–1', inc: 'machine', swap: ['0586'] },
        { n: '6', id: '0585', sets: 2, reps: [12, 15], rest: 90, rir: '0–1', inc: 'machine', swap: ['1760'] },
        { n: '7', id: '0605', sets: 4, reps: [10, 15], rest: 60, rir: '0–1', inc: 'reps20', swap: ['1391'] }
      ]
    },
    upper: {
      name: 'Upper', focus: 'Shoulders, chest, back, arms', duration: '~65 min',
      items: [
        { n: '1', id: '1456', sets: 3, reps: [6, 8], rest: 180, rir: '2–3', inc: 'ohp', swap: ['0405'], main: true },
        { n: '2', id: '0289', sets: 3, reps: [8, 12], rest: 120, rir: '1–2', inc: 'dumbbell', swap: ['0577'] },
        { n: '3', id: '0150', sets: 3, reps: [8, 12], rest: 120, rir: '1–2', inc: 'machine', swap: ['0017'] },
        { n: '4', id: '0292', sets: 3, reps: [8, 12], per: 'per arm', rest: 120, rir: '1–2', inc: 'dumbbell', swap: ['0861'] },
        { n: '5', id: '0178', sets: 3, reps: [12, 20], rest: 60, rir: '0–1', inc: 'reps20', swap: ['0334'] },
        { n: '6a', id: '0294', sets: 2, reps: [10, 12], rest: 0, rir: '0–1', inc: 'dumbbell', swap: ['0868'], superset: '6b' },
        { n: '6b', id: '0194', sets: 2, reps: [10, 15], rest: 60, rir: '0–1', inc: 'machine', swap: ['0060'], superset: '6a' }
      ]
    }
  },

  // How much to add once every set reaches the top of the rep range
  increments: {
    barbell: { step: 2.5, text: '+2.5 kg' },
    ohp: { step: 2.5, text: '+1.25–2.5 kg' },
    squat: { step: 5, text: '+5 kg' },
    legpress: { step: 10, text: '+10 kg' },
    dumbbell: { step: 2.5, text: 'next dumbbell (+1–2.5 kg per hand)' },
    machine: { step: 5, text: 'next pin (+2.5–5 kg)' },
    reps20: { step: 2.5, text: 'reach 20 reps first, then the next weight' },
    bodyweight: { step: 2.5, text: 'add reps; at the top add 2.5 kg (or use 5 kg less assistance)' }
  },

  // Display names (the dataset names are lowercase and sometimes odd)
  names: {
    '0025': 'Barbell Bench Press', '0314': 'Incline Dumbbell Press', '0405': 'Seated Dumbbell Shoulder Press',
    '0334': 'Dumbbell Lateral Raise', '0596': 'Pec Deck', '0200': 'Rope Triceps Pushdown', '0175': 'Cable Kneeling Crunch',
    '0652': 'Pull-up', '0017': 'Assisted Pull-up', '0027': 'Barbell Bent-over Row', '0861': 'Cable Seated Row',
    '0203': 'Rope Face Pull', '0447': 'EZ-bar Curl', '0313': 'Dumbbell Hammer Curl', '0472': 'Hanging Leg Raise',
    '0043': 'Barbell Back Squat', '1463': '45° Leg Press', '0586': 'Lying Leg Curl', '0410': 'Bulgarian Split Squat',
    '0599': 'Seated Leg Curl', '0585': 'Leg Extension', '0605': 'Standing Calf Raise',
    '1456': 'Barbell Overhead Press', '0289': 'Flat Dumbbell Press', '0150': 'Lat Pulldown', '0292': 'One-arm Dumbbell Row',
    '0178': 'Cable Lateral Raise', '0294': 'Dumbbell Curl', '0194': 'Overhead Cable Triceps Extension',
    '0757': 'Smith Incline Press', '0603': 'Machine Shoulder Press', '0227': 'Cable Fly', '0241': 'V-bar Pushdown',
    '0872': 'Reverse Crunch', '0818': 'Parallel-grip Lat Pulldown', '1350': 'Machine Seated Row', '0602': 'Reverse-fly Machine',
    '0165': 'Rope Hammer Curl', '0743': 'Hack Squat', '3281': 'Smith Machine Squat', '0336': 'Dumbbell Lunge',
    '1760': 'Goblet Squat', '1391': 'Calf Press on Leg Press', '0577': 'Machine Chest Press', '0868': 'Cable Curl',
    '0060': 'Skull Crusher'
  },

  // Coach notes: key cues + common mistakes (the dataset has instructions only)
  notes: {
    '0025': { cues: ['Pinch shoulder blades together and down, feet flat', 'Lower the bar to the nipple line, elbows 45–70°', 'Touch lightly, then press up and slightly back'],
      mistakes: ['Elbows flared to 90° (hurts the shoulders)', 'Bouncing the bar off the chest', 'Hips lifting off the bench', 'Going heavy without safety pins or a spotter'] },
    '0314': { cues: ['Bench at 30–45°', 'Lower the dumbbells to your upper chest for a deep stretch', 'Keep forearms vertical'],
      mistakes: ['Bench too steep, so it turns into a shoulder press', 'Dumbbells drifting wide and low', 'Cutting the bottom of the rep short'] },
    '0405': { cues: ['Back flat against an upright bench', 'Lower to ear level', 'Press up and slightly in without clashing the dumbbells'],
      mistakes: ['Arching the lower back off the pad', 'Half reps', 'Elbows pulled far behind the body'] },
    '0334': { cues: ['Lean forward slightly and lead with the elbows', 'Stop at shoulder height', 'Take 2–3 s on the way down'],
      mistakes: ['Swinging the body to lift the weight', 'Shrugging the traps up', 'Going too heavy and cutting the range'] },
    '0596': { cues: ['Seat height puts the handles at mid-chest', 'Keep a slight, fixed bend in the elbows', 'Squeeze for 1 s'],
      mistakes: ['Letting the stack slam between reps', 'Shoulders rolling forward at the end', 'Stretching back into pain'] },
    '0200': { cues: ['Elbows pinned to your sides', 'Spread the rope and lock out at the bottom', 'Control the way up'],
      mistakes: ['Elbows drifting forward (turns into a press)', 'Leaning over the stack', 'Using body momentum'] },
    '0175': { cues: ['Hips stay still', 'Curl your ribs down toward your pelvis', 'Breathe out hard at the bottom'],
      mistakes: ['Sitting back onto the heels instead of crunching', 'Pulling with the arms', 'Rushing the reps'] },
    '0652': { cues: ['Start from a dead hang, pull shoulders down first', 'Chest to the bar, elbows to your ribs', 'Take 2 s on the way down'],
      mistakes: ['Kipping or swinging', 'Half reps without a full hang', 'Craning the chin to reach the bar'] },
    '0017': { cues: ['Pick assistance that allows 6–10 reps', 'Full hang at the bottom', 'Chest up, elbows to ribs'],
      mistakes: ['Too much assistance, so reps are easy', 'Bouncing off the platform', 'Not lowering all the way'] },
    '0027': { cues: ['Hinge to about 45° with a flat, braced back', 'Pull the bar to your belly button, elbows back', 'No torso swinging'],
      mistakes: ['Standing up more with every rep', 'Rounding the lower back', 'Shrugging instead of rowing'] },
    '0861': { cues: ['Sit tall with the chest up', 'Let the arms stretch forward, then row to the belly', 'Squeeze shoulder blades for 1 s'],
      mistakes: ['Big torso rocking', 'Slumping forward at the stretch', 'Pulling with the arms only'] },
    '0203': { cues: ['Cable at face height', 'Pull the rope to your face, elbows high and wide', 'Squeeze rear shoulders for 1 s'],
      mistakes: ['Too heavy, so it becomes a row', 'Elbows dropping low', 'Leaning back to move the weight'] },
    '0447': { cues: ['Elbows pinned to your sides', 'No hip swing', 'Take 2–3 s on the way down'],
      mistakes: ['Swinging with the back', 'Elbows travelling forward', 'Dropping the bar quickly'] },
    '0313': { cues: ['Palms face each other', 'Elbows stay still', 'Control the way down'],
      mistakes: ['Swinging', 'Shrugging the shoulders', 'Partial reps'] },
    '0472': { cues: ['No swinging', 'Curl your pelvis up, don\'t just lift the legs', 'Bend the knees if needed'],
      mistakes: ['Using momentum', 'Lifting only with the hip flexors', 'Dropping the legs fast'] },
    '0043': { cues: ['Bar on the upper traps; big breath and brace before every rep', 'Knees track over the toes', 'Chest and hips rise together'],
      mistakes: ['Knees caving in', 'Heels lifting off the floor', 'Lower back rounding at the bottom', 'Squatting without safety pins'] },
    '1463': { cues: ['Feet shoulder-width in the middle of the platform', 'Go deep but stop before the lower back lifts', 'Don\'t slam the knees into lockout'],
      mistakes: ['Lower back rolling off the pad', 'Locking the knees hard', 'Tiny range with a heavy weight'] },
    '0586': { cues: ['Hips pressed into the pad', 'Curl all the way', 'Take 2–3 s on the way down'],
      mistakes: ['Hips lifting off the pad', 'Slamming the stack', 'Partial reps'] },
    '0410': { cues: ['Rear foot on a bench', 'Front foot far enough forward that the heel stays down', 'Lower until the back knee almost touches the floor'],
      mistakes: ['Front foot too close (heel lifts, knee pain)', 'Wobbling: use lighter dumbbells', 'Pushing off the back leg'] },
    '0599': { cues: ['Thigh pad locked tight', 'Lean the torso slightly forward', 'Slow return'],
      mistakes: ['Loose thigh pad, so the thighs lift', 'Jerking the weight', 'Short range'] },
    '0585': { cues: ['Knee lined up with the machine pivot', 'Squeeze for 1 s at the top', 'Lower slowly'],
      mistakes: ['Swinging the weight up', 'Hips lifting off the seat', 'Dropping the weight'] },
    '0605': { cues: ['Pause 2 s at the bottom stretch', 'Rise high onto the big toe', 'Knees straight but not locked'],
      mistakes: ['Bouncing at the bottom', 'Bending the knees to cheat', 'Half range'] },
    '1456': { cues: ['Grip just outside the shoulders; squeeze glutes and brace', 'Move your head back and press in a straight line', 'Push your head through at the top'],
      mistakes: ['Leaning back (turns into an incline press)', 'Pressing the bar forward around the face', 'Wrists bent back'] },
    '0289': { cues: ['Shoulder blades back', 'Lower to the sides of the chest for a deep stretch', 'Press up and slightly in'],
      mistakes: ['Elbows flared to 90°', 'Bouncing at the bottom', 'Shoulders rolling forward'] },
    '0150': { cues: ['Grip a little wider than the shoulders, chest up', 'Drive the elbows down to the ribs', 'Full stretch at the top'],
      mistakes: ['Pulling behind the neck', 'Leaning far back (turns into a row)', 'Using momentum'] },
    '0292': { cues: ['Flat back, free hand and knee on the bench', 'Pull the dumbbell to your hip', 'Full stretch at the bottom'],
      mistakes: ['Twisting the torso to lift', 'Shrugging', 'Rounding the back'] },
    '0178': { cues: ['Cable starts behind the body', 'Lead with the elbow up to shoulder height', 'Slow on the way down'],
      mistakes: ['Bending the elbow a lot', 'Swinging', 'Shrugging above shoulder height'] },
    '0294': { cues: ['Elbows fixed at your sides', 'Turn the palms up at the top', 'Take 2–3 s on the way down'],
      mistakes: ['Swinging', 'Elbows moving forward', 'Partial reps'] },
    '0194': { cues: ['Face away from the stack, elbows pointing forward and up', 'Deep stretch behind the head', 'Lock out fully'],
      mistakes: ['Elbows flaring wide', 'Arching the lower back', 'Turning it into a press'] },
    '0757': { cues: ['Set the bench so the bar lands on the upper chest', 'Unrack with a twist of the wrists', 'Control the way down'],
      mistakes: ['Bench in the wrong spot (bar hits neck or belly)', 'Bouncing', 'Elbows flared'] },
    '0603': { cues: ['Handles start at shoulder height', 'Back flat on the pad', 'Press without slamming into lockout'],
      mistakes: ['Seat too high or too low', 'Arching the back', 'Half reps'] },
    '0227': { cues: ['Handles at chest height, one step forward', 'Slight fixed elbow bend', 'Hug motion, squeeze in the middle'],
      mistakes: ['Bending the elbows so it becomes a press', 'Going too heavy', 'Leaning far forward'] },
    '0241': { cues: ['Elbows pinned to your sides', 'Lock out fully', 'Stand tall'],
      mistakes: ['Elbows drifting forward', 'Leaning over the stack', 'Using momentum'] },
    '0872': { cues: ['Curl the hips off the floor toward the chest', 'Lower under control', 'Breathe out as you curl'],
      mistakes: ['Swinging the legs', 'Using momentum', 'Arching the back when lowering'] },
    '0818': { cues: ['Neutral grip, chest up', 'Elbows down to the ribs', 'Full stretch at the top'],
      mistakes: ['Leaning far back', 'Using momentum', 'Shrugging'] },
    '1350': { cues: ['Chest on the pad', 'Pull the elbows back', 'Squeeze for 1 s'],
      mistakes: ['Chest leaving the pad', 'Jerking the handles', 'Shrugging'] },
    '0602': { cues: ['Chest on the pad, arms at shoulder height', 'Slight elbow bend', 'Sweep the arms back wide'],
      mistakes: ['Shrugging', 'Too heavy', 'Only squeezing the shoulder blades without moving the arms'] },
    '0165': { cues: ['Elbows pinned', 'Neutral grip on the rope', 'Squeeze at the top'],
      mistakes: ['Leaning back', 'Elbows moving forward', 'Fast lowering'] },
    '0743': { cues: ['Back flat on the pad', 'Feet shoulder-width', 'Go deep under control'],
      mistakes: ['Heels lifting', 'Knees caving', 'Locking the knees hard'] },
    '3281': { cues: ['Feet slightly in front of the bar', 'Brace before every rep', 'Control the depth'],
      mistakes: ['Feet directly under the bar (knee stress)', 'Half reps', 'Hips shooting up first'] },
    '0336': { cues: ['Take a long step', 'Torso upright', 'Back knee close to the floor'],
      mistakes: ['Step too short (knee pain)', 'Knee caving in', 'Pushing off the back leg'] },
    '1760': { cues: ['Hold the dumbbell at your chest', 'Elbows inside the knees at the bottom', 'Sit down between the hips'],
      mistakes: ['Heels lifting', 'Rounding the upper back', 'Shallow depth'] },
    '1391': { cues: ['Balls of the feet on the platform edge', 'Full stretch at the bottom', 'Press as high as possible'],
      mistakes: ['Bouncing', 'Bending the knees', 'Feet slipping off the edge'] },
    '0577': { cues: ['Seat height puts the handles at mid-chest', 'Shoulder blades back', 'Control both directions'],
      mistakes: ['Shoulders rolling forward', 'Slamming into lockout', 'Seat set too high'] },
    '0868': { cues: ['Elbows fixed', 'Squeeze at the top', 'Slow on the way down'],
      mistakes: ['Swinging', 'Elbows moving forward', 'Leaning back'] },
    '0060': { cues: ['Upper arms still, angled slightly back', 'Lower toward the forehead', 'Extend fully'],
      mistakes: ['Elbows flaring out', 'Moving the upper arms (turns into a press)', 'Going too heavy (elbow pain)'] }
  }
};
