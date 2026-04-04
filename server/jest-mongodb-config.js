module.exports = {
    mongodbMemoryServerOptions: {
        binary: {
            skipMD5: true,
        },
        autoStart: false,
        instance: {},
        replSet: {
            count: 1,
            storageEngine: 'wiredTiger',
        },
    },
};
