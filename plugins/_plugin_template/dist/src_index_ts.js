"use strict";
exports.ids = ["src_index_ts"];
exports.modules = {
"./src/contract.ts": 
/*!*************************!*\
  !*** ./src/contract.ts ***!
  \*************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  contract: () => (/* reexport safe */ _data_provider_shared_contract__WEBPACK_IMPORTED_MODULE_0__.contract)
});
/* ESM import */var _data_provider_shared_contract__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @data-provider/shared-contract */ "../../packages/shared-contract/dist/index.mjs");



}),
"./src/index.ts": 
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (__WEBPACK_DEFAULT_EXPORT__)
});
/* ESM import */var every_plugin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! every-plugin */ "webpack/sharing/consume/default/every-plugin/every-plugin?6edd");
/* ESM import */var every_plugin__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(every_plugin__WEBPACK_IMPORTED_MODULE_0__);
/* ESM import */var every_plugin_effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! every-plugin/effect */ "../../node_modules/.bun/every-plugin@0.4.10+914b6fe990853d82/node_modules/every-plugin/dist/effect.mjs");
/* ESM import */var every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! every-plugin/zod */ "../../node_modules/.bun/every-plugin@0.4.10+914b6fe990853d82/node_modules/every-plugin/dist/zod.mjs");
/* ESM import */var _contract__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./contract */ "./src/contract.ts");
/* ESM import */var _service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./service */ "./src/service.ts");
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _ts_generator(thisArg, body) {
    var f, y, t, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
function _ts_values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function() {
            if (o && i >= o.length) o = void 0;
            return {
                value: o && o[i++],
                done: !o
            };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}





/**
 * Data Provider Plugin Template - Template for building single-provider bridge data adapters.
 *
 * This template demonstrates how to implement the data provider contract for one provider.
 * Choose ONE provider (LayerZero, Wormhole, CCTP, Across, deBridge, Axelar, Li.Fi) and
 * replace the mock implementation with actual API calls.
 * 
 */ /* ESM default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,every_plugin__WEBPACK_IMPORTED_MODULE_0__.createPlugin)({
    variables: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
        baseUrl: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.string().url().default("https://api.example.com"),
        timeout: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.number().min(1000).max(60000).default(10000)
    }),
    secrets: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
        apiKey: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.string().min(1, "API key is required")
    }),
    contract: _contract__WEBPACK_IMPORTED_MODULE_3__.contract,
    initialize: function(config) {
        return every_plugin_effect__WEBPACK_IMPORTED_MODULE_1__.Effect.gen(function() {
            var service;
            return _ts_generator(this, function(_state) {
                switch(_state.label){
                    case 0:
                        // Create service instance with config
                        service = new _service__WEBPACK_IMPORTED_MODULE_4__.DataProviderService(config.variables.baseUrl, config.secrets.apiKey, config.variables.timeout);
                        // Test the connection during initialization
                        return [
                            5,
                            _ts_values(service.ping())
                        ];
                    case 1:
                        _state.sent();
                        return [
                            2,
                            {
                                service: service
                            }
                        ];
                }
            });
        });
    },
    shutdown: function() {
        return every_plugin_effect__WEBPACK_IMPORTED_MODULE_1__.Effect["void"];
    },
    createRouter: function(context, builder) {
        var service = context.service;
        return {
            getSnapshot: builder.getSnapshot.handler(function(param) {
                var input = param.input;
                return _async_to_generator(function() {
                    var snapshot;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                return [
                                    4,
                                    every_plugin_effect__WEBPACK_IMPORTED_MODULE_1__.Effect.runPromise(service.getSnapshot(input))
                                ];
                            case 1:
                                snapshot = _state.sent();
                                return [
                                    2,
                                    snapshot
                                ];
                        }
                    });
                })();
            }),
            ping: builder.ping.handler(function() {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                return [
                                    4,
                                    every_plugin_effect__WEBPACK_IMPORTED_MODULE_1__.Effect.runPromise(service.ping())
                                ];
                            case 1:
                                return [
                                    2,
                                    _state.sent()
                                ];
                        }
                    });
                })();
            })
        };
    }
}));


}),
"./src/service.ts": 
/*!************************!*\
  !*** ./src/service.ts ***!
  \************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  DataProviderService: () => (DataProviderService)
});
/* ESM import */var every_plugin_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! every-plugin/effect */ "../../node_modules/.bun/every-plugin@0.4.10+914b6fe990853d82/node_modules/every-plugin/dist/effect.mjs");
function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
function _iterable_to_array_limit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _non_iterable_rest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
function _ts_generator(thisArg, body) {
    var f, y, t, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}

