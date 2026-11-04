// English is the reference language: every key used in the app is defined here.
// Other languages must provide the same keys (TypeScript checks this).
// Placeholders like {count} are filled in by t(key, { count: 3 }).
// A key ending in "_one" is an optional singular form used when count === 1.

export const en = {
  // Dates (only used by languages without an intlLocale)
  'date.full': '{month}/{day}/{year}',
  'date.monthYear': '{month}/{year}',

  'common.close': 'Close',

  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',

  'header.version': 'ver {version} by MrRat.com',
  'header.streakTitle': '{count} day streak! Tap for daily challenges',
  'header.calendar': 'Daily Challenges Calendar',
  'header.stats': 'Performance Statistics',
  'header.mute': 'Mute Sounds',
  'header.unmute': 'Unmute Sounds',
  'header.settings': 'Game Settings',
  'header.daily': 'Daily',
  'header.classic': 'Classic',
  'header.new': 'New',
  'header.newTitle': 'Generate a new game',
  'header.restart': 'Restart current board',
  'header.mistakes': 'Mistakes',
  'header.time': 'Time Elapsed',
  'header.resume': 'Resume Game',
  'header.pause': 'Pause Game',

  'controls.undo': 'Undo',
  'controls.undoTitle': 'Undo last move (U or Ctrl+Z)',
  'controls.erase': 'Erase',
  'controls.eraseTitle': 'Erase cell (Backspace/Delete)',
  'controls.notes': 'Notes',
  'controls.notesTitle': 'Toggle Pencil Notes mode (N)',
  'controls.on': 'ON',
  'controls.off': 'OFF',
  'controls.hint': 'Hint',
  'controls.hintTitle': 'Get a smart educational hint (H)',
  'controls.numberLabel': 'Enter number {num} ({left} remaining)',

  'grid.building': 'Building your puzzle…',
  'grid.paused': 'Game Paused',
  'grid.pausedText': 'Timer is paused. Tap resume when ready.',
  'grid.cellLabel': 'Row {row}, Column {col}, Value {value}',
  'grid.empty': 'Empty',

  'hint.dismiss': 'Dismiss Hint',
  'hint.gotIt': "Got it, I'll solve it",
  'hint.conflict.title': 'Conflict Detected',
  'hint.conflict.text':
    'The {value} at Row {row}, Column {col} repeats a number already in its row, column or box. Clearing this square will unlock the logical path.',
  'hint.incorrect.title': 'Incorrect Entry',
  'hint.incorrect.text':
    "The {value} at Row {row}, Column {col} doesn't break any rule yet, but it isn't part of this puzzle's solution and will cause a contradiction later. Clearing this square will unlock the logical path.",
  'hint.keyCellBox.title': 'Key Cell in Box {box}',
  'hint.keyCellBox.text':
    'Look closely at 3×3 Box {box}. There is a missing number that can only legally fit into Row {row}, Column {col} because all other empty squares in this box are blocked by row and column peers. Check which missing number fits here!',
  'hint.keyCellRow.title': 'Key Cell in Row {row}',
  'hint.keyCellRow.text':
    "Scan Row {row}. One of the missing numbers for this row can only be placed in Column {col} because other empty squares in this row are ruled out by column or box constraints. Test the row's missing numbers!",
  'hint.keyCellCol.title': 'Key Cell in Column {col}',
  'hint.keyCellCol.text':
    "Scan Column {col}. One of the missing column digits has only a single valid spot at Row {row}. Check the column's remaining digits to identify it.",
  'hint.lockedRow.title': 'Locked Line in Box {box}',
  'hint.lockedRow.text':
    'Notice how in Box {box}, a candidate is constrained strictly to Row {row}. This eliminates that number from the rest of Row {row} outside this box, narrowing down your pencil marks.',
  'hint.lockedCol.title': 'Locked Column in Box {box}',
  'hint.lockedCol.text':
    'In Box {box}, a candidate can only appear along Column {col}. This rules out that number from the rest of Column {col} outside this box.',
  'hint.opportunity.title': 'Opportunity at Row {row}, Col {col}',
  'hint.opportunity.text':
    'Check Row {row}, Column {col} and examine its row, column, and box peers. Almost all digits 1–9 are eliminated by neighboring cells, leaving very few possibilities to test.',
  'hint.singleRow.title': 'Single Option in Row {row}',
  'hint.singleRow.text':
    'In Row {row}, Column {col} is the ONLY square where a certain missing digit can legally go. Cross-reference the columns crossing this row to identify which number it is.',
  'hint.singleCol.title': 'Single Option in Column {col}',
  'hint.singleCol.text':
    "In Column {col}, Row {row} is the ONLY open cell that can take one of the column's missing digits. Examine the intersecting rows to see which number fits.",
  'hint.singleBox.title': 'Single Option in Box {box}',
  'hint.singleBox.text':
    "Inside 3×3 Box {box}, Row {row}, Column {col} is the ONLY open cell that can accept one of the box's missing numbers. Check which missing number avoids all row and column conflicts.",
  'hint.nakedSingle.title': 'Naked Single at Row {row}, Col {col}',
  'hint.nakedSingle.text':
    'This highlighted cell has only ONE legal number remaining after eliminating all numbers present in its row, column, and 3×3 box. Cross-reference the highlighted peers to find which number (1–9) is missing!',

  'technique.conflict': 'Conflict Resolution',
  'technique.errorCheck': 'Error Check',
  'technique.hiddenSingleBox': 'Hidden Single (Box)',
  'technique.hiddenSingleRow': 'Hidden Single (Row)',
  'technique.hiddenSingleCol': 'Hidden Single (Column)',
  'technique.lockedCandidates': 'Locked Candidates (Pointing)',
  'technique.peerElimination': 'Peer Elimination',
  'technique.nakedSingle': 'Naked Single',

  'gameOver.title': 'Game Over',
  'gameOver.text': 'You made 3 mistakes on this {difficulty} puzzle.',
  'gameOver.tryAgain': 'Try This Puzzle Again',
  'gameOver.newGame': 'Generate New Game',

  'stats.title': 'Performance Statistics',
  'stats.subtitle': 'Track your solving speed and accuracy',
  'stats.gamesWon': 'Games Won',
  'stats.gamesPlayed': '{played} games played ({rate}%)',
  'stats.bestTime': 'Best Time',
  'stats.average': 'Avg: {time}',
  'stats.currentStreak': 'Current Streak',
  'stats.bestStreak': 'Best streak: {count}',
  'stats.dailyStreak': 'Daily Streak',
  'stats.consecutive': 'Consecutive days active',
  'stats.done': 'Done',

  'victory.newBest': 'NEW BEST!',
  'victory.solved': 'Puzzle Solved!',
  'victory.dailySubtitle': 'Daily Challenge ({difficulty}) • {date}',
  'victory.today': 'Today',
  'victory.classicSubtitle': '{difficulty} Difficulty Complete',
  'victory.time': 'Time',
  'victory.best': 'Best: {time}',
  'victory.mistakes': 'Mistakes',
  'victory.flawless': 'Flawless',
  'victory.completed': 'Completed',
  'victory.hints': 'Hints',
  'victory.noHints': 'No hints',
  'victory.assisted': 'Assisted',
  'victory.streak': 'Daily Streak: {count} days in a row!',
  'victory.streak_one': 'Daily Streak: {count} day in a row!',
  'victory.playAnother': 'Play Another {difficulty} Game',
  'victory.tryNext': 'Try {difficulty} Level',
  'victory.viewCalendar': 'View Daily Challenges Calendar',

  'daily.title': 'Daily Sudoku',
  'daily.subtitle': '1 fresh Easy, Medium & Hard puzzle generated every day',
  'daily.streak': 'Daily Streak',
  'daily.days': '{count} Days',
  'daily.days_one': '{count} Day',
  'daily.month': 'Month',
  'daily.today': "Today's Puzzles",
  'daily.puzzlesFor': 'Puzzles for {date}',
  'daily.ready': 'Ready',
  'daily.solvedIn': 'Solved in',
  'daily.unsolved': 'Unsolved puzzle',
  'daily.replay': 'Replay',
  'daily.play': 'Play',
  'daily.calendar': 'Calendar Explorer',
  'daily.tapDate': 'Tap a date to load its puzzles',

  'settings.title': 'Settings & Preferences',
  'settings.subtitle': 'Customize your playing experience',
  'settings.language': 'Language',
  'settings.languageAuto': 'Device ({name})',
  'settings.theme': 'Theme & Appearance',
  'theme.elegant-dark': 'Elegant Dark',
  'theme.minimal-light': 'Minimal Light',
  'theme.warm-paper': 'Warm Paper',
  'theme.dark-slate': 'Dark Slate',
  'theme.nordic-forest': 'Nordic Pine',
  'settings.assists': 'Assists & Visual Aids',
  'settings.sound': 'Sound Effects',
  'settings.soundDesc': 'Subtle audio feedback for taps and completions',
  'settings.autoNotes': 'Auto-Remove Notes',
  'settings.autoNotesDesc': 'Automatically clear candidate pencil marks on row/col/box',
  'settings.matching': 'Highlight Matching Numbers',
  'settings.matchingDesc': 'Highlight all identical numbers across the grid',
  'settings.peers': 'Highlight Row, Column & Box',
  'settings.peersDesc': 'Shade the crosshair peers of the selected cell',
  'settings.conflicts': 'Check Conflicts & Duplicates',
  'settings.conflictsDesc': 'Flag invalid duplicate numbers instantly',
  'settings.strikes': '3-Strikes Mistake Mode',
  'settings.strikesOn': 'Game over on 3 mistakes',
  'settings.strikesOff': 'Relaxed mode (unlimited mistakes)',
  'settings.strikesBtnOn': '3 Strikes',
  'settings.strikesBtnOff': 'Relaxed',
  'settings.save': 'Save & Close',
  'settings.footer': 'RatDoku • ver {version} by MrRat.com',
};

export type MessageKey = keyof typeof en;
type SingularKey = Extract<MessageKey, `${string}_one`>;

/** Shape every language file must match: all keys required, singular forms optional. */
export type Messages = Record<Exclude<MessageKey, SingularKey>, string> &
  Partial<Record<SingularKey, string>>;
