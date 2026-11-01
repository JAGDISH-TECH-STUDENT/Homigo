const Redis = require("ioredis");
const apicacheModule = require("apicache");

let redis = null;
let cache = null;
let apicacheInstance = null;

if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        enableReadyCheck: true,
        connectionName: "homigo-api"
    });

    redis.on("error", (err) => {
        console.log("Redis connection error:", err.message);
    });

    redis.on("connect", () => {
        console.log("Connected to Redis");
    });

    const redisStore = {
        get: async (key) => {
            try {
                const data = await redis.get(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                return null;
            }
        },
        set: async (key, value, duration) => {
            try {
                await redis.set(key, JSON.stringify(value), "EX", duration / 1000);
            } catch (e) {
                // fail silently
            }
        },
        clear: async () => {
            try {
                await redis.flushdb();
            } catch (e) {
                // fail silently
            }
        }
    };

    apicacheInstance = apicacheModule.newInstance();
    apicacheInstance.options({ redis: redisStore });
    cache = apicacheInstance.middleware;
} else {
    apicacheInstance = apicacheModule.newInstance();
    cache = apicacheInstance.middleware;
}

function clearCache(target) {
    try {
        if (apicacheInstance && typeof apicacheInstance.clear === "function") {
            apicacheInstance.clear(target);
        }
        if (typeof apicacheModule.clear === "function") {
            apicacheModule.clear(target);
        }
    } catch (e) {
        // fail silently
    }
}

module.exports = { cache, redis, apicache: apicacheInstance, clearCache };