/**
 * Data Provider Service - Collects cross-chain bridge metrics from a single provider.
 *
 * Replace empty implementations with actual provider API calls
 * (LayerZero, Wormhole, CCTP, Across, deBridge, Axelar, Li.Fi, etc.)
 */ var DataProviderService = /*#__PURE__*/ function() {
    "use strict";
    function DataProviderService(baseUrl, apiKey, timeout) {
        _class_call_check(this, DataProviderService);
        _define_property(this, "baseUrl", void 0);
        _define_property(this, "apiKey", void 0);
        _define_property(this, "timeout", void 0);
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.timeout = timeout;
    }
    _create_class(DataProviderService, [
        {
            /**
   * Get complete snapshot of provider data for given routes and notionals.
   */ key: "getSnapshot",
            value: function getSnapshot(params) {
                var _this = this;
                return every_plugin_effect__WEBPACK_IMPORTED_MODULE_0__.Effect.tryPromise({
                    try: function() {
                        return _async_to_generator(function() {
                            var hasRoutes, hasNotionals, _ref, volumes, listedAssets, rates, _tmp, liquidity, _tmp1;
                            return _ts_generator(this, function(_state) {
                                switch(_state.label){
                                    case 0:
                                        hasRoutes = params.routes && params.routes.length > 0;
                                        hasNotionals = params.notionals && params.notionals.length > 0;
                                        return [
                                            4,
                                            Promise.all([
                                                this.getVolumes(params.includeWindows || [
                                                    "24h"
                                                ]),
                                                this.getListedAssets()
                                            ])
                                        ];
                                    case 1:
                                        _ref = _sliced_to_array.apply(void 0, [
                                            _state.sent(),
                                            2
                                        ]), volumes = _ref[0], listedAssets = _ref[1];
                                        if (!(hasRoutes && hasNotionals)) return [
                                            3,
                                            3
                                        ];
                                        return [
                                            4,
                                            this.getRates(params.routes, params.notionals)
                                        ];
                                    case 2:
                                        _tmp = _state.sent();
                                        return [
                                            3,
                                            4
                                        ];
                                    case 3:
                                        _tmp = [];
                                        _state.label = 4;
                                    case 4:
                                        rates = _tmp;
                                        if (!hasRoutes) return [
                                            3,
                                            6
                                        ];
                                        return [
                                            4,
                                            this.getLiquidityDepth(params.routes)
                                        ];
                                    case 5:
                                        _tmp1 = _state.sent();
                                        return [
                                            3,
                                            7
                                        ];
                                    case 6:
                                        _tmp1 = [];
                                        _state.label = 7;
                                    case 7:
                                        liquidity = _tmp1;
                                        return [
                                            2,
                                            _object_spread({
                                                volumes: volumes,
                                                listedAssets: listedAssets
                                            }, rates.length > 0 && {
                                                rates: rates
                                            }, liquidity.length > 0 && {
                                                liquidity: liquidity
                                            })
                                        ];
                                }
                            });
                        }).call(_this);
                    },
                    catch: function(error) {
                        return new Error("Failed to fetch snapshot: ".concat(_instanceof(error, Error) ? error.message : String(error)));
                    }
                });
            }
        },
        {
            key: "getVolumes",
            value: /**
   * Fetch volume metrics for specified time windows.
   * TODO: Implement provider's volume API endpoint
   */ function getVolumes(windows) {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            []
                        ];
                    });
                })();
            }
        },
        {
            key: "getRates",
            value: /**
   * Fetch rate quotes for route/notional combinations.
   * TODO: Implement provider's quote API endpoint
   */ function getRates(routes, notionals) {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            []
                        ];
                    });
                })();
            }
        },
        {
            key: "getLiquidityDepth",
            value: /**
   * Fetch liquidity depth at 50bps and 100bps thresholds.
   * TODO: Implement provider's liquidity API or simulate with quotes
   */ function getLiquidityDepth(routes) {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            []
                        ];
                    });
                })();
            }
        },
        {
            key: "getListedAssets",
            value: /**
   * Fetch list of assets supported by the provider.
   * TODO: Implement provider's assets API endpoint
   */ function getListedAssets() {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            {
                                assets: [],
                                measuredAt: new Date().toISOString()
                            }
                        ];
                    });
                })();
            }
        },
        {
            key: "ping",
            value: function ping() {
                return every_plugin_effect__WEBPACK_IMPORTED_MODULE_0__.Effect.tryPromise({
                    try: function() {
                        return _async_to_generator(function() {
                            return _ts_generator(this, function(_state) {
                                return [
                                    2,
                                    {
                                        status: "ok",
                                        timestamp: new Date().toISOString()
                                    }
                                ];
                            });
                        })();
                    },
                    catch: function(error) {
                        return new Error("Health check failed: ".concat(_instanceof(error, Error) ? error.message : String(error)));
                    }
                });
            }
        }
    ]);
    return DataProviderService;
}();


}),
"../../packages/shared-contract/dist/index.mjs": 
/*!*****************************************************!*\
  !*** ../../packages/shared-contract/dist/index.mjs ***!
  \*****************************************************/
