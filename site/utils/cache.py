import time
from typing import Any, Callable, Dict, Tuple

class TTLCache:
    def __init__(self):
        self._store: Dict[str, Tuple[float, Any]] = {}

    def get(self, key: str) -> Any:
        entry = self._store.get(key)
        if not entry:
            return None
        expires_at, value = entry
        if time.time() > expires_at:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        self._store[key] = (time.time() + ttl_seconds, value)

    def cached(self, key: str, ttl_seconds: int, loader: Callable[[], Any]) -> Any:
        value = self.get(key)
        if value is not None:
            return value
        value = loader()
        self.set(key, value, ttl_seconds)
        return value
