"""
Tests: streak calculation logic — pure unit tests, no network needed.
"""
import pytest
from datetime import date, timedelta
from services.streak import calculate_streaks


def _dates_from_today(days_back: list[int]) -> list[str]:
    today = date.today()
    return [(today - timedelta(days=d)).isoformat() for d in days_back]


def test_no_logs_returns_zero():
    current, longest = calculate_streaks([], [])
    assert current == 0
    assert longest == 0


def test_all_slipped_returns_zero_current():
    dates = _dates_from_today([0, 1, 2])
    flags = [True, True, True]
    current, longest = calculate_streaks(dates, flags)
    assert current == 0


def test_consecutive_resists_count_as_streak():
    dates = _dates_from_today([0, 1, 2, 3])
    flags = [False, False, False, False]
    current, longest = calculate_streaks(dates, flags)
    assert current == 4
    assert longest == 4


def test_single_slip_breaks_current_streak():
    # Today slipped, yesterday and before resisted
    dates = _dates_from_today([0, 1, 2])
    flags = [True, False, False]
    current, longest = calculate_streaks(dates, flags)
    assert current == 0


def test_streak_ending_yesterday_still_active():
    # No log today but yesterday and before resisted — streak should still show
    dates = _dates_from_today([1, 2, 3])
    flags = [False, False, False]
    current, longest = calculate_streaks(dates, flags)
    assert current == 3


def test_gap_breaks_streak():
    # Days 0, 1 resisted, then gap (day 3 resisted) — streak reset
    dates = _dates_from_today([0, 1, 3])
    flags = [False, False, False]
    current, longest = calculate_streaks(dates, flags)
    # Current streak is 2 (today and yesterday only)
    assert current == 2
    assert longest == 2


def test_longest_streak_tracks_historical_best():
    # 5-day streak from a week ago, only 2 days now
    old_dates = [
        (date.today() - timedelta(days=d)).isoformat() for d in [8, 9, 10, 11, 12]
    ]
    recent_dates = _dates_from_today([0, 1])
    all_dates = old_dates + recent_dates
    all_flags = [False] * len(all_dates)
    current, longest = calculate_streaks(all_dates, all_flags)
    assert longest == 5
    assert current == 2


def test_auth_middleware_rejects_missing_token():
    """Placeholder — full auth middleware tests in test_auth.py."""
    pass