(function (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  contract: () => (contract)
});
/* ESM import */var every_plugin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! every-plugin */ "webpack/sharing/consume/default/every-plugin/every-plugin?7cfc");
/* ESM import */var every_plugin_orpc__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! every-plugin/orpc */ "../../node_modules/.bun/every-plugin@0.4.9+914b6fe990853d82/node_modules/every-plugin/dist/orpc.mjs");
/* ESM import */var every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! every-plugin/zod */ "../../node_modules/.bun/every-plugin@0.4.9+914b6fe990853d82/node_modules/every-plugin/dist/zod.mjs");




//#region contract.ts
const Asset = every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
	chainId: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.string(),
	assetId: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.string(),
	symbol: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.string(),
	decimals: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.number().int().min(0)
});
const Rate = every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
	source: Asset,
	destination: Asset,
	amountIn: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.string(),
	amountOut: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.string(),
	effectiveRate: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.number().describe("amountOut/amountIn normalized for decimals"),
	totalFeesUsd: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.number().nullable(),
	quotedAt: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.iso.datetime()
});
const LiquidityDepthPoint = every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
	maxAmountIn: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.string(),
	slippageBps: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.number()
});
const LiquidityDepth = every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
	route: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
		source: Asset,
		destination: Asset
	}),
	thresholds: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.array(LiquidityDepthPoint),
	measuredAt: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.iso.datetime()
});
const VolumeWindow = every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
	window: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z["enum"]([
		"24h",
		"7d",
		"30d"
	]),
	volumeUsd: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.number(),
	measuredAt: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.iso.datetime()
});
const ListedAssets = every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
	assets: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.array(Asset),
	measuredAt: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.iso.datetime()
});
const ProviderSnapshot = every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
	volumes: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.array(VolumeWindow),
	listedAssets: ListedAssets,
	rates: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.array(Rate).optional(),
	liquidity: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.array(LiquidityDepth).optional()
});
const contract = every_plugin_orpc__WEBPACK_IMPORTED_MODULE_1__.oc.router({
	getSnapshot: every_plugin_orpc__WEBPACK_IMPORTED_MODULE_1__.oc.route({
		method: "POST",
		path: "/snapshot"
	}).input(every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
		routes: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.array(every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
			source: Asset,
			destination: Asset
		})).optional(),
		notionals: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.array(every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.string()).optional(),
		includeWindows: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.array(every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z["enum"]([
			"24h",
			"7d",
			"30d"
		])).default(["24h"]).optional()
	})).output(ProviderSnapshot).errors(every_plugin__WEBPACK_IMPORTED_MODULE_0__.CommonPluginErrors),
	ping: every_plugin_orpc__WEBPACK_IMPORTED_MODULE_1__.oc.route({
		method: "GET",
		path: "/ping"
	}).output(every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
		status: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.literal("ok"),
		timestamp: every_plugin_zod__WEBPACK_IMPORTED_MODULE_2__.z.string().datetime()
	})).errors(every_plugin__WEBPACK_IMPORTED_MODULE_0__.CommonPluginErrors)
});

//#endregion

//# sourceMappingURL=index.mjs.map

}),

};
;
//# sourceMappingURL=src_index_ts.js.map