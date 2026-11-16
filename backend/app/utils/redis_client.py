import json
import logging
from typing import Optional, Any
from datetime import datetime, timedelta

try:
    import redis
    has_redis = True
except ImportError:
    has_redis = False

from app.config import settings

logger = logging.getLogger("shopsmart.redis")

# Fallback in-memory cache if Redis is not running locally
_memory_cache: dict[str, dict[str, Any]] = {}

class CacheClient:
    def __init__(self):
        self.client = None
        # Only attempt redis if explicitly configured and not default unverified localhost during local dev
        if has_redis and settings.REDIS_URL:
            try:
                self.client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=0.15,
                    socket_timeout=0.15
                )
                self.client.ping()
                logger.info("Connected to Redis successfully.")
            except Exception as e:
                # Instantly fallback to in-memory cache
                self.client = None

    def get(self, key: str) -> Optional[Any]:
        if self.client:
            try:
                val = self.client.get(key)
                if val:
                    return json.loads(val)
            except Exception:
                pass
        
        item = _memory_cache.get(key)
        if item:
            if item["expires_at"] > datetime.utcnow():
                return item["value"]
            else:
                _memory_cache.pop(key, None)
        return None

    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        if self.client:
            try:
                serialized = json.dumps(value)
                self.client.setex(key, expire_seconds, serialized)
                return
            except Exception:
                pass
        
        _memory_cache[key] = {
            "value": value,
            "expires_at": datetime.utcnow() + timedelta(seconds=expire_seconds)
        }

    def delete(self, key: str) -> None:
        if self.client:
            try:
                self.client.delete(key)
            except Exception:
                pass
        _memory_cache.pop(key, None)

cache = CacheClient()
