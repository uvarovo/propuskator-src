module.exports = {
    production : {
        port     : process.env.DB_PORT || 3306,
        username : process.env.DB_USER,
        password : process.env.DB_PASSWORD,
        database : process.env.DB_NAME,
        host     : process.env.DB_HOST,
        dialect  : 'mysql',
        pool     : {
            max     : +process.env.DB_POOL_MAX     || 64,
            min     : +process.env.DB_POOL_MIN     || 32,
            acquire : +process.env.DB_POOL_ACQUIRE || 5000,
            idle    : +process.env.DB_POOL_IDLE    || 2500
        },
        logging : !!process.env.DB_QUERY_LOG || false
    },
    development : {
        port     : process.env.DB_PORT || 3306,
        username : process.env.DB_USER,
        password : process.env.DB_PASSWORD,
        database : process.env.DB_NAME,
        host     : process.env.DB_HOST,
        dialect  : 'mysql',
        pool     : {
            max     : +process.env.DB_POOL_MAX     || 64,
            min     : +process.env.DB_POOL_MIN     || 32,
            acquire : +process.env.DB_POOL_ACQUIRE || 60000,
            idle    : +process.env.DB_POOL_IDLE    || 2500
        },
        logging : !!process.env.DB_QUERY_LOG || false
    },
    test : {
        port     : process.env.DB_PORT_TEST || 3306,
        username : process.env.DB_USER,
        password : process.env.DB_PASSWORD,
        database : process.env.DB_NAME_TEST,
        host     : process.env.DB_HOST_TEST,
        dialect  : 'mysql',
        pool     : {
            max     : +process.env.DB_POOL_MAX     || 64,
            min     : +process.env.DB_POOL_MIN     || 32,
            acquire : +process.env.DB_POOL_ACQUIRE || 5000,
            idle    : +process.env.DB_POOL_IDLE    || 2500
        },
        logging : !!process.env.DB_QUERY_LOG || false
    }
};
