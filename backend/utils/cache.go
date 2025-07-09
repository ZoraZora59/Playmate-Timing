package utils

import (
	"encoding/json"
	"time"

	"github.com/patrickmn/go-cache"
)

var cacheInstance *cache.Cache

// InitCache 初始化缓存
func InitCache(defaultExpiration, cleanupInterval time.Duration) {
	cacheInstance = cache.New(defaultExpiration, cleanupInterval)
}

// GetCache 获取缓存实例
func GetCache() *cache.Cache {
	return cacheInstance
}

// SetCache 设置缓存
func SetCache(key string, value interface{}, expiration time.Duration) {
	if cacheInstance != nil {
		cacheInstance.Set(key, value, expiration)
	}
}

// GetCache 获取缓存
func GetCacheValue(key string) (interface{}, bool) {
	if cacheInstance != nil {
		return cacheInstance.Get(key)
	}
	return nil, false
}

// DeleteCache 删除缓存
func DeleteCache(key string) {
	if cacheInstance != nil {
		cacheInstance.Delete(key)
	}
}

// SetCacheJSON 设置JSON格式缓存
func SetCacheJSON(key string, value interface{}, expiration time.Duration) error {
	if cacheInstance == nil {
		return nil
	}
	
	jsonData, err := json.Marshal(value)
	if err != nil {
		return err
	}
	
	cacheInstance.Set(key, string(jsonData), expiration)
	return nil
}

// GetCacheJSON 获取JSON格式缓存
func GetCacheJSON(key string, result interface{}) error {
	if cacheInstance == nil {
		return nil
	}
	
	value, found := cacheInstance.Get(key)
	if !found {
		return nil
	}
	
	jsonStr, ok := value.(string)
	if !ok {
		return nil
	}
	
	return json.Unmarshal([]byte(jsonStr), result)
}

// FlushCache 清空所有缓存
func FlushCache() {
	if cacheInstance != nil {
		cacheInstance.Flush()
	}
}