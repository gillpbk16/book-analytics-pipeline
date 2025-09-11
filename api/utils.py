import math
from typing import Optional, Union 

NumberLike = Union[str, float, int, None]

def parse_price(value: NumberLike) -> Optional[float]:
    try:
        s = "" if value is None else str(value)
        s = (
            s.replace("£", "")
            .replace("$", "")
            .replace("€", "")
            .replace(",", "")
            .strip()
        )
        if not s: 
            return None
        x = float(s)
        if math.isnan(x) or math.isinf(x):
            return None
        return x
    except Exception:
        return None
