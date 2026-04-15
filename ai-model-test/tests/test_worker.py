import pytest
from unittest.mock import MagicMock, patch

import worker


def test_upsert_birdguess_returns_empty_when_no_best_guesses():
    conn = MagicMock()
    result = {"best_guesses": []}

    out = worker.upsert_birdguess(conn, 123, result, "model-name")

    assert out == []


@patch("worker.get_or_create_species")
def test_upsert_birdguess_uses_top_guess(mock_get_or_create_species):
    mock_get_or_create_species.return_value = 7

    conn = MagicMock()
    cur = MagicMock()
    cur.fetchone.return_value = {
        "record_id": 123,
        "species_id": 7,
        "model": "model-name",
        "model_confidence": 0.91,
    }

    conn.cursor.return_value.__enter__.return_value = cur

    result = {
        "best_guesses": [
            {"label": "american kestrel", "score": 0.91},
            {"label": "crow", "score": 0.30},
        ]
    }

    out = worker.upsert_birdguess(conn, 123, result, "model-name")

    mock_get_or_create_species.assert_called_once_with(conn, "american kestrel")
    cur.execute.assert_called()
    assert out["species_id"] == 7


def test_get_or_create_species_normalizes_label():
    conn = MagicMock()
    cur = MagicMock()
    cur.fetchone.return_value = {"species_id": 5}

    conn.cursor.return_value.__enter__.return_value = cur

    species_id = worker.get_or_create_species(conn, "  american   kestrel ")

    args = cur.execute.call_args[0]
    assert args[1][0] == "American Kestrel"
    assert species_id == 5