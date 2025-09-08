from pathlib import Path
import json 
import math
from typing import List, Dict, Any
from functools import lru_cache

class DataLoadError(RuntimeError):
    pass

DATA_PATH = (Path(__file__).resolve().parents[1] / "data" / "sample_run.json")

def _load_raw_books() -> List[Dict[str, Any]]:
    try: 
        text = DATA_PATH.read_text(encoding="utf-8")
        data = json.loads(text)
        if not isinstance(data, list):
            raise DataLoadError("Books data is not a list")
        return data
    except FileNotFoundError as e:
        raise DataLoadError(f"Data file not found: {DATA_PATH}") from e
    except json.JSONDecodeError as e:
        raise DataLoadError(f"Invalid JSON in {DATA_PATH}: {e}") from e

def _parse_prices(s):
    try:
        value = float(str(s).replace("£", "").replace("$", "").replace("€", "").replace(",", "").strip())
        if math.isnan(value) or math.isinf(value):
            return None
        return value
    except Exception:
        return None
    
def _normalise_item(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": (raw.get("id") or raw.get("url") or "").strip(),
        "title": (raw.get("title") or "").strip(),
        "url": (raw.get("url") or "").strip(),
        "price": _parse_prices(raw.get("price") or "0"),
        "availability": (raw.get("availability") or "").strip()
    }

@lru_cache(maxsize=1)
def load_books() -> List[Dict[str, Any]]:
    raw_books = _load_raw_books()
    return [_normalise_item(raw) for raw in raw_books]