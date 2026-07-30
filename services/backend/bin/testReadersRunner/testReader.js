const { workerData } = require('worker_threads');
const crypto = require('crypto');

const { ADMIN_EMAIL, MQTT_URL, MQTT_PASS, SERVER_URL, MQTT_USERNAME, READER_CODE, X_AUTH_TOKEN } = workerData;
// const ROOT_TOPIC = '';
const ROOT_TOPIC = crypto.createHash('sha256').update(ADMIN_EMAIL).digest('hex');

const fetch = require('node-fetch');
const BaseBridge = require('homie-sdk/lib/Bridge/Base');
const BaseDeviceBridge = require('homie-sdk/lib/Bridge/BaseDevice');
const BaseNodeBridge = require('homie-sdk/lib/Bridge/BaseNode');
const BasePropertyBridge = require('homie-sdk/lib/Bridge/BaseProperty');
const BasePropertyTransport = require('homie-sdk/lib/Bridge/BasePropertyTransport');
const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');

async function sync(time = 0) {
    console.log('start sync', { time });
    const res = await fetch(`http://${SERVER_URL}/api/v1/token-reader/access-tokens/sync`, {
        method  : 'post',
        body    : `${time}`,
        headers : {
            'X-AuthToken'  : X_AUTH_TOKEN,
            'X-AuthReader' : READER_CODE
        }
    });

    if (res.status !== 200) throw new Error(`BadResponse(Status ${res.status})`);
    const result = await res.text();

    let [ timestamp_minutes, tokens_to_delete, rules ] = result.split('%');

    timestamp_minutes = parseInt(timestamp_minutes);
    tokens_to_delete = tokens_to_delete.split(',').filter(v => v);
    rules = rules.split('\n').map(s => s.trim()).filter(s => s).map(r => {
        r = r.split('/');
        console.log(r);
        const code = r.shift().slice(0, -1);

        r = r.join('/');
        r = r.split('_');
        const rule = r.shift();

        let data = null;

        if (rule === '1') {
            data = {
                from_timestamp_in_minutes : parseInt(r[0], 10),
                to_timestamp_in_minutes   : parseInt(r[1], 10)
            };
        } else if (rule === '3') {
            data = {
                from_timestamp_in_minutes : parseInt(r[0], 10),
                to_timestamp_in_minutes   : parseInt(r[1], 10),
                week_mask                 : r[2].split('').map(v => v === '1')
            };
        } else if (rule === '7') {
            data = {
                from_timestamp_in_minutes : parseInt(r[0], 10),
                to_timestamp_in_minutes   : parseInt(r[1], 10),
                week_mask                 : r[2].split('').map(v => v === '1'),
                from_timestamp_in_minutes : parseInt(r[3], 10),
                to_timestamp_in_minutes   : parseInt(r[4], 10)
            };
        } else if (rule === '9') {
            data = {
                allow : r[0] === '1'
            };
        }

        return {
            code, rule, data
        };
    });

    return { timestamp_minutes, tokens_to_delete, rules };
}
async function sendLogs(logs) {
    const res = await fetch(`http://${SERVER_URL}/api/v1/access-logs`, {
        method  : 'post',
        body    : logs.map(({ timestampseconds, code, state }) => `${timestampseconds}_${code}_${state ? '1' : '0'}`).join(','),
        headers : {
            'X-AuthToken'  : X_AUTH_TOKEN,
            'X-AuthReader' : READER_CODE
        }
    });

    if (res.status !== 200) throw new Error(`BadResponse(Status ${res.status})`);
}
class Bridge extends BaseBridge {
    constructor(...args) {
        super(...args);
        this.lastSyncTimestampMinutes = 0;
        this.rules = {};
    }
    init() {
        super.init();
        this.accessSync();
    }
    async accessSync() {
        if (this.accessSyncing) return;
        clearTimeout(this.accessSyncTimeout);
        this.accessSyncing = true;
        try {
            const { timestamp_minutes, tokens_to_delete, rules } = await sync(this.lastSyncTimestampMinutes);

            console.log({ timestamp_minutes, tokens_to_delete, rules });
            for (const code of tokens_to_delete) {
                delete this.rules[code];
            }
            for (const { code, rule, data } of rules) {
                this.rules[code] = this.rules[code] || [];
                this.rules[code].push({ rule, data });
            }
            this.lastSyncTimestampMinutes = timestamp_minutes;
            console.log('synced');
        } catch (e) {
            this.handleErrorPropagate(e);
        }
        this.accessSyncing = false;
        this.accessSyncTimeout = setTimeout(this.accessSync.bind(this), this.deviceBridge.updateInterval * 1000);
    }
}
class CustomTransport extends BasePropertyTransport {
    constructor(config) {
        super(config);

        if (config.methods) {
            for (const name of Object.keys(config.methods)) {
                this[name] = config.methods[name].bind(this);
            }
        }
        if (config.attachBridge) {
            this._attachBridge = config.attachBridge.bind(this);
        }
        if (config.detachBridge) {
            this._detachBridge = config.detachBridge.bind(this);
        }
    }
    attachBridge(bridge) {
        if (this.bridge) {
            if (bridge === this.bridge) return;
            throw new Error('Another bridge is already attached.');
        }
        super.attachBridge(bridge);
        if (this._attachBridge) this._attachBridge();
        this.pulled = false;
        this.enablePolling();
    }
    detachBridge() {
        if (this._detachBridge) this._detachBridge();
        super.detachBridge();
        this.pulled = false;
        this.disablePolling();
    }
    // sync
    // async
    // handlers~
    // ~handlers
}
class BooleanParser extends BaseParser {
    constructor() {
        super({ type: 'boolean', homieDataType: 'boolean' });
    }
    fromHomie(data) {
        return [ Boolean(JSON.parse(data)) ];
    }
    toHomie(data) {
        return `${data}`;
    }
}
class FloatParser extends BaseParser {
    constructor() {
        super({ type: 'float', homieDataType: 'float' });
    }
    fromHomie(data) {
        return [ parseFloat(data) ];
    }
    toHomie(data) {
        return `${data}`;
    }
}
class DeviceBridge extends BaseDeviceBridge {
    constructor(config) {
        super({
            ...config,
            nodes : [ new BaseNodeBridge({
                id      : 'd',
                name    : 'Door',
                sensors : [
                    new BasePropertyBridge({
                        id       : 's',
                        name     : 'State',
                        settable : true,
                        retained : true,
                        dataType : 'boolean'
                    }, {
                        type      : 'sensor',
                        parser    : new BooleanParser(),
                        transport : new CustomTransport({
                            pollInterval : 0,
                            methods      : {
                                get() {
                                    const data = this.bridge.deviceBridge.doorState;

                                    this.handleNewData(data);

                                    return data;
                                },
                                set() {
                                    console.log('open doors');
                                    const triggerMode = this.bridge.deviceBridge.triggerMode;
                                    const doorState = this.bridge.deviceBridge.doorState;

                                    console.log({ triggerMode, doorState });
                                    clearInterval(this.doorTimeout);

                                    const data = triggerMode ? !doorState : true;

                                    if (!triggerMode) {
                                        this.doorTimeout = setTimeout(() => {
                                            console.log({ doorState: false });
                                            this.handleNewData(false, false);
                                        }, this.bridge.deviceBridge.openDoorTime * 1000);
                                    }
                                    this.bridge.deviceBridge.doorState = data;
                                    console.log({ doorState: data });
                                    this.handleNewData(data, true);

                                    return data;
                                }
                            }
                        })
                    }),
                    new BasePropertyBridge({
                        id       : 'k',
                        name     : 'Token',
                        settable : true,
                        retained : true,
                        dataType : 'string'
                    }, {
                        type      : 'sensor',
                        transport : new CustomTransport({
                            pollInterval : 0,
                            methods      : {
                                async get() {
                                    const data = this.bridge.deviceBridge.doorState;

                                    this.handleNewData(data);

                                    return data;
                                },
                                async set(code) {
                                    console.log('open doors with ', code, !!this.bridge.deviceBridge, !!this.bridge.rules[code]);
                                    if (!this.bridge.rules[code]) throw new Error('Unsupported token');

                                    const sensor = this.bridge.deviceBridge.nodes.find(({ id }) => id === 'd').sensors.find(({ id }) => id === 's');

                                    this.handleNewData(code, true);
                                    await sensor.transport.set(true);
                                }
                            }
                        })
                    })
                ]
            }) ],
            options : [
                new BasePropertyBridge({
                    id       : 'ui',
                    name     : 'Update interval',
                    settable : true,
                    retained : true,
                    dataType : 'float',
                    unit     : 's'
                }, {
                    type      : 'option',
                    parser    : new FloatParser(),
                    transport : new CustomTransport({
                        pollInterval : 0,
                        methods      : {
                            get() {
                                const data = this.bridge.deviceBridge.updateInterval;

                                this.handleNewData(data);

                                return data;
                            },
                            set(value) {
                                clearInterval(this.doorTimeout);
                                this.bridge.deviceBridge.updateInterval = value;
                                this.bridge.accessSync();
                                this.handleNewData(value, true);

                                return value;
                            }
                        }
                    })
                }),
                new BasePropertyBridge({
                    id       : 'odt',
                    name     : 'Open door time',
                    settable : true,
                    retained : true,
                    dataType : 'float',
                    unit     : 's'
                }, {
                    type      : 'option',
                    parser    : new FloatParser(),
                    transport : new CustomTransport({
                        pollInterval : 0,
                        methods      : {
                            get() {
                                const data = this.bridge.deviceBridge.openDoorTime;

                                this.handleNewData(data);

                                return data;
                            },
                            set(value) {
                                this.bridge.deviceBridge.openDoorTime = value;
                                this.handleNewData(value, true);

                                return value;
                            }
                        }
                    })
                }),
                new BasePropertyBridge({
                    id       : 'l',
                    name     : 'Lock type',
                    settable : true,
                    retained : true,
                    dataType : 'enum',
                    format   : 'Magnet,Latch'
                }, {
                    type      : 'option',
                    transport : new CustomTransport({
                        pollInterval : 0,
                        methods      : {
                            get() {
                                const data = this.bridge.deviceBridge.lockType;

                                this.handleNewData(data);

                                return data;
                            },
                            set(value) {
                                this.bridge.deviceBridge.lockType = value;
                                this.handleNewData(value, true);

                                return value;
                            }
                        }
                    })
                }),
                new BasePropertyBridge({
                    id       : 'pie',
                    name     : 'Permision in emergency',
                    settable : true,
                    retained : true,
                    dataType : 'boolean'
                }, {
                    type      : 'option',
                    parser    : new BooleanParser(),
                    transport : new CustomTransport({
                        pollInterval : 0,
                        methods      : {
                            get() {
                                const data = this.bridge.deviceBridge.permisionInEmergency;

                                this.handleNewData(data);

                                return data;
                            },
                            set(value) {
                                this.bridge.deviceBridge.permisionInEmergency = value;
                                this.handleNewData(value, true);

                                return value;
                            }
                        }
                    })
                }),
                new BasePropertyBridge({
                    id       : 'tm',
                    name     : 'Trigger mode',
                    settable : true,
                    retained : true,
                    dataType : 'boolean',
                    parser   : new BooleanParser()
                }, {
                    type      : 'option',
                    transport : new CustomTransport({
                        pollInterval : 0,
                        methods      : {
                            get() {
                                const data = this.bridge.deviceBridge.triggerMode;

                                this.handleNewData(data);

                                return data;
                            },
                            set(value) {
                                this.bridge.deviceBridge.triggerMode = value;
                                this.handleNewData(value, true);

                                return value;
                            }
                        }
                    })
                }),
                new BasePropertyBridge({
                    id       : 'test-boolean',
                    name     : 'test-boolean',
                    settable : true,
                    retained : true,
                    dataType : 'boolean',
                    value    : true
                }, {
                    type : 'option'
                }),
                new BasePropertyBridge({
                    id       : 'test-float',
                    name     : 'test-float',
                    settable : true,
                    retained : true,
                    dataType : 'float',
                    value    : 1.5
                }, {
                    type : 'option'
                }),
                new BasePropertyBridge({
                    id       : 'test-integer',
                    name     : 'test-integer',
                    settable : true,
                    retained : true,
                    dataType : 'integer',
                    value    : 16
                }, {
                    type : 'option'
                }),
                new BasePropertyBridge({
                    id       : 'test-string',
                    name     : 'test-string',
                    settable : true,
                    retained : true,
                    dataType : 'string',
                    value    : 'string'
                }, {
                    type : 'option'
                }),
                new BasePropertyBridge({
                    id       : 'test-enum',
                    name     : 'test-enum',
                    settable : true,
                    retained : true,
                    dataType : 'enum',
                    format   : 'value1,value2,valu3',
                    value    : 'value1'
                }, {
                    type : 'option'
                }),
                new BasePropertyBridge({
                    id       : 'test-color-rgb',
                    name     : 'test-color-rgb',
                    settable : true,
                    retained : true,
                    dataType : 'color',
                    format   : 'rgb',
                    value    : '100,100,100'
                }, {
                    type : 'option'
                }),
                new BasePropertyBridge({
                    id       : 'test-color-hsv',
                    name     : 'test-color-hsv',
                    settable : true,
                    retained : true,
                    dataType : 'color',
                    format   : 'hsv',
                    value    : '100,100,100'
                }, {
                    type : 'option'
                })
            ]
        });
        this.doorState = false;
        this.updateInterval = 30;
        this.openDoorTime = 3;
        this.lockType = 'Latch';
        this.permisionInEmergency = true;
        this.triggerMode = false;
    }
}
/*
* you can add telemetry and any other properties in constructor
* or by using addNode, addSensor, addOption and addTelemetry
* at any moment
*/
try {
    const device = new DeviceBridge({
        id : READER_CODE
    });

    device.connected = true;

    const bridge = new Bridge({
        mqttConnection : {
            rootTopic : ROOT_TOPIC,
            username  : MQTT_USERNAME,
            password  : MQTT_PASS,
            uri       : `mqtt://${MQTT_URL}`
        },
        device
    });

    bridge.init();
    bridge.on('error', error => {
        if (error.message === 'Connection refused: Not authorized') return; // skip
        console.log(error);
    });
    bridge.on('exit', (reason, exit_code) => {
        if (reason === 'Connection refused: Not authorized') return; // skip
        console.log(`Bye. ${reason}`);
        // process.exit(exit_code);
    });
} catch (e) {
    console.log(e);
    process.exit(1);
}
