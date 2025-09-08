from api.db import _parse_prices

def test_parse_prices_valid():
    assert _parse_prices("$10.50") == 10.5

def test_parse_prices_empty():
    assert _parse_prices("") == None

def test_parse_prices_nan():
    assert _parse_prices("nan") == None

def test_parse_prices_none():
    assert _parse_prices(None) == None