"""
Streak calculation service.

A streak is a consecutive sequence of days where the user logged the habit
with slipped=False (resisted). Any day with a slipped=True entry or a missing
log breaks the current streak but does not affect the longest streak retroactively.
"""
from datetime import date, timedelta
from typing import List


def calculate_streaks(log_dates: List[str], slipped_flags: List[bool]) -> tuple[int, int]:
    """
    Calculate current and longest streaks from log data.

    Args:
        log_dates: List of ISO date strings ('YYYY-MM-DD') for each log entry.
        slipped_flags: Corresponding list of booleans — True if user slipped that day.

    Returns:
        (current_streak, longest_streak) as a tuple of ints.
    """
    if not log_dates:
        return 0, 0

    # Build sets of success and slip dates
    success_dates: set[date] = set()
    slip_dates: set[date] = set()
    for log_date_str, slipped in zip(log_dates, slipped_flags):
        d = date.fromisoformat(log_date_str)
        if slipped:
            slip_dates.add(d)
        else:
            success_dates.add(d)

    if not success_dates:
        return 0, 0

    sorted_dates = sorted(success_dates)

    # Calculate longest streak
    longest = 1
    current_run = 1
    for i in range(1, len(sorted_dates)):
        if sorted_dates[i] - sorted_dates[i - 1] == timedelta(days=1):
            current_run += 1
            longest = max(longest, current_run)
        else:
            current_run = 1

    # Calculate current streak:
    # - If there's a slip today, current streak is 0 (today explicitly broke it)
    # - Otherwise walk back from today counting consecutive success days
    today = date.today()

    if today in slip_dates:
        return 0, longest

    current_streak = 0
    check_date = today

    while check_date in success_dates:
        current_streak += 1
        check_date -= timedelta(days=1)

    # If today has no entry yet, also accept a streak ending yesterday
    if current_streak == 0:
        check_date = today - timedelta(days=1)
        while check_date in success_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

    return current_streak, longest
