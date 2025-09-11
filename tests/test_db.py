from api.utils import parse_price

def test_parse_prices_valid():
    assert parse_price("$10.50") == 10.5

def test_parse_prices_empty():
    assert parse_price("") == None

def test_parse_prices_nan():
    assert parse_price("nan") == None

def test_parse_prices_none():
    assert parse_price(None) == None