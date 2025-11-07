(() => { // webpackBootstrap
var __webpack_modules__ = ({
"../../node_modules/.bun/@module-federation+error-codes@0.21.2/node_modules/@module-federation/error-codes/dist/index.cjs.js": 
/*!***********************************************************************************************************************************!*\
  !*** ../../node_modules/.bun/@module-federation+error-codes@0.21.2/node_modules/@module-federation/error-codes/dist/index.cjs.js ***!
  \***********************************************************************************************************************************/
(function (__unused_webpack_module, exports) {
"use strict";


const RUNTIME_001 = 'RUNTIME-001';
const RUNTIME_002 = 'RUNTIME-002';
const RUNTIME_003 = 'RUNTIME-003';
const RUNTIME_004 = 'RUNTIME-004';
const RUNTIME_005 = 'RUNTIME-005';
const RUNTIME_006 = 'RUNTIME-006';
const RUNTIME_007 = 'RUNTIME-007';
const RUNTIME_008 = 'RUNTIME-008';
const RUNTIME_009 = 'RUNTIME-009';
const TYPE_001 = 'TYPE-001';
const BUILD_001 = 'BUILD-001';
const BUILD_002 = 'BUILD-002';

const getDocsUrl = (errorCode) => {
    const type = errorCode.split('-')[0].toLowerCase();
    return `View the docs to see how to solve: https://module-federation.io/guide/troubleshooting/${type}/${errorCode}`;
};
const getShortErrorMsg = (errorCode, errorDescMap, args, originalErrorMsg) => {
    const msg = [`${[errorDescMap[errorCode]]} #${errorCode}`];
    args && msg.push(`args: ${JSON.stringify(args)}`);
    msg.push(getDocsUrl(errorCode));
    originalErrorMsg && msg.push(`Original Error Message:\n ${originalErrorMsg}`);
    return msg.join('\n');
};

const runtimeDescMap = {
    [RUNTIME_001]: 'Failed to get remoteEntry exports.',
    [RUNTIME_002]: 'The remote entry interface does not contain "init"',
    [RUNTIME_003]: 'Failed to get manifest.',
    [RUNTIME_004]: 'Failed to locate remote.',
    [RUNTIME_005]: 'Invalid loadShareSync function call from bundler runtime',
    [RUNTIME_006]: 'Invalid loadShareSync function call from runtime',
    [RUNTIME_007]: 'Failed to get remote snapshot.',
    [RUNTIME_008]: 'Failed to load script resources.',
    [RUNTIME_009]: 'Please call createInstance first.',
};
const typeDescMap = {
    [TYPE_001]: 'Failed to generate type declaration. Execute the below cmd to reproduce and fix the error.',
};
const buildDescMap = {
    [BUILD_001]: 'Failed to find expose module.',
    [BUILD_002]: 'PublicPath is required in prod mode.',
};
const errorDescMap = {
    ...runtimeDescMap,
    ...typeDescMap,
    ...buildDescMap,
};

exports.BUILD_001 = BUILD_001;
exports.BUILD_002 = BUILD_002;
exports.RUNTIME_001 = RUNTIME_001;
exports.RUNTIME_002 = RUNTIME_002;
exports.RUNTIME_003 = RUNTIME_003;
exports.RUNTIME_004 = RUNTIME_004;
exports.RUNTIME_005 = RUNTIME_005;
exports.RUNTIME_006 = RUNTIME_006;
exports.RUNTIME_007 = RUNTIME_007;
exports.RUNTIME_008 = RUNTIME_008;
exports.RUNTIME_009 = RUNTIME_009;
exports.TYPE_001 = TYPE_001;
exports.buildDescMap = buildDescMap;
exports.errorDescMap = errorDescMap;
exports.getShortErrorMsg = getShortErrorMsg;
exports.runtimeDescMap = runtimeDescMap;
exports.typeDescMap = typeDescMap;
//# sourceMappingURL=index.cjs.js.map


}),
"../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/dev-server.js": 
/*!**********************************************************************************************!*\
  !*** ../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/dev-server.js ***!
  \**********************************************************************************************/
(function (module, __unused_webpack_exports, __webpack_require__) {
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
/* globals __webpack_hash__ */
if (true) {
	/** @type {undefined|string} */
	var lastHash;
	var upToDate = function upToDate() {
		return /** @type {string} */ (lastHash).indexOf(__webpack_require__.h()) >= 0;
	};
	var log = __webpack_require__(/*! ./log */ "../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/log.js");
	var check = function check() {
		module.hot
			.check(true)
			.then(function (updatedModules) {
				if (!updatedModules) {
					log(
						"warning",
						"[HMR] Cannot find update. " +
							(typeof window !== "undefined"
								? "Need to do a full reload!"
								: "Please reload manually!")
					);
					log(
						"warning",
						"[HMR] (Probably because of restarting the webpack-dev-server)"
					);
					if (typeof window !== "undefined") {
						window.location.reload();
					}
					return;
				}

				if (!upToDate()) {
					check();
				}

				__webpack_require__(/*! ./log-apply-result */ "../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/log-apply-result.js")(updatedModules, updatedModules);

				if (upToDate()) {
					log("info", "[HMR] App is up to date.");
				}
			})
			.catch(function (err) {
				var status = module.hot.status();
				if (["abort", "fail"].indexOf(status) >= 0) {
					log(
						"warning",
						"[HMR] Cannot apply update. " +
							(typeof window !== "undefined"
								? "Need to do a full reload!"
								: "Please reload manually!")
					);
					log("warning", "[HMR] " + log.formatError(err));
					if (typeof window !== "undefined") {
						window.location.reload();
					}
				} else {
					log("warning", "[HMR] Update failed: " + log.formatError(err));
				}
			});
	};
	var hotEmitter = __webpack_require__(/*! ./emitter */ "../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/emitter.js");
	hotEmitter.on("webpackHotUpdate", function (currentHash) {
		lastHash = currentHash;
		if (!upToDate() && module.hot.status() === "idle") {
			log("info", "[HMR] Checking for updates on the server...");
			check();
		}
	});
	log("info", "[HMR] Waiting for update signal from WDS...");
} else {}


}),
"../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/emitter.js": 
/*!*******************************************************************************************!*\
  !*** ../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/emitter.js ***!
  \*******************************************************************************************/
(function (module) {
function EventEmitter() {
	this.events = {};
}

EventEmitter.prototype.on = function (eventName, callback) {
	if (!this.events[eventName]) {
		this.events[eventName] = [];
	}
	this.events[eventName].push(callback);
};

EventEmitter.prototype.emit = function (eventName) {
	var args = Array.prototype.slice.call(arguments, 1);
	if (this.events[eventName]) {
		this.events[eventName].forEach(function (callback) {
			callback.apply(null, args);
		});
	}
};

module.exports = new EventEmitter();


}),
"../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/log-apply-result.js": 
/*!****************************************************************************************************!*\
  !*** ../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/log-apply-result.js ***!
  \****************************************************************************************************/
(function (module, __unused_webpack_exports, __webpack_require__) {
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

/**
 * @param {(string | number)[]} updatedModules updated modules
 * @param {(string | number)[] | null} renewedModules renewed modules
 */
module.exports = function (updatedModules, renewedModules) {
	var unacceptedModules = updatedModules.filter(function (moduleId) {
		return renewedModules && renewedModules.indexOf(moduleId) < 0;
	});
	var log = __webpack_require__(/*! ./log */ "../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/log.js");

	if (unacceptedModules.length > 0) {
		log(
			"warning",
			"[HMR] The following modules couldn't be hot updated: (They would need a full reload!)"
		);
		unacceptedModules.forEach(function (moduleId) {
			log("warning", "[HMR]  - " + moduleId);
		});
	}

	if (!renewedModules || renewedModules.length === 0) {
		log("info", "[HMR] Nothing hot updated.");
	} else {
		log("info", "[HMR] Updated modules:");
		renewedModules.forEach(function (moduleId) {
			if (typeof moduleId === "string" && moduleId.indexOf("!") !== -1) {
				var parts = moduleId.split("!");
				log.groupCollapsed("info", "[HMR]  - " + parts.pop());
				log("info", "[HMR]  - " + moduleId);
				log.groupEnd("info");
			} else {
				log("info", "[HMR]  - " + moduleId);
			}
		});
		var numberIds = renewedModules.every(function (moduleId) {
			return typeof moduleId === "number";
		});
		if (numberIds)
			log(
				"info",
				'[HMR] Consider using the optimization.moduleIds: "named" for module names.'
			);
	}
};


}),
"../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/log.js": 
/*!***************************************************************************************!*\
  !*** ../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/log.js ***!
  \***************************************************************************************/
(function (module) {
/** @typedef {"info" | "warning" | "error"} LogLevel */

/** @type {LogLevel} */
var logLevel = "info";

function dummy() {}

/**
 * @param {LogLevel} level log level
 * @returns {boolean} true, if should log
 */
function shouldLog(level) {
	var shouldLog =
		(logLevel === "info" && level === "info") ||
		(["info", "warning"].indexOf(logLevel) >= 0 && level === "warning") ||
		(["info", "warning", "error"].indexOf(logLevel) >= 0 && level === "error");
	return shouldLog;
}

/**
 * @param {(msg?: string) => void} logFn log function
 * @returns {(level: LogLevel, msg?: string) => void} function that logs when log level is sufficient
 */
function logGroup(logFn) {
	return function (level, msg) {
		if (shouldLog(level)) {
			logFn(msg);
		}
	};
}

/**
 * @param {LogLevel} level log level
 * @param {string|Error} msg message
 */
module.exports = function (level, msg) {
	if (shouldLog(level)) {
		if (level === "info") {
			console.log(msg);
		} else if (level === "warning") {
			console.warn(msg);
		} else if (level === "error") {
			console.error(msg);
		}
	}
};

var group = console.group || dummy;
var groupCollapsed = console.groupCollapsed || dummy;
var groupEnd = console.groupEnd || dummy;

module.exports.group = logGroup(group);

module.exports.groupCollapsed = logGroup(groupCollapsed);

module.exports.groupEnd = logGroup(groupEnd);

/**
 * @param {LogLevel} level log level
 */
module.exports.setLogLevel = function (level) {
	logLevel = level;
};

/**
 * @param {Error} err error
 * @returns {string} formatted error
 */
module.exports.formatError = function (err) {
	var message = err.message;
	var stack = err.stack;
	if (!stack) {
		return message;
	} else if (stack.indexOf(message) < 0) {
		return message + "\n" + stack;
	} else {
		return stack;
	}
};


}),
"webpack/container/entry/near-intents_debridge-data-provider": 
/*!***********************!*\
  !*** container entry ***!
  \***********************/
(function (__unused_webpack_module, exports, __webpack_require__) {
"use strict";

__webpack_require__.d(exports, {
	get: () => (__webpack_require__.getContainer),
	init: () => (__webpack_require__.initContainer)
});

}),
"@module-federation/runtime/rspack.js!=!data:text/javascript,import __module_federation_bundler_runtime__ from \"/Users/ebraem/workspace/bounties/data-providers/data-provider-playground/node_modules/.bun/@module-federation+webpack-bundler-runtime@0.21.2/node_modules/@module-federation/webpack-bundler-runtime/dist/index.cjs.cjs\";import __module_federation_runtime_plugin_0__ from \"/Users/ebraem/workspace/bounties/data-providers/data-provider-playground/node_modules/.bun/@module-federation+node@2.7.22+914b6fe990853d82/node_modules/@module-federation/node/dist/src/runtimePlugin.js\";const __module_federation_runtime_plugins__ = [__module_federation_runtime_plugin_0__(undefined)];const __module_federation_remote_infos__ = {};const __module_federation_container_name__ = \"near-intents_debridge-data-provider\";const __module_federation_share_strategy__ = \"version-first\";if((__webpack_require__.initializeSharingData||__webpack_require__.initializeExposesData)&&__webpack_require__.federation){var __webpack_require___remotesLoadingData,__webpack_require___remotesLoadingData1,__webpack_require___initializeSharingData,__webpack_require___consumesLoadingData,__webpack_require___consumesLoadingData1,__webpack_require___initializeExposesData,__webpack_require___consumesLoadingData2;const override=(obj,key,value)=>{if(!obj)return;if(obj[key])obj[key]=value};const merge=(obj,key,fn)=>{const value=fn();if(Array.isArray(value)){var _obj,_key;var _;(_=(_obj=obj)[_key=key])!==null&&_!==void 0?_:_obj[_key]=[];obj[key].push(...value)}else if(typeof value===\"object\"&&value!==null){var _obj1,_key1;var _1;(_1=(_obj1=obj)[_key1=key])!==null&&_1!==void 0?_1:_obj1[_key1]={};Object.assign(obj[key],value)}};const early=(obj,key,initial)=>{var _obj,_key;var _;(_=(_obj=obj)[_key=key])!==null&&_!==void 0?_:_obj[_key]=initial()};var __webpack_require___remotesLoadingData_chunkMapping;const remotesLoadingChunkMapping=(__webpack_require___remotesLoadingData_chunkMapping=(__webpack_require___remotesLoadingData=__webpack_require__.remotesLoadingData)===null||__webpack_require___remotesLoadingData===void 0?void 0:__webpack_require___remotesLoadingData.chunkMapping)!==null&&__webpack_require___remotesLoadingData_chunkMapping!==void 0?__webpack_require___remotesLoadingData_chunkMapping:{};var __webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping;const remotesLoadingModuleIdToRemoteDataMapping=(__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping=(__webpack_require___remotesLoadingData1=__webpack_require__.remotesLoadingData)===null||__webpack_require___remotesLoadingData1===void 0?void 0:__webpack_require___remotesLoadingData1.moduleIdToRemoteDataMapping)!==null&&__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping!==void 0?__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping:{};var __webpack_require___initializeSharingData_scopeToSharingDataMapping;const initializeSharingScopeToInitDataMapping=(__webpack_require___initializeSharingData_scopeToSharingDataMapping=(__webpack_require___initializeSharingData=__webpack_require__.initializeSharingData)===null||__webpack_require___initializeSharingData===void 0?void 0:__webpack_require___initializeSharingData.scopeToSharingDataMapping)!==null&&__webpack_require___initializeSharingData_scopeToSharingDataMapping!==void 0?__webpack_require___initializeSharingData_scopeToSharingDataMapping:{};var __webpack_require___consumesLoadingData_chunkMapping;const consumesLoadingChunkMapping=(__webpack_require___consumesLoadingData_chunkMapping=(__webpack_require___consumesLoadingData=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData===void 0?void 0:__webpack_require___consumesLoadingData.chunkMapping)!==null&&__webpack_require___consumesLoadingData_chunkMapping!==void 0?__webpack_require___consumesLoadingData_chunkMapping:{};var __webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping;const consumesLoadingModuleToConsumeDataMapping=(__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping=(__webpack_require___consumesLoadingData1=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData1===void 0?void 0:__webpack_require___consumesLoadingData1.moduleIdToConsumeDataMapping)!==null&&__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping!==void 0?__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping:{};const consumesLoadinginstalledModules={};const initializeSharingInitPromises=[];const initializeSharingInitTokens={};const containerShareScope=(__webpack_require___initializeExposesData=__webpack_require__.initializeExposesData)===null||__webpack_require___initializeExposesData===void 0?void 0:__webpack_require___initializeExposesData.shareScope;for(const key in __module_federation_bundler_runtime__){__webpack_require__.federation[key]=__module_federation_bundler_runtime__[key]}early(__webpack_require__.federation,\"consumesLoadingModuleToHandlerMapping\",()=>{const consumesLoadingModuleToHandlerMapping={};for(let[moduleId,data]of Object.entries(consumesLoadingModuleToConsumeDataMapping)){consumesLoadingModuleToHandlerMapping[moduleId]={getter:data.fallback,shareInfo:{shareConfig:{fixedDependencies:false,requiredVersion:data.requiredVersion,strictVersion:data.strictVersion,singleton:data.singleton,eager:data.eager},scope:[data.shareScope]},shareKey:data.shareKey}}return consumesLoadingModuleToHandlerMapping});early(__webpack_require__.federation,\"initOptions\",()=>({}));early(__webpack_require__.federation.initOptions,\"name\",()=>__module_federation_container_name__);early(__webpack_require__.federation.initOptions,\"shareStrategy\",()=>__module_federation_share_strategy__);early(__webpack_require__.federation.initOptions,\"shared\",()=>{const shared={};for(let[scope,stages]of Object.entries(initializeSharingScopeToInitDataMapping)){for(let stage of stages){if(typeof stage===\"object\"&&stage!==null){const{name,version,factory,eager,singleton,requiredVersion,strictVersion}=stage;const shareConfig={};const isValidValue=function(val){return typeof val!==\"undefined\"};if(isValidValue(singleton)){shareConfig.singleton=singleton}if(isValidValue(requiredVersion)){shareConfig.requiredVersion=requiredVersion}if(isValidValue(eager)){shareConfig.eager=eager}if(isValidValue(strictVersion)){shareConfig.strictVersion=strictVersion}const options={version,scope:[scope],shareConfig,get:factory};if(shared[name]){shared[name].push(options)}else{shared[name]=[options]}}}}return shared});merge(__webpack_require__.federation.initOptions,\"remotes\",()=>Object.values(__module_federation_remote_infos__).flat().filter(remote=>remote.externalType===\"script\"));merge(__webpack_require__.federation.initOptions,\"plugins\",()=>__module_federation_runtime_plugins__);early(__webpack_require__.federation,\"bundlerRuntimeOptions\",()=>({}));early(__webpack_require__.federation.bundlerRuntimeOptions,\"remotes\",()=>({}));early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,\"chunkMapping\",()=>remotesLoadingChunkMapping);early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,\"remoteInfos\",()=>__module_federation_remote_infos__);early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,\"idToExternalAndNameMapping\",()=>{const remotesLoadingIdToExternalAndNameMappingMapping={};for(let[moduleId,data]of Object.entries(remotesLoadingModuleIdToRemoteDataMapping)){remotesLoadingIdToExternalAndNameMappingMapping[moduleId]=[data.shareScope,data.name,data.externalModuleId,data.remoteName]}return remotesLoadingIdToExternalAndNameMappingMapping});early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,\"webpackRequire\",()=>__webpack_require__);merge(__webpack_require__.federation.bundlerRuntimeOptions.remotes,\"idToRemoteMap\",()=>{const idToRemoteMap={};for(let[id,remoteData]of Object.entries(remotesLoadingModuleIdToRemoteDataMapping)){const info=__module_federation_remote_infos__[remoteData.remoteName];if(info)idToRemoteMap[id]=info}return idToRemoteMap});override(__webpack_require__,\"S\",__webpack_require__.federation.bundlerRuntime.S);if(__webpack_require__.federation.attachShareScopeMap){__webpack_require__.federation.attachShareScopeMap(__webpack_require__)}override(__webpack_require__.f,\"remotes\",(chunkId,promises)=>__webpack_require__.federation.bundlerRuntime.remotes({chunkId,promises,chunkMapping:remotesLoadingChunkMapping,idToExternalAndNameMapping:__webpack_require__.federation.bundlerRuntimeOptions.remotes.idToExternalAndNameMapping,idToRemoteMap:__webpack_require__.federation.bundlerRuntimeOptions.remotes.idToRemoteMap,webpackRequire:__webpack_require__}));override(__webpack_require__.f,\"consumes\",(chunkId,promises)=>__webpack_require__.federation.bundlerRuntime.consumes({chunkId,promises,chunkMapping:consumesLoadingChunkMapping,moduleToHandlerMapping:__webpack_require__.federation.consumesLoadingModuleToHandlerMapping,installedModules:consumesLoadinginstalledModules,webpackRequire:__webpack_require__}));override(__webpack_require__,\"I\",(name,initScope)=>__webpack_require__.federation.bundlerRuntime.I({shareScopeName:name,initScope,initPromises:initializeSharingInitPromises,initTokens:initializeSharingInitTokens,webpackRequire:__webpack_require__}));override(__webpack_require__,\"initContainer\",(shareScope,initScope,remoteEntryInitOptions)=>__webpack_require__.federation.bundlerRuntime.initContainerEntry({shareScope,initScope,remoteEntryInitOptions,shareScopeKey:containerShareScope,webpackRequire:__webpack_require__}));override(__webpack_require__,\"getContainer\",(module1,getScope)=>{var moduleMap=__webpack_require__.initializeExposesData.moduleMap;__webpack_require__.R=getScope;getScope=Object.prototype.hasOwnProperty.call(moduleMap,module1)?moduleMap[module1]():Promise.resolve().then(()=>{throw new Error('Module \"'+module1+'\" does not exist in container.')});__webpack_require__.R=undefined;return getScope});__webpack_require__.federation.instance=__webpack_require__.federation.runtime.init(__webpack_require__.federation.initOptions);if((__webpack_require___consumesLoadingData2=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData2===void 0?void 0:__webpack_require___consumesLoadingData2.initialConsumes){__webpack_require__.federation.bundlerRuntime.installInitialConsumes({webpackRequire:__webpack_require__,installedModules:consumesLoadinginstalledModules,initialConsumes:__webpack_require__.consumesLoadingData.initialConsumes,moduleToHandlerMapping:__webpack_require__.federation.consumesLoadingModuleToHandlerMapping})}}": 
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** @module-federation/runtime/rspack.js!=!data:text/javascript,import __module_federation_bundler_runtime__ from "/Users/ebraem/workspace/bounties/data-providers/data-provider-playground/node_modules/.bun/@module-federation+webpack-bundler-runtime@0.21.2/node_modules/@module-federation/webpack-bundler-runtime/dist/index.cjs.cjs";import __module_federation_runtime_plugin_0__ from "/Users/ebraem/workspace/bounties/data-providers/data-provider-playground/node_modules/.bun/@module-federation+node@2.7.22+914b6fe990853d82/node_modules/@module-federation/node/dist/src/runtimePlugin.js";const __module_federation_runtime_plugins__ = [__module_federation_runtime_plugin_0__(undefined)];const __module_federation_remote_infos__ = {};const __module_federation_container_name__ = "near-intents_debridge-data-provider";const __module_federation_share_strategy__ = "version-first";if((__webpack_require__.initializeSharingData||__webpack_require__.initializeExposesData)&&__webpack_require__.federation){var __webpack_require___remotesLoadingData,__webpack_require___remotesLoadingData1,__webpack_require___initializeSharingData,__webpack_require___consumesLoadingData,__webpack_require___consumesLoadingData1,__webpack_require___initializeExposesData,__webpack_require___consumesLoadingData2;const override=(obj,key,value)=>{if(!obj)return;if(obj[key])obj[key]=value};const merge=(obj,key,fn)=>{const value=fn();if(Array.isArray(value)){var _obj,_key;var _;(_=(_obj=obj)[_key=key])!==null&&_!==void 0?_:_obj[_key]=[];obj[key].push(...value)}else if(typeof value==="object"&&value!==null){var _obj1,_key1;var _1;(_1=(_obj1=obj)[_key1=key])!==null&&_1!==void 0?_1:_obj1[_key1]={};Object.assign(obj[key],value)}};const early=(obj,key,initial)=>{var _obj,_key;var _;(_=(_obj=obj)[_key=key])!==null&&_!==void 0?_:_obj[_key]=initial()};var __webpack_require___remotesLoadingData_chunkMapping;const remotesLoadingChunkMapping=(__webpack_require___remotesLoadingData_chunkMapping=(__webpack_require___remotesLoadingData=__webpack_require__.remotesLoadingData)===null||__webpack_require___remotesLoadingData===void 0?void 0:__webpack_require___remotesLoadingData.chunkMapping)!==null&&__webpack_require___remotesLoadingData_chunkMapping!==void 0?__webpack_require___remotesLoadingData_chunkMapping:{};var __webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping;const remotesLoadingModuleIdToRemoteDataMapping=(__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping=(__webpack_require___remotesLoadingData1=__webpack_require__.remotesLoadingData)===null||__webpack_require___remotesLoadingData1===void 0?void 0:__webpack_require___remotesLoadingData1.moduleIdToRemoteDataMapping)!==null&&__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping!==void 0?__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping:{};var __webpack_require___initializeSharingData_scopeToSharingDataMapping;const initializeSharingScopeToInitDataMapping=(__webpack_require___initializeSharingData_scopeToSharingDataMapping=(__webpack_require___initializeSharingData=__webpack_require__.initializeSharingData)===null||__webpack_require___initializeSharingData===void 0?void 0:__webpack_require___initializeSharingData.scopeToSharingDataMapping)!==null&&__webpack_require___initializeSharingData_scopeToSharingDataMapping!==void 0?__webpack_require___initializeSharingData_scopeToSharingDataMapping:{};var __webpack_require___consumesLoadingData_chunkMapping;const consumesLoadingChunkMapping=(__webpack_require___consumesLoadingData_chunkMapping=(__webpack_require___consumesLoadingData=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData===void 0?void 0:__webpack_require___consumesLoadingData.chunkMapping)!==null&&__webpack_require___consumesLoadingData_chunkMapping!==void 0?__webpack_require___consumesLoadingData_chunkMapping:{};var __webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping;const consumesLoadingModuleToConsumeDataMapping=(__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping=(__webpack_require___consumesLoadingData1=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData1===void 0?void 0:__webpack_require___consumesLoadingData1.moduleIdToConsumeDataMapping)!==null&&__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping!==void 0?__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping:{};const consumesLoadinginstalledModules={};const initializeSharingInitPromises=[];const initializeSharingInitTokens={};const containerShareScope=(__webpack_require___initializeExposesData=__webpack_require__.initializeExposesData)===null||__webpack_require___initializeExposesData===void 0?void 0:__webpack_require___initializeExposesData.shareScope;for(const key in __module_federation_bundler_runtime__){__webpack_require__.federation[key]=__module_federation_bundler_runtime__[key]}early(__webpack_require__.federation,"consumesLoadingModuleToHandlerMapping",()=>{const consumesLoadingModuleToHandlerMapping={};for(let[moduleId,data]of Object.entries(consumesLoadingModuleToConsumeDataMapping)){consumesLoadingModuleToHandlerMapping[moduleId]={getter:data.fallback,shareInfo:{shareConfig:{fixedDependencies:false,requiredVersion:data.requiredVersion,strictVersion:data.strictVersion,singleton:data.singleton,eager:data.eager},scope:[data.shareScope]},shareKey:data.shareKey}}return consumesLoadingModuleToHandlerMapping});early(__webpack_require__.federation,"initOptions",()=>({}));early(__webpack_require__.federation.initOptions,"name",()=>__module_federation_container_name__);early(__webpack_require__.federation.initOptions,"shareStrategy",()=>__module_federation_share_strategy__);early(__webpack_require__.federation.initOptions,"shared",()=>{const shared={};for(let[scope,stages]of Object.entries(initializeSharingScopeToInitDataMapping)){for(let stage of stages){if(typeof stage==="object"&&stage!==null){const{name,version,factory,eager,singleton,requiredVersion,strictVersion}=stage;const shareConfig={};const isValidValue=function(val){return typeof val!=="undefined"};if(isValidValue(singleton)){shareConfig.singleton=singleton}if(isValidValue(requiredVersion)){shareConfig.requiredVersion=requiredVersion}if(isValidValue(eager)){shareConfig.eager=eager}if(isValidValue(strictVersion)){shareConfig.strictVersion=strictVersion}const options={version,scope:[scope],shareConfig,get:factory};if(shared[name]){shared[name].push(options)}else{shared[name]=[options]}}}}return shared});merge(__webpack_require__.federation.initOptions,"remotes",()=>Object.values(__module_federation_remote_infos__).flat().filter(remote=>remote.externalType==="script"));merge(__webpack_require__.federation.initOptions,"plugins",()=>__module_federation_runtime_plugins__);early(__webpack_require__.federation,"bundlerRuntimeOptions",()=>({}));early(__webpack_require__.federation.bundlerRuntimeOptions,"remotes",()=>({}));early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,"chunkMapping",()=>remotesLoadingChunkMapping);early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,"remoteInfos",()=>__module_federation_remote_infos__);early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,"idToExternalAndNameMapping",()=>{const remotesLoadingIdToExternalAndNameMappingMapping={};for(let[moduleId,data]of Object.entries(remotesLoadingModuleIdToRemoteDataMapping)){remotesLoadingIdToExternalAndNameMappingMapping[moduleId]=[data.shareScope,data.name,data.externalModuleId,data.remoteName]}return remotesLoadingIdToExternalAndNameMappingMapping});early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,"webpackRequire",()=>__webpack_require__);merge(__webpack_require__.federation.bundlerRuntimeOptions.remotes,"idToRemoteMap",()=>{const idToRemoteMap={};for(let[id,remoteData]of Object.entries(remotesLoadingModuleIdToRemoteDataMapping)){const info=__module_federation_remote_infos__[remoteData.remoteName];if(info)idToRemoteMap[id]=info}return idToRemoteMap});override(__webpack_require__,"S",__webpack_require__.federation.bundlerRuntime.S);if(__webpack_require__.federation.attachShareScopeMap){__webpack_require__.federation.attachShareScopeMap(__webpack_require__)}override(__webpack_require__.f,"remotes",(chunkId,promises)=>__webpack_require__.federation.bundlerRuntime.remotes({chunkId,promises,chunkMapping:remotesLoadingChunkMapping,idToExternalAndNameMapping:__webpack_require__.federation.bundlerRuntimeOptions.remotes.idToExternalAndNameMapping,idToRemoteMap:__webpack_require__.federation.bundlerRuntimeOptions.remotes.idToRemoteMap,webpackRequire:__webpack_require__}));override(__webpack_require__.f,"consumes",(chunkId,promises)=>__webpack_require__.federation.bundlerRuntime.consumes({chunkId,promises,chunkMapping:consumesLoadingChunkMapping,moduleToHandlerMapping:__webpack_require__.federation.consumesLoadingModuleToHandlerMapping,installedModules:consumesLoadinginstalledModules,webpackRequire:__webpack_require__}));override(__webpack_require__,"I",(name,initScope)=>__webpack_require__.federation.bundlerRuntime.I({shareScopeName:name,initScope,initPromises:initializeSharingInitPromises,initTokens:initializeSharingInitTokens,webpackRequire:__webpack_require__}));override(__webpack_require__,"initContainer",(shareScope,initScope,remoteEntryInitOptions)=>__webpack_require__.federation.bundlerRuntime.initContainerEntry({shareScope,initScope,remoteEntryInitOptions,shareScopeKey:containerShareScope,webpackRequire:__webpack_require__}));override(__webpack_require__,"getContainer",(module1,getScope)=>{var moduleMap=__webpack_require__.initializeExposesData.moduleMap;__webpack_require__.R=getScope;getScope=Object.prototype.hasOwnProperty.call(moduleMap,module1)?moduleMap[module1]():Promise.resolve().then(()=>{throw new Error('Module "'+module1+'" does not exist in container.')});__webpack_require__.R=undefined;return getScope});__webpack_require__.federation.instance=__webpack_require__.federation.runtime.init(__webpack_require__.federation.initOptions);if((__webpack_require___consumesLoadingData2=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData2===void 0?void 0:__webpack_require___consumesLoadingData2.initialConsumes){__webpack_require__.federation.bundlerRuntime.installInitialConsumes({webpackRequire:__webpack_require__,installedModules:consumesLoadinginstalledModules,initialConsumes:__webpack_require__.consumesLoadingData.initialConsumes,moduleToHandlerMapping:__webpack_require__.federation.consumesLoadingModuleToHandlerMapping})}} ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
(function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.r(__webpack_exports__);
/* ESM import */var _Users_ebraem_workspace_bounties_data_providers_data_provider_playground_node_modules_bun_module_federation_webpack_bundler_runtime_0_21_2_node_modules_module_federation_webpack_bundler_runtime_dist_index_cjs_cjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/.bun/@module-federation+webpack-bundler-runtime@0.21.2/node_modules/@module-federation/webpack-bundler-runtime/dist/index.cjs.cjs */ "../../node_modules/.bun/@module-federation+webpack-bundler-runtime@0.21.2/node_modules/@module-federation/webpack-bundler-runtime/dist/index.cjs.cjs");
/* ESM import */var _Users_ebraem_workspace_bounties_data_providers_data_provider_playground_node_modules_bun_module_federation_webpack_bundler_runtime_0_21_2_node_modules_module_federation_webpack_bundler_runtime_dist_index_cjs_cjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_Users_ebraem_workspace_bounties_data_providers_data_provider_playground_node_modules_bun_module_federation_webpack_bundler_runtime_0_21_2_node_modules_module_federation_webpack_bundler_runtime_dist_index_cjs_cjs__WEBPACK_IMPORTED_MODULE_0__);
/* ESM import */var _Users_ebraem_workspace_bounties_data_providers_data_provider_playground_node_modules_bun_module_federation_node_2_7_22_914b6fe990853d82_node_modules_module_federation_node_dist_src_runtimePlugin_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/.bun/@module-federation+node@2.7.22+914b6fe990853d82/node_modules/@module-federation/node/dist/src/runtimePlugin.js */ "../../node_modules/.bun/@module-federation+node@2.7.22+914b6fe990853d82/node_modules/@module-federation/node/dist/src/runtimePlugin.js");
const __module_federation_runtime_plugins__ = [(0,_Users_ebraem_workspace_bounties_data_providers_data_provider_playground_node_modules_bun_module_federation_node_2_7_22_914b6fe990853d82_node_modules_module_federation_node_dist_src_runtimePlugin_js__WEBPACK_IMPORTED_MODULE_1__["default"])(undefined)];const __module_federation_remote_infos__ = {};const __module_federation_container_name__ = "near-intents_debridge-data-provider";const __module_federation_share_strategy__ = "version-first";if((__webpack_require__.initializeSharingData||__webpack_require__.initializeExposesData)&&__webpack_require__.federation){var __webpack_require___remotesLoadingData,__webpack_require___remotesLoadingData1,__webpack_require___initializeSharingData,__webpack_require___consumesLoadingData,__webpack_require___consumesLoadingData1,__webpack_require___initializeExposesData,__webpack_require___consumesLoadingData2;const override=(obj,key,value)=>{if(!obj)return;if(obj[key])obj[key]=value};const merge=(obj,key,fn)=>{const value=fn();if(Array.isArray(value)){var _obj,_key;var _;(_=(_obj=obj)[_key=key])!==null&&_!==void 0?_:_obj[_key]=[];obj[key].push(...value)}else if(typeof value==="object"&&value!==null){var _obj1,_key1;var _1;(_1=(_obj1=obj)[_key1=key])!==null&&_1!==void 0?_1:_obj1[_key1]={};Object.assign(obj[key],value)}};const early=(obj,key,initial)=>{var _obj,_key;var _;(_=(_obj=obj)[_key=key])!==null&&_!==void 0?_:_obj[_key]=initial()};var __webpack_require___remotesLoadingData_chunkMapping;const remotesLoadingChunkMapping=(__webpack_require___remotesLoadingData_chunkMapping=(__webpack_require___remotesLoadingData=__webpack_require__.remotesLoadingData)===null||__webpack_require___remotesLoadingData===void 0?void 0:__webpack_require___remotesLoadingData.chunkMapping)!==null&&__webpack_require___remotesLoadingData_chunkMapping!==void 0?__webpack_require___remotesLoadingData_chunkMapping:{};var __webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping;const remotesLoadingModuleIdToRemoteDataMapping=(__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping=(__webpack_require___remotesLoadingData1=__webpack_require__.remotesLoadingData)===null||__webpack_require___remotesLoadingData1===void 0?void 0:__webpack_require___remotesLoadingData1.moduleIdToRemoteDataMapping)!==null&&__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping!==void 0?__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping:{};var __webpack_require___initializeSharingData_scopeToSharingDataMapping;const initializeSharingScopeToInitDataMapping=(__webpack_require___initializeSharingData_scopeToSharingDataMapping=(__webpack_require___initializeSharingData=__webpack_require__.initializeSharingData)===null||__webpack_require___initializeSharingData===void 0?void 0:__webpack_require___initializeSharingData.scopeToSharingDataMapping)!==null&&__webpack_require___initializeSharingData_scopeToSharingDataMapping!==void 0?__webpack_require___initializeSharingData_scopeToSharingDataMapping:{};var __webpack_require___consumesLoadingData_chunkMapping;const consumesLoadingChunkMapping=(__webpack_require___consumesLoadingData_chunkMapping=(__webpack_require___consumesLoadingData=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData===void 0?void 0:__webpack_require___consumesLoadingData.chunkMapping)!==null&&__webpack_require___consumesLoadingData_chunkMapping!==void 0?__webpack_require___consumesLoadingData_chunkMapping:{};var __webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping;const consumesLoadingModuleToConsumeDataMapping=(__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping=(__webpack_require___consumesLoadingData1=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData1===void 0?void 0:__webpack_require___consumesLoadingData1.moduleIdToConsumeDataMapping)!==null&&__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping!==void 0?__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping:{};const consumesLoadinginstalledModules={};const initializeSharingInitPromises=[];const initializeSharingInitTokens={};const containerShareScope=(__webpack_require___initializeExposesData=__webpack_require__.initializeExposesData)===null||__webpack_require___initializeExposesData===void 0?void 0:__webpack_require___initializeExposesData.shareScope;for(const key in (_Users_ebraem_workspace_bounties_data_providers_data_provider_playground_node_modules_bun_module_federation_webpack_bundler_runtime_0_21_2_node_modules_module_federation_webpack_bundler_runtime_dist_index_cjs_cjs__WEBPACK_IMPORTED_MODULE_0___default())){__webpack_require__.federation[key]=(_Users_ebraem_workspace_bounties_data_providers_data_provider_playground_node_modules_bun_module_federation_webpack_bundler_runtime_0_21_2_node_modules_module_federation_webpack_bundler_runtime_dist_index_cjs_cjs__WEBPACK_IMPORTED_MODULE_0___default())[key]}early(__webpack_require__.federation,"consumesLoadingModuleToHandlerMapping",()=>{const consumesLoadingModuleToHandlerMapping={};for(let[moduleId,data]of Object.entries(consumesLoadingModuleToConsumeDataMapping)){consumesLoadingModuleToHandlerMapping[moduleId]={getter:data.fallback,shareInfo:{shareConfig:{fixedDependencies:false,requiredVersion:data.requiredVersion,strictVersion:data.strictVersion,singleton:data.singleton,eager:data.eager},scope:[data.shareScope]},shareKey:data.shareKey}}return consumesLoadingModuleToHandlerMapping});early(__webpack_require__.federation,"initOptions",()=>({}));early(__webpack_require__.federation.initOptions,"name",()=>__module_federation_container_name__);early(__webpack_require__.federation.initOptions,"shareStrategy",()=>__module_federation_share_strategy__);early(__webpack_require__.federation.initOptions,"shared",()=>{const shared={};for(let[scope,stages]of Object.entries(initializeSharingScopeToInitDataMapping)){for(let stage of stages){if(typeof stage==="object"&&stage!==null){const{name,version,factory,eager,singleton,requiredVersion,strictVersion}=stage;const shareConfig={};const isValidValue=function(val){return typeof val!=="undefined"};if(isValidValue(singleton)){shareConfig.singleton=singleton}if(isValidValue(requiredVersion)){shareConfig.requiredVersion=requiredVersion}if(isValidValue(eager)){shareConfig.eager=eager}if(isValidValue(strictVersion)){shareConfig.strictVersion=strictVersion}const options={version,scope:[scope],shareConfig,get:factory};if(shared[name]){shared[name].push(options)}else{shared[name]=[options]}}}}return shared});merge(__webpack_require__.federation.initOptions,"remotes",()=>Object.values(__module_federation_remote_infos__).flat().filter(remote=>remote.externalType==="script"));merge(__webpack_require__.federation.initOptions,"plugins",()=>__module_federation_runtime_plugins__);early(__webpack_require__.federation,"bundlerRuntimeOptions",()=>({}));early(__webpack_require__.federation.bundlerRuntimeOptions,"remotes",()=>({}));early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,"chunkMapping",()=>remotesLoadingChunkMapping);early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,"remoteInfos",()=>__module_federation_remote_infos__);early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,"idToExternalAndNameMapping",()=>{const remotesLoadingIdToExternalAndNameMappingMapping={};for(let[moduleId,data]of Object.entries(remotesLoadingModuleIdToRemoteDataMapping)){remotesLoadingIdToExternalAndNameMappingMapping[moduleId]=[data.shareScope,data.name,data.externalModuleId,data.remoteName]}return remotesLoadingIdToExternalAndNameMappingMapping});early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,"webpackRequire",()=>__webpack_require__);merge(__webpack_require__.federation.bundlerRuntimeOptions.remotes,"idToRemoteMap",()=>{const idToRemoteMap={};for(let[id,remoteData]of Object.entries(remotesLoadingModuleIdToRemoteDataMapping)){const info=__module_federation_remote_infos__[remoteData.remoteName];if(info)idToRemoteMap[id]=info}return idToRemoteMap});override(__webpack_require__,"S",__webpack_require__.federation.bundlerRuntime.S);if(__webpack_require__.federation.attachShareScopeMap){__webpack_require__.federation.attachShareScopeMap(__webpack_require__)}override(__webpack_require__.f,"remotes",(chunkId,promises)=>__webpack_require__.federation.bundlerRuntime.remotes({chunkId,promises,chunkMapping:remotesLoadingChunkMapping,idToExternalAndNameMapping:__webpack_require__.federation.bundlerRuntimeOptions.remotes.idToExternalAndNameMapping,idToRemoteMap:__webpack_require__.federation.bundlerRuntimeOptions.remotes.idToRemoteMap,webpackRequire:__webpack_require__}));override(__webpack_require__.f,"consumes",(chunkId,promises)=>__webpack_require__.federation.bundlerRuntime.consumes({chunkId,promises,chunkMapping:consumesLoadingChunkMapping,moduleToHandlerMapping:__webpack_require__.federation.consumesLoadingModuleToHandlerMapping,installedModules:consumesLoadinginstalledModules,webpackRequire:__webpack_require__}));override(__webpack_require__,"I",(name,initScope)=>__webpack_require__.federation.bundlerRuntime.I({shareScopeName:name,initScope,initPromises:initializeSharingInitPromises,initTokens:initializeSharingInitTokens,webpackRequire:__webpack_require__}));override(__webpack_require__,"initContainer",(shareScope,initScope,remoteEntryInitOptions)=>__webpack_require__.federation.bundlerRuntime.initContainerEntry({shareScope,initScope,remoteEntryInitOptions,shareScopeKey:containerShareScope,webpackRequire:__webpack_require__}));override(__webpack_require__,"getContainer",(module1,getScope)=>{var moduleMap=__webpack_require__.initializeExposesData.moduleMap;__webpack_require__.R=getScope;getScope=Object.prototype.hasOwnProperty.call(moduleMap,module1)?moduleMap[module1]():Promise.resolve().then(()=>{throw new Error('Module "'+module1+'" does not exist in container.')});__webpack_require__.R=undefined;return getScope});__webpack_require__.federation.instance=__webpack_require__.federation.runtime.init(__webpack_require__.federation.initOptions);if((__webpack_require___consumesLoadingData2=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData2===void 0?void 0:__webpack_require___consumesLoadingData2.initialConsumes){__webpack_require__.federation.bundlerRuntime.installInitialConsumes({webpackRequire:__webpack_require__,installedModules:consumesLoadinginstalledModules,initialConsumes:__webpack_require__.consumesLoadingData.initialConsumes,moduleToHandlerMapping:__webpack_require__.federation.consumesLoadingModuleToHandlerMapping})}}

}),
"node:module": 
/*!******************************!*\
  !*** external "node:module" ***!
  \******************************/
(function (module) {
"use strict";
module.exports = require("node:module");

}),
"../../node_modules/.bun/@module-federation+node@2.7.22+914b6fe990853d82/node_modules/@module-federation/node/dist/src/runtimePlugin.js": 
/*!**********************************************************************************************************************************************!*\
  !*** ../../node_modules/.bun/@module-federation+node@2.7.22+914b6fe990853d82/node_modules/@module-federation/node/dist/src/runtimePlugin.js ***!
  \**********************************************************************************************************************************************/
(function (__unused_webpack_module, exports, __webpack_require__) {
"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setupWebpackRequirePatching = exports.setupChunkHandler = exports.setupScriptLoader = exports.deleteChunk = exports.installChunk = exports.loadChunk = exports.resolveUrl = exports.fetchAndRun = exports.loadFromFs = exports.returnFromGlobalInstances = exports.returnFromCache = exports.resolveFile = exports.nodeRuntimeImportCache = void 0;
exports.importNodeModule = importNodeModule;
exports["default"] = default_1;
exports.nodeRuntimeImportCache = new Map();
function importNodeModule(name) {
    if (!name) {
        throw new Error('import specifier is required');
    }
    // Check cache to prevent infinite recursion
    if (exports.nodeRuntimeImportCache.has(name)) {
        return exports.nodeRuntimeImportCache.get(name);
    }
    const importModule = new Function('name', `return import(name)`);
    const promise = importModule(name)
        .then((res) => res.default)
        .catch((error) => {
        console.error(`Error importing module ${name}:`, error);
        // Remove from cache on error so it can be retried
        exports.nodeRuntimeImportCache["delete"](name);
        throw error;
    });
    // Cache the promise to prevent recursive calls
    exports.nodeRuntimeImportCache.set(name, promise);
    return promise;
}
// Hoisted utility function to resolve file paths for chunks
const resolveFile = (rootOutputDir, chunkId) => {
    const path = require('path');
    return path.join(__dirname, rootOutputDir + __webpack_require__.u(chunkId));
};
exports.resolveFile = resolveFile;
// Hoisted utility function to get remote entry from cache
const returnFromCache = (remoteName) => {
    const globalThisVal = new Function('return globalThis')();
    const federationInstances = globalThisVal['__FEDERATION__']['__INSTANCES__'];
    for (const instance of federationInstances) {
        const moduleContainer = instance.moduleCache.get(remoteName);
        if (moduleContainer?.remoteInfo)
            return moduleContainer.remoteInfo.entry;
    }
    return null;
};
exports.returnFromCache = returnFromCache;
// Hoisted utility function to get remote entry from global instances
const returnFromGlobalInstances = (remoteName) => {
    const globalThisVal = new Function('return globalThis')();
    const federationInstances = globalThisVal['__FEDERATION__']['__INSTANCES__'];
    for (const instance of federationInstances) {
        for (const remote of instance.options.remotes) {
            if (remote.name === remoteName || remote.alias === remoteName) {
                console.log('Backup remote entry found:', remote.entry);
                return remote.entry;
            }
        }
    }
    return null;
};
exports.returnFromGlobalInstances = returnFromGlobalInstances;
// Hoisted utility function to load chunks from filesystem
const loadFromFs = (filename, callback) => {
    const fs = require('fs');
    const path = require('path');
    const vm = require('vm');
    if (fs.existsSync(filename)) {
        fs.readFile(filename, 'utf-8', (err, content) => {
            if (err)
                return callback(err, null);
            const chunk = {};
            try {
                const script = new vm.Script(`(function(exports, require, __dirname, __filename) {${content}\n})`, {
                    filename,
                    importModuleDynamically: 
                    //@ts-ignore
                    vm.constants?.USE_MAIN_CONTEXT_DEFAULT_LOADER ?? importNodeModule,
                });
                script.runInThisContext()(chunk, require, path.dirname(filename), filename);
                callback(null, chunk);
            }
            catch (e) {
                console.log("'runInThisContext threw'", e);
                callback(e, null);
            }
        });
    }
    else {
        callback(new Error(`File ${filename} does not exist`), null);
    }
};
exports.loadFromFs = loadFromFs;
// Hoisted utility function to fetch and execute chunks from remote URLs
const fetchAndRun = (url, chunkName, callback, args) => {
    (typeof fetch === 'undefined'
        ? importNodeModule('node-fetch').then((mod) => mod.default)
        : Promise.resolve(fetch))
        .then((fetchFunction) => {
        return args.origin.loaderHook.lifecycle.fetch
            .emit(url.href, {})
            .then((res) => {
            if (!res || !(res instanceof Response)) {
                return fetchFunction(url.href).then((response) => response.text());
            }
            return res.text();
        });
    })
        .then((data) => {
        const chunk = {};
        try {
            eval(`(function(exports, require, __dirname, __filename) {${data}\n})`)(chunk, require, url.pathname.split('/').slice(0, -1).join('/'), chunkName);
            callback(null, chunk);
        }
        catch (e) {
            callback(e, null);
        }
    })
        .catch((err) => callback(err, null));
};
exports.fetchAndRun = fetchAndRun;
// Hoisted utility function to resolve URLs for chunks
const resolveUrl = (remoteName, chunkName) => {
    try {
        return new URL(chunkName, __webpack_require__.p);
    }
    catch {
        const entryUrl = (0, exports.returnFromCache)(remoteName) || (0, exports.returnFromGlobalInstances)(remoteName);
        if (!entryUrl)
            return null;
        const url = new URL(entryUrl);
        const path = require('path');
        // Extract the directory path from the remote entry URL
        // e.g., from "http://url/static/js/remoteEntry.js" to "/static/js/"
        const urlPath = url.pathname;
        const lastSlashIndex = urlPath.lastIndexOf('/');
        const directoryPath = lastSlashIndex >= 0 ? urlPath.substring(0, lastSlashIndex + 1) : '/';
        // Get rootDir from webpack configuration
        const rootDir = __webpack_require__.federation.rootOutputDir || '';
        // Use path.join to combine the paths properly while handling slashes
        // Convert Windows-style paths to URL-style paths
        const combinedPath = path
            .join(directoryPath, rootDir, chunkName)
            .replace(/\\/g, '/');
        // Create the final URL
        return new URL(combinedPath, url.origin);
    }
};
exports.resolveUrl = resolveUrl;
// Hoisted utility function to load chunks based on different strategies
const loadChunk = (strategy, chunkId, rootOutputDir, callback, args) => {
    if (strategy === 'filesystem') {
        return (0, exports.loadFromFs)((0, exports.resolveFile)(rootOutputDir, chunkId), callback);
    }
    const url = (0, exports.resolveUrl)(rootOutputDir, chunkId);
    if (!url)
        return callback(null, { modules: {}, ids: [], runtime: null });
    // Using fetchAndRun directly with args
    (0, exports.fetchAndRun)(url, chunkId, callback, args);
};
exports.loadChunk = loadChunk;
// Hoisted utility function to install a chunk into webpack
const installChunk = (chunk, installedChunks) => {
    for (const moduleId in chunk.modules) {
        __webpack_require__.m[moduleId] = chunk.modules[moduleId];
    }
    if (chunk.runtime)
        chunk.runtime(__webpack_require__);
    for (const chunkId of chunk.ids) {
        if (installedChunks[chunkId])
            installedChunks[chunkId][0]();
        installedChunks[chunkId] = 0;
    }
};
exports.installChunk = installChunk;
// Hoisted utility function to remove a chunk on fail
const deleteChunk = (chunkId, installedChunks) => {
    delete installedChunks[chunkId];
    return true;
};
exports.deleteChunk = deleteChunk;
// Hoisted function to set up webpack script loader
const setupScriptLoader = () => {
    __webpack_require__.l = (url, done, key, chunkId) => {
        if (!key || chunkId)
            throw new Error(`__webpack_require__.l name is required for ${url}`);
        __webpack_require__.federation.runtime
            .loadScriptNode(url, { attrs: { globalName: key } })
            .then((res) => {
            const enhancedRemote = __webpack_require__.federation.instance.initRawContainer(key, url, res);
            new Function('return globalThis')()[key] = enhancedRemote;
            done(enhancedRemote);
        })
            .catch(done);
    };
};
exports.setupScriptLoader = setupScriptLoader;
// Hoisted function to set up chunk handler
const setupChunkHandler = (installedChunks, args) => {
    return (chunkId, promises) => {
        let installedChunkData = installedChunks[chunkId];
        if (installedChunkData !== 0) {
            if (installedChunkData) {
                promises.push(installedChunkData[2]);
            }
            else {
                const matcher = __webpack_require__.federation.chunkMatcher
                    ? __webpack_require__.federation.chunkMatcher(chunkId)
                    : true;
                if (matcher) {
                    const promise = new Promise((resolve, reject) => {
                        installedChunkData = installedChunks[chunkId] = [resolve, reject];
                        const fs = typeof process !== 'undefined'
                            ? require('fs')
                            : false;
                        const filename = typeof process !== 'undefined'
                            ? (0, exports.resolveFile)(__webpack_require__.federation.rootOutputDir || '', chunkId)
                            : false;
                        if (fs && fs.existsSync(filename)) {
                            (0, exports.loadChunk)('filesystem', chunkId, __webpack_require__.federation.rootOutputDir || '', (err, chunk) => {
                                if (err)
                                    return (0, exports.deleteChunk)(chunkId, installedChunks) && reject(err);
                                if (chunk)
                                    (0, exports.installChunk)(chunk, installedChunks);
                                resolve(chunk);
                            }, args);
                        }
                        else {
                            const chunkName = __webpack_require__.u(chunkId);
                            const loadingStrategy = typeof process === 'undefined' ? 'http-eval' : 'http-vm';
                            (0, exports.loadChunk)(loadingStrategy, chunkName, __webpack_require__.federation.initOptions.name, (err, chunk) => {
                                if (err)
                                    return (0, exports.deleteChunk)(chunkId, installedChunks) && reject(err);
                                if (chunk)
                                    (0, exports.installChunk)(chunk, installedChunks);
                                resolve(chunk);
                            }, args);
                        }
                    });
                    promises.push((installedChunkData[2] = promise));
                }
                else {
                    installedChunks[chunkId] = 0;
                }
            }
        }
    };
};
exports.setupChunkHandler = setupChunkHandler;
// Hoisted function to set up webpack require patching
const setupWebpackRequirePatching = (handle) => {
    if (__webpack_require__.f) {
        if (__webpack_require__.f.require) {
            console.warn('\x1b[33m%s\x1b[0m', 'CAUTION: build target is not set to "async-node", attempting to patch additional chunk handlers. This may not work');
            __webpack_require__.f.require = handle;
        }
        if (__webpack_require__.f.readFileVm) {
            __webpack_require__.f.readFileVm = handle;
        }
    }
};
exports.setupWebpackRequirePatching = setupWebpackRequirePatching;
function default_1() {
    return {
        name: 'node-federation-plugin',
        beforeInit(args) {
            // Patch webpack chunk loading handlers
            (() => {
                // Create the chunk tracking object
                const installedChunks = {};
                // Set up webpack script loader
                (0, exports.setupScriptLoader)();
                // Create and set up the chunk handler
                const handle = (0, exports.setupChunkHandler)(installedChunks, args);
                // Patch webpack require
                (0, exports.setupWebpackRequirePatching)(handle);
            })();
            return args;
        },
    };
}
//# sourceMappingURL=runtimePlugin.js.map

}),
"../../node_modules/.bun/@module-federation+runtime-core@0.21.2/node_modules/@module-federation/runtime-core/dist/index.cjs.cjs": 
/*!**************************************************************************************************************************************!*\
  !*** ../../node_modules/.bun/@module-federation+runtime-core@0.21.2/node_modules/@module-federation/runtime-core/dist/index.cjs.cjs ***!
  \**************************************************************************************************************************************/
(function (__unused_webpack_module, exports, __webpack_require__) {
"use strict";


var sdk = __webpack_require__(/*! @module-federation/sdk */ "../../node_modules/.bun/@module-federation+sdk@0.21.2/node_modules/@module-federation/sdk/dist/index.cjs.cjs");
var errorCodes = __webpack_require__(/*! @module-federation/error-codes */ "../../node_modules/.bun/@module-federation+error-codes@0.21.2/node_modules/@module-federation/error-codes/dist/index.cjs.js");

const LOG_CATEGORY = '[ Federation Runtime ]';
// FIXME: pre-bundle ?
const logger = sdk.createLogger(LOG_CATEGORY);
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function assert(condition, msg) {
    if (!condition) {
        error(msg);
    }
}
function error(msg) {
    if (msg instanceof Error) {
        // Check if the message already starts with the log category to avoid duplication
        if (!msg.message.startsWith(LOG_CATEGORY)) {
            msg.message = `${LOG_CATEGORY}: ${msg.message}`;
        }
        throw msg;
    }
    throw new Error(`${LOG_CATEGORY}: ${msg}`);
}
function warn(msg) {
    if (msg instanceof Error) {
        // Check if the message already starts with the log category to avoid duplication
        if (!msg.message.startsWith(LOG_CATEGORY)) {
            msg.message = `${LOG_CATEGORY}: ${msg.message}`;
        }
        logger.warn(msg);
    }
    else {
        logger.warn(msg);
    }
}

function addUniqueItem(arr, item) {
    if (arr.findIndex((name) => name === item) === -1) {
        arr.push(item);
    }
    return arr;
}
function getFMId(remoteInfo) {
    if ('version' in remoteInfo && remoteInfo.version) {
        return `${remoteInfo.name}:${remoteInfo.version}`;
    }
    else if ('entry' in remoteInfo && remoteInfo.entry) {
        return `${remoteInfo.name}:${remoteInfo.entry}`;
    }
    else {
        return `${remoteInfo.name}`;
    }
}
function isRemoteInfoWithEntry(remote) {
    return typeof remote.entry !== 'undefined';
}
function isPureRemoteEntry(remote) {
    return !remote.entry.includes('.json');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeWrapper(callback, disableWarn) {
    try {
        const res = await callback();
        return res;
    }
    catch (e) {
        !disableWarn && warn(e);
        return;
    }
}
function isObject(val) {
    return val && typeof val === 'object';
}
const objectToString = Object.prototype.toString;
// eslint-disable-next-line @typescript-eslint/ban-types
function isPlainObject(val) {
    return objectToString.call(val) === '[object Object]';
}
function isStaticResourcesEqual(url1, url2) {
    const REG_EXP = /^(https?:)?\/\//i;
    // Transform url1 and url2 into relative paths
    const relativeUrl1 = url1.replace(REG_EXP, '').replace(/\/$/, '');
    const relativeUrl2 = url2.replace(REG_EXP, '').replace(/\/$/, '');
    // Check if the relative paths are identical
    return relativeUrl1 === relativeUrl2;
}
function arrayOptions(options) {
    return Array.isArray(options) ? options : [options];
}
function getRemoteEntryInfoFromSnapshot(snapshot) {
    const defaultRemoteEntryInfo = {
        url: '',
        type: 'global',
        globalName: '',
    };
    if (sdk.isBrowserEnv() || sdk.isReactNativeEnv()) {
        return 'remoteEntry' in snapshot
            ? {
                url: snapshot.remoteEntry,
                type: snapshot.remoteEntryType,
                globalName: snapshot.globalName,
            }
            : defaultRemoteEntryInfo;
    }
    if ('ssrRemoteEntry' in snapshot) {
        return {
            url: snapshot.ssrRemoteEntry || defaultRemoteEntryInfo.url,
            type: snapshot.ssrRemoteEntryType || defaultRemoteEntryInfo.type,
            globalName: snapshot.globalName,
        };
    }
    return defaultRemoteEntryInfo;
}
const processModuleAlias = (name, subPath) => {
    // @host/ ./button -> @host/button
    let moduleName;
    if (name.endsWith('/')) {
        moduleName = name.slice(0, -1);
    }
    else {
        moduleName = name;
    }
    if (subPath.startsWith('.')) {
        subPath = subPath.slice(1);
    }
    moduleName = moduleName + subPath;
    return moduleName;
};

const CurrentGlobal = typeof globalThis === 'object' ? globalThis : window;
const nativeGlobal = (() => {
    try {
        // get real window (incase of sandbox)
        return document.defaultView;
    }
    catch {
        // node env
        return CurrentGlobal;
    }
})();
const Global = nativeGlobal;
function definePropertyGlobalVal(target, key, val) {
    Object.defineProperty(target, key, {
        value: val,
        configurable: false,
        writable: true,
    });
}
function includeOwnProperty(target, key) {
    return Object.hasOwnProperty.call(target, key);
}
// This section is to prevent encapsulation by certain microfrontend frameworks. Due to reuse policies, sandbox escapes.
// The sandbox in the microfrontend does not replicate the value of 'configurable'.
// If there is no loading content on the global object, this section defines the loading object.
if (!includeOwnProperty(CurrentGlobal, '__GLOBAL_LOADING_REMOTE_ENTRY__')) {
    definePropertyGlobalVal(CurrentGlobal, '__GLOBAL_LOADING_REMOTE_ENTRY__', {});
}
const globalLoading = CurrentGlobal.__GLOBAL_LOADING_REMOTE_ENTRY__;
function setGlobalDefaultVal(target) {
    if (includeOwnProperty(target, '__VMOK__') &&
        !includeOwnProperty(target, '__FEDERATION__')) {
        definePropertyGlobalVal(target, '__FEDERATION__', target.__VMOK__);
    }
    if (!includeOwnProperty(target, '__FEDERATION__')) {
        definePropertyGlobalVal(target, '__FEDERATION__', {
            __GLOBAL_PLUGIN__: [],
            __INSTANCES__: [],
            moduleInfo: {},
            __SHARE__: {},
            __MANIFEST_LOADING__: {},
            __PRELOADED_MAP__: new Map(),
        });
        definePropertyGlobalVal(target, '__VMOK__', target.__FEDERATION__);
    }
    target.__FEDERATION__.__GLOBAL_PLUGIN__ ??= [];
    target.__FEDERATION__.__INSTANCES__ ??= [];
    target.__FEDERATION__.moduleInfo ??= {};
    target.__FEDERATION__.__SHARE__ ??= {};
    target.__FEDERATION__.__MANIFEST_LOADING__ ??= {};
    target.__FEDERATION__.__PRELOADED_MAP__ ??= new Map();
}
setGlobalDefaultVal(CurrentGlobal);
setGlobalDefaultVal(nativeGlobal);
function resetFederationGlobalInfo() {
    CurrentGlobal.__FEDERATION__.__GLOBAL_PLUGIN__ = [];
    CurrentGlobal.__FEDERATION__.__INSTANCES__ = [];
    CurrentGlobal.__FEDERATION__.moduleInfo = {};
    CurrentGlobal.__FEDERATION__.__SHARE__ = {};
    CurrentGlobal.__FEDERATION__.__MANIFEST_LOADING__ = {};
    Object.keys(globalLoading).forEach((key) => {
        delete globalLoading[key];
    });
}
function setGlobalFederationInstance(FederationInstance) {
    CurrentGlobal.__FEDERATION__.__INSTANCES__.push(FederationInstance);
}
function getGlobalFederationConstructor() {
    return CurrentGlobal.__FEDERATION__.__DEBUG_CONSTRUCTOR__;
}
function setGlobalFederationConstructor(FederationConstructor, isDebug = sdk.isDebugMode()) {
    if (isDebug) {
        CurrentGlobal.__FEDERATION__.__DEBUG_CONSTRUCTOR__ = FederationConstructor;
        CurrentGlobal.__FEDERATION__.__DEBUG_CONSTRUCTOR_VERSION__ = "0.21.2";
    }
}
// eslint-disable-next-line @typescript-eslint/ban-types
function getInfoWithoutType(target, key) {
    if (typeof key === 'string') {
        const keyRes = target[key];
        if (keyRes) {
            return {
                value: target[key],
                key: key,
            };
        }
        else {
            const targetKeys = Object.keys(target);
            for (const targetKey of targetKeys) {
                const [targetTypeOrName, _] = targetKey.split(':');
                const nKey = `${targetTypeOrName}:${key}`;
                const typeWithKeyRes = target[nKey];
                if (typeWithKeyRes) {
                    return {
                        value: typeWithKeyRes,
                        key: nKey,
                    };
                }
            }
            return {
                value: undefined,
                key: key,
            };
        }
    }
    else {
        throw new Error('key must be string');
    }
}
const getGlobalSnapshot = () => nativeGlobal.__FEDERATION__.moduleInfo;
const getTargetSnapshotInfoByModuleInfo = (moduleInfo, snapshot) => {
    // Check if the remote is included in the hostSnapshot
    const moduleKey = getFMId(moduleInfo);
    const getModuleInfo = getInfoWithoutType(snapshot, moduleKey).value;
    // The remoteSnapshot might not include a version
    if (getModuleInfo &&
        !getModuleInfo.version &&
        'version' in moduleInfo &&
        moduleInfo['version']) {
        getModuleInfo.version = moduleInfo['version'];
    }
    if (getModuleInfo) {
        return getModuleInfo;
    }
    // If the remote is not included in the hostSnapshot, deploy a micro app snapshot
    if ('version' in moduleInfo && moduleInfo['version']) {
        const { version, ...resModuleInfo } = moduleInfo;
        const moduleKeyWithoutVersion = getFMId(resModuleInfo);
        const getModuleInfoWithoutVersion = getInfoWithoutType(nativeGlobal.__FEDERATION__.moduleInfo, moduleKeyWithoutVersion).value;
        if (getModuleInfoWithoutVersion?.version === version) {
            return getModuleInfoWithoutVersion;
        }
    }
    return;
};
const getGlobalSnapshotInfoByModuleInfo = (moduleInfo) => getTargetSnapshotInfoByModuleInfo(moduleInfo, nativeGlobal.__FEDERATION__.moduleInfo);
const setGlobalSnapshotInfoByModuleInfo = (remoteInfo, moduleDetailInfo) => {
    const moduleKey = getFMId(remoteInfo);
    nativeGlobal.__FEDERATION__.moduleInfo[moduleKey] = moduleDetailInfo;
    return nativeGlobal.__FEDERATION__.moduleInfo;
};
const addGlobalSnapshot = (moduleInfos) => {
    nativeGlobal.__FEDERATION__.moduleInfo = {
        ...nativeGlobal.__FEDERATION__.moduleInfo,
        ...moduleInfos,
    };
    return () => {
        const keys = Object.keys(moduleInfos);
        for (const key of keys) {
            delete nativeGlobal.__FEDERATION__.moduleInfo[key];
        }
    };
};
const getRemoteEntryExports = (name, globalName) => {
    const remoteEntryKey = globalName || `__FEDERATION_${name}:custom__`;
    const entryExports = CurrentGlobal[remoteEntryKey];
    return {
        remoteEntryKey,
        entryExports,
    };
};
// This function is used to register global plugins.
// It iterates over the provided plugins and checks if they are already registered.
// If a plugin is not registered, it is added to the global plugins.
// If a plugin is already registered, a warning message is logged.
const registerGlobalPlugins = (plugins) => {
    const { __GLOBAL_PLUGIN__ } = nativeGlobal.__FEDERATION__;
    plugins.forEach((plugin) => {
        if (__GLOBAL_PLUGIN__.findIndex((p) => p.name === plugin.name) === -1) {
            __GLOBAL_PLUGIN__.push(plugin);
        }
        else {
            warn(`The plugin ${plugin.name} has been registered.`);
        }
    });
};
const getGlobalHostPlugins = () => nativeGlobal.__FEDERATION__.__GLOBAL_PLUGIN__;
const getPreloaded = (id) => CurrentGlobal.__FEDERATION__.__PRELOADED_MAP__.get(id);
const setPreloaded = (id) => CurrentGlobal.__FEDERATION__.__PRELOADED_MAP__.set(id, true);

const DEFAULT_SCOPE = 'default';
const DEFAULT_REMOTE_TYPE = 'global';

// fork from https://github.com/originjs/vite-plugin-federation/blob/v1.1.12/packages/lib/src/utils/semver/index.ts
// those constants are based on https://www.rubydoc.info/gems/semantic_range/3.0.0/SemanticRange#BUILDIDENTIFIER-constant
// Copyright (c)
// vite-plugin-federation is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.
const buildIdentifier = '[0-9A-Za-z-]+';
const build = `(?:\\+(${buildIdentifier}(?:\\.${buildIdentifier})*))`;
const numericIdentifier = '0|[1-9]\\d*';
const numericIdentifierLoose = '[0-9]+';
const nonNumericIdentifier = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';
const preReleaseIdentifierLoose = `(?:${numericIdentifierLoose}|${nonNumericIdentifier})`;
const preReleaseLoose = `(?:-?(${preReleaseIdentifierLoose}(?:\\.${preReleaseIdentifierLoose})*))`;
const preReleaseIdentifier = `(?:${numericIdentifier}|${nonNumericIdentifier})`;
const preRelease = `(?:-(${preReleaseIdentifier}(?:\\.${preReleaseIdentifier})*))`;
const xRangeIdentifier = `${numericIdentifier}|x|X|\\*`;
const xRangePlain = `[v=\\s]*(${xRangeIdentifier})(?:\\.(${xRangeIdentifier})(?:\\.(${xRangeIdentifier})(?:${preRelease})?${build}?)?)?`;
const hyphenRange = `^\\s*(${xRangePlain})\\s+-\\s+(${xRangePlain})\\s*$`;
const mainVersionLoose = `(${numericIdentifierLoose})\\.(${numericIdentifierLoose})\\.(${numericIdentifierLoose})`;
const loosePlain = `[v=\\s]*${mainVersionLoose}${preReleaseLoose}?${build}?`;
const gtlt = '((?:<|>)?=?)';
const comparatorTrim = `(\\s*)${gtlt}\\s*(${loosePlain}|${xRangePlain})`;
const loneTilde = '(?:~>?)';
const tildeTrim = `(\\s*)${loneTilde}\\s+`;
const loneCaret = '(?:\\^)';
const caretTrim = `(\\s*)${loneCaret}\\s+`;
const star = '(<|>)?=?\\s*\\*';
const caret = `^${loneCaret}${xRangePlain}$`;
const mainVersion = `(${numericIdentifier})\\.(${numericIdentifier})\\.(${numericIdentifier})`;
const fullPlain = `v?${mainVersion}${preRelease}?${build}?`;
const tilde = `^${loneTilde}${xRangePlain}$`;
const xRange = `^${gtlt}\\s*${xRangePlain}$`;
const comparator = `^${gtlt}\\s*(${fullPlain})$|^$`;
// copy from semver package
const gte0 = '^\\s*>=\\s*0.0.0\\s*$';

// fork from https://github.com/originjs/vite-plugin-federation/blob/v1.1.12/packages/lib/src/utils/semver/index.ts
// Copyright (c)
// vite-plugin-federation is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.
function parseRegex(source) {
    return new RegExp(source);
}
function isXVersion(version) {
    return !version || version.toLowerCase() === 'x' || version === '*';
}
function pipe(...fns) {
    return (x) => fns.reduce((v, f) => f(v), x);
}
function extractComparator(comparatorString) {
    return comparatorString.match(parseRegex(comparator));
}
function combineVersion(major, minor, patch, preRelease) {
    const mainVersion = `${major}.${minor}.${patch}`;
    if (preRelease) {
        return `${mainVersion}-${preRelease}`;
    }
    return mainVersion;
}

// fork from https://github.com/originjs/vite-plugin-federation/blob/v1.1.12/packages/lib/src/utils/semver/index.ts
// Copyright (c)
// vite-plugin-federation is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.
function parseHyphen(range) {
    return range.replace(parseRegex(hyphenRange), (_range, from, fromMajor, fromMinor, fromPatch, _fromPreRelease, _fromBuild, to, toMajor, toMinor, toPatch, toPreRelease) => {
        if (isXVersion(fromMajor)) {
            from = '';
        }
        else if (isXVersion(fromMinor)) {
            from = `>=${fromMajor}.0.0`;
        }
        else if (isXVersion(fromPatch)) {
            from = `>=${fromMajor}.${fromMinor}.0`;
        }
        else {
            from = `>=${from}`;
        }
        if (isXVersion(toMajor)) {
            to = '';
        }
        else if (isXVersion(toMinor)) {
            to = `<${Number(toMajor) + 1}.0.0-0`;
        }
        else if (isXVersion(toPatch)) {
            to = `<${toMajor}.${Number(toMinor) + 1}.0-0`;
        }
        else if (toPreRelease) {
            to = `<=${toMajor}.${toMinor}.${toPatch}-${toPreRelease}`;
        }
        else {
            to = `<=${to}`;
        }
        return `${from} ${to}`.trim();
    });
}
function parseComparatorTrim(range) {
    return range.replace(parseRegex(comparatorTrim), '$1$2$3');
}
function parseTildeTrim(range) {
    return range.replace(parseRegex(tildeTrim), '$1~');
}
function parseCaretTrim(range) {
    return range.replace(parseRegex(caretTrim), '$1^');
}
function parseCarets(range) {
    return range
        .trim()
        .split(/\s+/)
        .map((rangeVersion) => rangeVersion.replace(parseRegex(caret), (_, major, minor, patch, preRelease) => {
        if (isXVersion(major)) {
            return '';
        }
        else if (isXVersion(minor)) {
            return `>=${major}.0.0 <${Number(major) + 1}.0.0-0`;
        }
        else if (isXVersion(patch)) {
            if (major === '0') {
                return `>=${major}.${minor}.0 <${major}.${Number(minor) + 1}.0-0`;
            }
            else {
                return `>=${major}.${minor}.0 <${Number(major) + 1}.0.0-0`;
            }
        }
        else if (preRelease) {
            if (major === '0') {
                if (minor === '0') {
                    return `>=${major}.${minor}.${patch}-${preRelease} <${major}.${minor}.${Number(patch) + 1}-0`;
                }
                else {
                    return `>=${major}.${minor}.${patch}-${preRelease} <${major}.${Number(minor) + 1}.0-0`;
                }
            }
            else {
                return `>=${major}.${minor}.${patch}-${preRelease} <${Number(major) + 1}.0.0-0`;
            }
        }
        else {
            if (major === '0') {
                if (minor === '0') {
                    return `>=${major}.${minor}.${patch} <${major}.${minor}.${Number(patch) + 1}-0`;
                }
                else {
                    return `>=${major}.${minor}.${patch} <${major}.${Number(minor) + 1}.0-0`;
                }
            }
            return `>=${major}.${minor}.${patch} <${Number(major) + 1}.0.0-0`;
        }
    }))
        .join(' ');
}
function parseTildes(range) {
    return range
        .trim()
        .split(/\s+/)
        .map((rangeVersion) => rangeVersion.replace(parseRegex(tilde), (_, major, minor, patch, preRelease) => {
        if (isXVersion(major)) {
            return '';
        }
        else if (isXVersion(minor)) {
            return `>=${major}.0.0 <${Number(major) + 1}.0.0-0`;
        }
        else if (isXVersion(patch)) {
            return `>=${major}.${minor}.0 <${major}.${Number(minor) + 1}.0-0`;
        }
        else if (preRelease) {
            return `>=${major}.${minor}.${patch}-${preRelease} <${major}.${Number(minor) + 1}.0-0`;
        }
        return `>=${major}.${minor}.${patch} <${major}.${Number(minor) + 1}.0-0`;
    }))
        .join(' ');
}
function parseXRanges(range) {
    return range
        .split(/\s+/)
        .map((rangeVersion) => rangeVersion
        .trim()
        .replace(parseRegex(xRange), (ret, gtlt, major, minor, patch, preRelease) => {
        const isXMajor = isXVersion(major);
        const isXMinor = isXMajor || isXVersion(minor);
        const isXPatch = isXMinor || isXVersion(patch);
        if (gtlt === '=' && isXPatch) {
            gtlt = '';
        }
        preRelease = '';
        if (isXMajor) {
            if (gtlt === '>' || gtlt === '<') {
                // nothing is allowed
                return '<0.0.0-0';
            }
            else {
                // nothing is forbidden
                return '*';
            }
        }
        else if (gtlt && isXPatch) {
            // replace X with 0
            if (isXMinor) {
                minor = 0;
            }
            patch = 0;
            if (gtlt === '>') {
                // >1 => >=2.0.0
                // >1.2 => >=1.3.0
                gtlt = '>=';
                if (isXMinor) {
                    major = Number(major) + 1;
                    minor = 0;
                    patch = 0;
                }
                else {
                    minor = Number(minor) + 1;
                    patch = 0;
                }
            }
            else if (gtlt === '<=') {
                // <=0.7.x is actually <0.8.0, since any 0.7.x should pass
                // Similarly, <=7.x is actually <8.0.0, etc.
                gtlt = '<';
                if (isXMinor) {
                    major = Number(major) + 1;
                }
                else {
                    minor = Number(minor) + 1;
                }
            }
            if (gtlt === '<') {
                preRelease = '-0';
            }
            return `${gtlt + major}.${minor}.${patch}${preRelease}`;
        }
        else if (isXMinor) {
            return `>=${major}.0.0${preRelease} <${Number(major) + 1}.0.0-0`;
        }
        else if (isXPatch) {
            return `>=${major}.${minor}.0${preRelease} <${major}.${Number(minor) + 1}.0-0`;
        }
        return ret;
    }))
        .join(' ');
}
function parseStar(range) {
    return range.trim().replace(parseRegex(star), '');
}
function parseGTE0(comparatorString) {
    return comparatorString.trim().replace(parseRegex(gte0), '');
}

// fork from https://github.com/originjs/vite-plugin-federation/blob/v1.1.12/packages/lib/src/utils/semver/index.ts
// Copyright (c)
// vite-plugin-federation is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.
function compareAtom(rangeAtom, versionAtom) {
    rangeAtom = Number(rangeAtom) || rangeAtom;
    versionAtom = Number(versionAtom) || versionAtom;
    if (rangeAtom > versionAtom) {
        return 1;
    }
    if (rangeAtom === versionAtom) {
        return 0;
    }
    return -1;
}
function comparePreRelease(rangeAtom, versionAtom) {
    const { preRelease: rangePreRelease } = rangeAtom;
    const { preRelease: versionPreRelease } = versionAtom;
    if (rangePreRelease === undefined && Boolean(versionPreRelease)) {
        return 1;
    }
    if (Boolean(rangePreRelease) && versionPreRelease === undefined) {
        return -1;
    }
    if (rangePreRelease === undefined && versionPreRelease === undefined) {
        return 0;
    }
    for (let i = 0, n = rangePreRelease.length; i <= n; i++) {
        const rangeElement = rangePreRelease[i];
        const versionElement = versionPreRelease[i];
        if (rangeElement === versionElement) {
            continue;
        }
        if (rangeElement === undefined && versionElement === undefined) {
            return 0;
        }
        if (!rangeElement) {
            return 1;
        }
        if (!versionElement) {
            return -1;
        }
        return compareAtom(rangeElement, versionElement);
    }
    return 0;
}
function compareVersion(rangeAtom, versionAtom) {
    return (compareAtom(rangeAtom.major, versionAtom.major) ||
        compareAtom(rangeAtom.minor, versionAtom.minor) ||
        compareAtom(rangeAtom.patch, versionAtom.patch) ||
        comparePreRelease(rangeAtom, versionAtom));
}
function eq(rangeAtom, versionAtom) {
    return rangeAtom.version === versionAtom.version;
}
function compare(rangeAtom, versionAtom) {
    switch (rangeAtom.operator) {
        case '':
        case '=':
            return eq(rangeAtom, versionAtom);
        case '>':
            return compareVersion(rangeAtom, versionAtom) < 0;
        case '>=':
            return (eq(rangeAtom, versionAtom) || compareVersion(rangeAtom, versionAtom) < 0);
        case '<':
            return compareVersion(rangeAtom, versionAtom) > 0;
        case '<=':
            return (eq(rangeAtom, versionAtom) || compareVersion(rangeAtom, versionAtom) > 0);
        case undefined: {
            // mean * or x -> all versions
            return true;
        }
        default:
            return false;
    }
}

// fork from https://github.com/originjs/vite-plugin-federation/blob/v1.1.12/packages/lib/src/utils/semver/index.ts
// Copyright (c)
// vite-plugin-federation is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.
function parseComparatorString(range) {
    return pipe(
    // handle caret
    // ^ --> * (any, kinda silly)
    // ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
    // ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
    // ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
    // ^1.2.3 --> >=1.2.3 <2.0.0-0
    // ^1.2.0 --> >=1.2.0 <2.0.0-0
    parseCarets, 
    // handle tilde
    // ~, ~> --> * (any, kinda silly)
    // ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
    // ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
    // ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
    // ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
    // ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
    parseTildes, parseXRanges, parseStar)(range);
}
function parseRange(range) {
    return pipe(
    // handle hyphenRange
    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
    parseHyphen, 
    // handle trim comparator
    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
    parseComparatorTrim, 
    // handle trim tilde
    // `~ 1.2.3` => `~1.2.3`
    parseTildeTrim, 
    // handle trim caret
    // `^ 1.2.3` => `^1.2.3`
    parseCaretTrim)(range.trim())
        .split(/\s+/)
        .join(' ');
}
function satisfy(version, range) {
    if (!version) {
        return false;
    }
    // Extract version details once
    const extractedVersion = extractComparator(version);
    if (!extractedVersion) {
        // If the version string is invalid, it can't satisfy any range
        return false;
    }
    const [, versionOperator, , versionMajor, versionMinor, versionPatch, versionPreRelease,] = extractedVersion;
    const versionAtom = {
        operator: versionOperator,
        version: combineVersion(versionMajor, versionMinor, versionPatch, versionPreRelease), // exclude build atom
        major: versionMajor,
        minor: versionMinor,
        patch: versionPatch,
        preRelease: versionPreRelease?.split('.'),
    };
    // Split the range by || to handle OR conditions
    const orRanges = range.split('||');
    for (const orRange of orRanges) {
        const trimmedOrRange = orRange.trim();
        if (!trimmedOrRange) {
            // An empty range string signifies wildcard *, satisfy any valid version
            // (We already checked if the version itself is valid)
            return true;
        }
        // Handle simple wildcards explicitly before complex parsing
        if (trimmedOrRange === '*' || trimmedOrRange === 'x') {
            return true;
        }
        try {
            // Apply existing parsing logic to the current OR sub-range
            const parsedSubRange = parseRange(trimmedOrRange); // Handles hyphens, trims etc.
            // Check if the result of initial parsing is empty, which can happen
            // for some wildcard cases handled by parseRange/parseComparatorString.
            // E.g. `parseStar` used in `parseComparatorString` returns ''.
            if (!parsedSubRange.trim()) {
                // If parsing results in empty string, treat as wildcard match
                return true;
            }
            const parsedComparatorString = parsedSubRange
                .split(' ')
                .map((rangeVersion) => parseComparatorString(rangeVersion)) // Expands ^, ~
                .join(' ');
            // Check again if the comparator string became empty after specific parsing like ^ or ~
            if (!parsedComparatorString.trim()) {
                return true;
            }
            // Split the sub-range by space for implicit AND conditions
            const comparators = parsedComparatorString
                .split(/\s+/)
                .map((comparator) => parseGTE0(comparator))
                // Filter out empty strings that might result from multiple spaces
                .filter(Boolean);
            // If a sub-range becomes empty after parsing (e.g., invalid characters),
            // it cannot be satisfied. This check might be redundant now but kept for safety.
            if (comparators.length === 0) {
                continue;
            }
            let subRangeSatisfied = true;
            for (const comparator of comparators) {
                const extractedComparator = extractComparator(comparator);
                // If any part of the AND sub-range is invalid, the sub-range is not satisfied
                if (!extractedComparator) {
                    subRangeSatisfied = false;
                    break;
                }
                const [, rangeOperator, , rangeMajor, rangeMinor, rangePatch, rangePreRelease,] = extractedComparator;
                const rangeAtom = {
                    operator: rangeOperator,
                    version: combineVersion(rangeMajor, rangeMinor, rangePatch, rangePreRelease),
                    major: rangeMajor,
                    minor: rangeMinor,
                    patch: rangePatch,
                    preRelease: rangePreRelease?.split('.'),
                };
                // Check if the version satisfies this specific comparator in the AND chain
                if (!compare(rangeAtom, versionAtom)) {
                    subRangeSatisfied = false; // This part of the AND condition failed
                    break; // No need to check further comparators in this sub-range
                }
            }
            // If all AND conditions within this OR sub-range were met, the overall range is satisfied
            if (subRangeSatisfied) {
                return true;
            }
        }
        catch (e) {
            // Log error and treat this sub-range as unsatisfied
            console.error(`[semver] Error processing range part "${trimmedOrRange}":`, e);
            continue;
        }
    }
    // If none of the OR sub-ranges were satisfied
    return false;
}

function formatShare(shareArgs, from, name, shareStrategy) {
    let get;
    if ('get' in shareArgs) {
        // eslint-disable-next-line prefer-destructuring
        get = shareArgs.get;
    }
    else if ('lib' in shareArgs) {
        get = () => Promise.resolve(shareArgs.lib);
    }
    else {
        get = () => Promise.resolve(() => {
            throw new Error(`Can not get shared '${name}'!`);
        });
    }
    return {
        deps: [],
        useIn: [],
        from,
        loading: null,
        ...shareArgs,
        shareConfig: {
            requiredVersion: `^${shareArgs.version}`,
            singleton: false,
            eager: false,
            strictVersion: false,
            ...shareArgs.shareConfig,
        },
        get,
        loaded: shareArgs?.loaded || 'lib' in shareArgs ? true : undefined,
        version: shareArgs.version ?? '0',
        scope: Array.isArray(shareArgs.scope)
            ? shareArgs.scope
            : [shareArgs.scope ?? 'default'],
        strategy: (shareArgs.strategy ?? shareStrategy) || 'version-first',
    };
}
function formatShareConfigs(globalOptions, userOptions) {
    const shareArgs = userOptions.shared || {};
    const from = userOptions.name;
    const shareInfos = Object.keys(shareArgs).reduce((res, pkgName) => {
        const arrayShareArgs = arrayOptions(shareArgs[pkgName]);
        res[pkgName] = res[pkgName] || [];
        arrayShareArgs.forEach((shareConfig) => {
            res[pkgName].push(formatShare(shareConfig, from, pkgName, userOptions.shareStrategy));
        });
        return res;
    }, {});
    const shared = {
        ...globalOptions.shared,
    };
    Object.keys(shareInfos).forEach((shareKey) => {
        if (!shared[shareKey]) {
            shared[shareKey] = shareInfos[shareKey];
        }
        else {
            shareInfos[shareKey].forEach((newUserSharedOptions) => {
                const isSameVersion = shared[shareKey].find((sharedVal) => sharedVal.version === newUserSharedOptions.version);
                if (!isSameVersion) {
                    shared[shareKey].push(newUserSharedOptions);
                }
            });
        }
    });
    return { shared, shareInfos };
}
function versionLt(a, b) {
    const transformInvalidVersion = (version) => {
        const isNumberVersion = !Number.isNaN(Number(version));
        if (isNumberVersion) {
            const splitArr = version.split('.');
            let validVersion = version;
            for (let i = 0; i < 3 - splitArr.length; i++) {
                validVersion += '.0';
            }
            return validVersion;
        }
        return version;
    };
    if (satisfy(transformInvalidVersion(a), `<=${transformInvalidVersion(b)}`)) {
        return true;
    }
    else {
        return false;
    }
}
const findVersion = (shareVersionMap, cb) => {
    const callback = cb ||
        function (prev, cur) {
            return versionLt(prev, cur);
        };
    return Object.keys(shareVersionMap).reduce((prev, cur) => {
        if (!prev) {
            return cur;
        }
        if (callback(prev, cur)) {
            return cur;
        }
        // default version is '0' https://github.com/webpack/webpack/blob/main/lib/sharing/ProvideSharedModule.js#L136
        if (prev === '0') {
            return cur;
        }
        return prev;
    }, 0);
};
const isLoaded = (shared) => {
    return Boolean(shared.loaded) || typeof shared.lib === 'function';
};
const isLoading = (shared) => {
    return Boolean(shared.loading);
};
function findSingletonVersionOrderByVersion(shareScopeMap, scope, pkgName) {
    const versions = shareScopeMap[scope][pkgName];
    const callback = function (prev, cur) {
        return !isLoaded(versions[prev]) && versionLt(prev, cur);
    };
    return findVersion(shareScopeMap[scope][pkgName], callback);
}
function findSingletonVersionOrderByLoaded(shareScopeMap, scope, pkgName) {
    const versions = shareScopeMap[scope][pkgName];
    const callback = function (prev, cur) {
        const isLoadingOrLoaded = (shared) => {
            return isLoaded(shared) || isLoading(shared);
        };
        if (isLoadingOrLoaded(versions[cur])) {
            if (isLoadingOrLoaded(versions[prev])) {
                return Boolean(versionLt(prev, cur));
            }
            else {
                return true;
            }
        }
        if (isLoadingOrLoaded(versions[prev])) {
            return false;
        }
        return versionLt(prev, cur);
    };
    return findVersion(shareScopeMap[scope][pkgName], callback);
}
function getFindShareFunction(strategy) {
    if (strategy === 'loaded-first') {
        return findSingletonVersionOrderByLoaded;
    }
    return findSingletonVersionOrderByVersion;
}
function getRegisteredShare(localShareScopeMap, pkgName, shareInfo, resolveShare) {
    if (!localShareScopeMap) {
        return;
    }
    const { shareConfig, scope = DEFAULT_SCOPE, strategy } = shareInfo;
    const scopes = Array.isArray(scope) ? scope : [scope];
    for (const sc of scopes) {
        if (shareConfig &&
            localShareScopeMap[sc] &&
            localShareScopeMap[sc][pkgName]) {
            const { requiredVersion } = shareConfig;
            const findShareFunction = getFindShareFunction(strategy);
            const maxOrSingletonVersion = findShareFunction(localShareScopeMap, sc, pkgName);
            //@ts-ignore
            const defaultResolver = () => {
                if (shareConfig.singleton) {
                    if (typeof requiredVersion === 'string' &&
                        !satisfy(maxOrSingletonVersion, requiredVersion)) {
                        const msg = `Version ${maxOrSingletonVersion} from ${maxOrSingletonVersion &&
                            localShareScopeMap[sc][pkgName][maxOrSingletonVersion].from} of shared singleton module ${pkgName} does not satisfy the requirement of ${shareInfo.from} which needs ${requiredVersion})`;
                        if (shareConfig.strictVersion) {
                            error(msg);
                        }
                        else {
                            warn(msg);
                        }
                    }
                    return localShareScopeMap[sc][pkgName][maxOrSingletonVersion];
                }
                else {
                    if (requiredVersion === false || requiredVersion === '*') {
                        return localShareScopeMap[sc][pkgName][maxOrSingletonVersion];
                    }
                    if (satisfy(maxOrSingletonVersion, requiredVersion)) {
                        return localShareScopeMap[sc][pkgName][maxOrSingletonVersion];
                    }
                    for (const [versionKey, versionValue] of Object.entries(localShareScopeMap[sc][pkgName])) {
                        if (satisfy(versionKey, requiredVersion)) {
                            return versionValue;
                        }
                    }
                }
            };
            const params = {
                shareScopeMap: localShareScopeMap,
                scope: sc,
                pkgName,
                version: maxOrSingletonVersion,
                GlobalFederation: Global.__FEDERATION__,
                resolver: defaultResolver,
            };
            const resolveShared = resolveShare.emit(params) || params;
            return resolveShared.resolver();
        }
    }
}
function getGlobalShareScope() {
    return Global.__FEDERATION__.__SHARE__;
}
function getTargetSharedOptions(options) {
    const { pkgName, extraOptions, shareInfos } = options;
    const defaultResolver = (sharedOptions) => {
        if (!sharedOptions) {
            return undefined;
        }
        const shareVersionMap = {};
        sharedOptions.forEach((shared) => {
            shareVersionMap[shared.version] = shared;
        });
        const callback = function (prev, cur) {
            return !isLoaded(shareVersionMap[prev]) && versionLt(prev, cur);
        };
        const maxVersion = findVersion(shareVersionMap, callback);
        return shareVersionMap[maxVersion];
    };
    const resolver = extraOptions?.resolver ?? defaultResolver;
    return Object.assign({}, resolver(shareInfos[pkgName]), extraOptions?.customShareInfo);
}

function getBuilderId() {
    //@ts-ignore
    return typeof FEDERATION_BUILD_IDENTIFIER !== 'undefined'
        ? //@ts-ignore
            FEDERATION_BUILD_IDENTIFIER
        : '';
}

// Function to match a remote with its name and expose
// id: pkgName(@federation/app1) + expose(button) = @federation/app1/button
// id: alias(app1) + expose(button) = app1/button
// id: alias(app1/utils) + expose(loadash/sort) = app1/utils/loadash/sort
function matchRemoteWithNameAndExpose(remotes, id) {
    for (const remote of remotes) {
        // match pkgName
        const isNameMatched = id.startsWith(remote.name);
        let expose = id.replace(remote.name, '');
        if (isNameMatched) {
            if (expose.startsWith('/')) {
                const pkgNameOrAlias = remote.name;
                expose = `.${expose}`;
                return {
                    pkgNameOrAlias,
                    expose,
                    remote,
                };
            }
            else if (expose === '') {
                return {
                    pkgNameOrAlias: remote.name,
                    expose: '.',
                    remote,
                };
            }
        }
        // match alias
        const isAliasMatched = remote.alias && id.startsWith(remote.alias);
        let exposeWithAlias = remote.alias && id.replace(remote.alias, '');
        if (remote.alias && isAliasMatched) {
            if (exposeWithAlias && exposeWithAlias.startsWith('/')) {
                const pkgNameOrAlias = remote.alias;
                exposeWithAlias = `.${exposeWithAlias}`;
                return {
                    pkgNameOrAlias,
                    expose: exposeWithAlias,
                    remote,
                };
            }
            else if (exposeWithAlias === '') {
                return {
                    pkgNameOrAlias: remote.alias,
                    expose: '.',
                    remote,
                };
            }
        }
    }
    return;
}
// Function to match a remote with its name or alias
function matchRemote(remotes, nameOrAlias) {
    for (const remote of remotes) {
        const isNameMatched = nameOrAlias === remote.name;
        if (isNameMatched) {
            return remote;
        }
        const isAliasMatched = remote.alias && nameOrAlias === remote.alias;
        if (isAliasMatched) {
            return remote;
        }
    }
    return;
}

function registerPlugins(plugins, instance) {
    const globalPlugins = getGlobalHostPlugins();
    const hookInstances = [
        instance.hooks,
        instance.remoteHandler.hooks,
        instance.sharedHandler.hooks,
        instance.snapshotHandler.hooks,
        instance.loaderHook,
        instance.bridgeHook,
    ];
    // Incorporate global plugins
    if (globalPlugins.length > 0) {
        globalPlugins.forEach((plugin) => {
            if (plugins?.find((item) => item.name !== plugin.name)) {
                plugins.push(plugin);
            }
        });
    }
    if (plugins && plugins.length > 0) {
        plugins.forEach((plugin) => {
            hookInstances.forEach((hookInstance) => {
                hookInstance.applyPlugin(plugin, instance);
            });
        });
    }
    return plugins;
}

const importCallback = '.then(callbacks[0]).catch(callbacks[1])';
async function loadEsmEntry({ entry, remoteEntryExports, }) {
    return new Promise((resolve, reject) => {
        try {
            if (!remoteEntryExports) {
                if (typeof FEDERATION_ALLOW_NEW_FUNCTION !== 'undefined') {
                    new Function('callbacks', `import("${entry}")${importCallback}`)([
                        resolve,
                        reject,
                    ]);
                }
                else {
                    import(/* webpackIgnore: true */ /* @vite-ignore */ entry)
                        .then(resolve)
                        .catch(reject);
                }
            }
            else {
                resolve(remoteEntryExports);
            }
        }
        catch (e) {
            reject(e);
        }
    });
}
async function loadSystemJsEntry({ entry, remoteEntryExports, }) {
    return new Promise((resolve, reject) => {
        try {
            if (!remoteEntryExports) {
                //@ts-ignore
                if (false) {}
                else {
                    new Function('callbacks', `System.import("${entry}")${importCallback}`)([resolve, reject]);
                }
            }
            else {
                resolve(remoteEntryExports);
            }
        }
        catch (e) {
            reject(e);
        }
    });
}
function handleRemoteEntryLoaded(name, globalName, entry) {
    const { remoteEntryKey, entryExports } = getRemoteEntryExports(name, globalName);
    assert(entryExports, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_001, errorCodes.runtimeDescMap, {
        remoteName: name,
        remoteEntryUrl: entry,
        remoteEntryKey,
    }));
    return entryExports;
}
async function loadEntryScript({ name, globalName, entry, loaderHook, getEntryUrl, }) {
    const { entryExports: remoteEntryExports } = getRemoteEntryExports(name, globalName);
    if (remoteEntryExports) {
        return remoteEntryExports;
    }
    // if getEntryUrl is passed, use the getEntryUrl to get the entry url
    const url = getEntryUrl ? getEntryUrl(entry) : entry;
    return sdk.loadScript(url, {
        attrs: {},
        createScriptHook: (url, attrs) => {
            const res = loaderHook.lifecycle.createScript.emit({ url, attrs });
            if (!res)
                return;
            if (res instanceof HTMLScriptElement) {
                return res;
            }
            if ('script' in res || 'timeout' in res) {
                return res;
            }
            return;
        },
    })
        .then(() => {
        return handleRemoteEntryLoaded(name, globalName, entry);
    })
        .catch((e) => {
        assert(undefined, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_008, errorCodes.runtimeDescMap, {
            remoteName: name,
            resourceUrl: entry,
        }));
        throw e;
    });
}
async function loadEntryDom({ remoteInfo, remoteEntryExports, loaderHook, getEntryUrl, }) {
    const { entry, entryGlobalName: globalName, name, type } = remoteInfo;
    switch (type) {
        case 'esm':
        case 'module':
            return loadEsmEntry({ entry, remoteEntryExports });
        case 'system':
            return loadSystemJsEntry({ entry, remoteEntryExports });
        default:
            return loadEntryScript({
                entry,
                globalName,
                name,
                loaderHook,
                getEntryUrl,
            });
    }
}
async function loadEntryNode({ remoteInfo, loaderHook, }) {
    const { entry, entryGlobalName: globalName, name, type } = remoteInfo;
    const { entryExports: remoteEntryExports } = getRemoteEntryExports(name, globalName);
    if (remoteEntryExports) {
        return remoteEntryExports;
    }
    return sdk.loadScriptNode(entry, {
        attrs: { name, globalName, type },
        loaderHook: {
            createScriptHook: (url, attrs = {}) => {
                const res = loaderHook.lifecycle.createScript.emit({ url, attrs });
                if (!res)
                    return;
                if ('url' in res) {
                    return res;
                }
                return;
            },
        },
    })
        .then(() => {
        return handleRemoteEntryLoaded(name, globalName, entry);
    })
        .catch((e) => {
        throw e;
    });
}
function getRemoteEntryUniqueKey(remoteInfo) {
    const { entry, name } = remoteInfo;
    return sdk.composeKeyWithSeparator(name, entry);
}
async function getRemoteEntry(params) {
    const { origin, remoteEntryExports, remoteInfo, getEntryUrl, _inErrorHandling = false, } = params;
    const uniqueKey = getRemoteEntryUniqueKey(remoteInfo);
    if (remoteEntryExports) {
        return remoteEntryExports;
    }
    if (!globalLoading[uniqueKey]) {
        const loadEntryHook = origin.remoteHandler.hooks.lifecycle.loadEntry;
        const loaderHook = origin.loaderHook;
        globalLoading[uniqueKey] = loadEntryHook
            .emit({
            loaderHook,
            remoteInfo,
            remoteEntryExports,
        })
            .then((res) => {
            if (res) {
                return res;
            }
            // Use ENV_TARGET if defined, otherwise fallback to isBrowserEnv, must keep this
            const isWebEnvironment = typeof ENV_TARGET !== 'undefined'
                ? ENV_TARGET === 'web'
                : sdk.isBrowserEnv();
            return isWebEnvironment
                ? loadEntryDom({
                    remoteInfo,
                    remoteEntryExports,
                    loaderHook,
                    getEntryUrl,
                })
                : loadEntryNode({ remoteInfo, loaderHook });
        })
            .catch(async (err) => {
            const uniqueKey = getRemoteEntryUniqueKey(remoteInfo);
            const isScriptLoadError = err instanceof Error && err.message.includes(errorCodes.RUNTIME_008);
            if (isScriptLoadError && !_inErrorHandling) {
                const wrappedGetRemoteEntry = (params) => {
                    return getRemoteEntry({ ...params, _inErrorHandling: true });
                };
                const RemoteEntryExports = await origin.loaderHook.lifecycle.loadEntryError.emit({
                    getRemoteEntry: wrappedGetRemoteEntry,
                    origin,
                    remoteInfo: remoteInfo,
                    remoteEntryExports,
                    globalLoading,
                    uniqueKey,
                });
                if (RemoteEntryExports) {
                    return RemoteEntryExports;
                }
            }
            throw err;
        });
    }
    return globalLoading[uniqueKey];
}
function getRemoteInfo(remote) {
    return {
        ...remote,
        entry: 'entry' in remote ? remote.entry : '',
        type: remote.type || DEFAULT_REMOTE_TYPE,
        entryGlobalName: remote.entryGlobalName || remote.name,
        shareScope: remote.shareScope || DEFAULT_SCOPE,
    };
}

function defaultPreloadArgs(preloadConfig) {
    return {
        resourceCategory: 'sync',
        share: true,
        depsRemote: true,
        prefetchInterface: false,
        ...preloadConfig,
    };
}
function formatPreloadArgs(remotes, preloadArgs) {
    return preloadArgs.map((args) => {
        const remoteInfo = matchRemote(remotes, args.nameOrAlias);
        assert(remoteInfo, `Unable to preload ${args.nameOrAlias} as it is not included in ${!remoteInfo &&
            sdk.safeToString({
                remoteInfo,
                remotes,
            })}`);
        return {
            remote: remoteInfo,
            preloadConfig: defaultPreloadArgs(args),
        };
    });
}
function normalizePreloadExposes(exposes) {
    if (!exposes) {
        return [];
    }
    return exposes.map((expose) => {
        if (expose === '.') {
            return expose;
        }
        if (expose.startsWith('./')) {
            return expose.replace('./', '');
        }
        return expose;
    });
}
function preloadAssets(remoteInfo, host, assets, 
// It is used to distinguish preload from load remote parallel loading
useLinkPreload = true) {
    const { cssAssets, jsAssetsWithoutEntry, entryAssets } = assets;
    if (host.options.inBrowser) {
        entryAssets.forEach((asset) => {
            const { moduleInfo } = asset;
            const module = host.moduleCache.get(remoteInfo.name);
            if (module) {
                getRemoteEntry({
                    origin: host,
                    remoteInfo: moduleInfo,
                    remoteEntryExports: module.remoteEntryExports,
                });
            }
            else {
                getRemoteEntry({
                    origin: host,
                    remoteInfo: moduleInfo,
                    remoteEntryExports: undefined,
                });
            }
        });
        if (useLinkPreload) {
            const defaultAttrs = {
                rel: 'preload',
                as: 'style',
            };
            cssAssets.forEach((cssUrl) => {
                const { link: cssEl, needAttach } = sdk.createLink({
                    url: cssUrl,
                    cb: () => {
                        // noop
                    },
                    attrs: defaultAttrs,
                    createLinkHook: (url, attrs) => {
                        const res = host.loaderHook.lifecycle.createLink.emit({
                            url,
                            attrs,
                        });
                        if (res instanceof HTMLLinkElement) {
                            return res;
                        }
                        return;
                    },
                });
                needAttach && document.head.appendChild(cssEl);
            });
        }
        else {
            const defaultAttrs = {
                rel: 'stylesheet',
                type: 'text/css',
            };
            cssAssets.forEach((cssUrl) => {
                const { link: cssEl, needAttach } = sdk.createLink({
                    url: cssUrl,
                    cb: () => {
                        // noop
                    },
                    attrs: defaultAttrs,
                    createLinkHook: (url, attrs) => {
                        const res = host.loaderHook.lifecycle.createLink.emit({
                            url,
                            attrs,
                        });
                        if (res instanceof HTMLLinkElement) {
                            return res;
                        }
                        return;
                    },
                    needDeleteLink: false,
                });
                needAttach && document.head.appendChild(cssEl);
            });
        }
        if (useLinkPreload) {
            const defaultAttrs = {
                rel: 'preload',
                as: 'script',
            };
            jsAssetsWithoutEntry.forEach((jsUrl) => {
                const { link: linkEl, needAttach } = sdk.createLink({
                    url: jsUrl,
                    cb: () => {
                        // noop
                    },
                    attrs: defaultAttrs,
                    createLinkHook: (url, attrs) => {
                        const res = host.loaderHook.lifecycle.createLink.emit({
                            url,
                            attrs,
                        });
                        if (res instanceof HTMLLinkElement) {
                            return res;
                        }
                        return;
                    },
                });
                needAttach && document.head.appendChild(linkEl);
            });
        }
        else {
            const defaultAttrs = {
                fetchpriority: 'high',
                type: remoteInfo?.type === 'module' ? 'module' : 'text/javascript',
            };
            jsAssetsWithoutEntry.forEach((jsUrl) => {
                const { script: scriptEl, needAttach } = sdk.createScript({
                    url: jsUrl,
                    cb: () => {
                        // noop
                    },
                    attrs: defaultAttrs,
                    createScriptHook: (url, attrs) => {
                        const res = host.loaderHook.lifecycle.createScript.emit({
                            url,
                            attrs,
                        });
                        if (res instanceof HTMLScriptElement) {
                            return res;
                        }
                        return;
                    },
                    needDeleteScript: true,
                });
                needAttach && document.head.appendChild(scriptEl);
            });
        }
    }
}

const ShareUtils = {
    getRegisteredShare,
    getGlobalShareScope,
};
const GlobalUtils = {
    Global,
    nativeGlobal,
    resetFederationGlobalInfo,
    setGlobalFederationInstance,
    getGlobalFederationConstructor,
    setGlobalFederationConstructor,
    getInfoWithoutType,
    getGlobalSnapshot,
    getTargetSnapshotInfoByModuleInfo,
    getGlobalSnapshotInfoByModuleInfo,
    setGlobalSnapshotInfoByModuleInfo,
    addGlobalSnapshot,
    getRemoteEntryExports,
    registerGlobalPlugins,
    getGlobalHostPlugins,
    getPreloaded,
    setPreloaded,
};
var helpers = {
    global: GlobalUtils,
    share: ShareUtils,
    utils: {
        matchRemoteWithNameAndExpose,
        preloadAssets,
        getRemoteInfo,
    },
};

class Module {
    constructor({ remoteInfo, host, }) {
        this.inited = false;
        this.lib = undefined;
        this.remoteInfo = remoteInfo;
        this.host = host;
    }
    async getEntry() {
        if (this.remoteEntryExports) {
            return this.remoteEntryExports;
        }
        let remoteEntryExports;
        remoteEntryExports = await getRemoteEntry({
            origin: this.host,
            remoteInfo: this.remoteInfo,
            remoteEntryExports: this.remoteEntryExports,
        });
        assert(remoteEntryExports, `remoteEntryExports is undefined \n ${sdk.safeToString(this.remoteInfo)}`);
        this.remoteEntryExports = remoteEntryExports;
        return this.remoteEntryExports;
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async get(id, expose, options, remoteSnapshot) {
        const { loadFactory = true } = options || { loadFactory: true };
        // Get remoteEntry.js
        const remoteEntryExports = await this.getEntry();
        if (!this.inited) {
            const localShareScopeMap = this.host.shareScopeMap;
            const shareScopeKeys = Array.isArray(this.remoteInfo.shareScope)
                ? this.remoteInfo.shareScope
                : [this.remoteInfo.shareScope];
            if (!shareScopeKeys.length) {
                shareScopeKeys.push('default');
            }
            shareScopeKeys.forEach((shareScopeKey) => {
                if (!localShareScopeMap[shareScopeKey]) {
                    localShareScopeMap[shareScopeKey] = {};
                }
            });
            // TODO: compate legacy init params, should use shareScopeMap if exist
            const shareScope = localShareScopeMap[shareScopeKeys[0]];
            const initScope = [];
            const remoteEntryInitOptions = {
                version: this.remoteInfo.version || '',
                shareScopeKeys: Array.isArray(this.remoteInfo.shareScope)
                    ? shareScopeKeys
                    : this.remoteInfo.shareScope || 'default',
            };
            // Help to find host instance
            Object.defineProperty(remoteEntryInitOptions, 'shareScopeMap', {
                value: localShareScopeMap,
                // remoteEntryInitOptions will be traversed and assigned during container init, ,so this attribute is not allowed to be traversed
                enumerable: false,
            });
            const initContainerOptions = await this.host.hooks.lifecycle.beforeInitContainer.emit({
                shareScope,
                // @ts-ignore shareScopeMap will be set by Object.defineProperty
                remoteEntryInitOptions,
                initScope,
                remoteInfo: this.remoteInfo,
                origin: this.host,
            });
            if (typeof remoteEntryExports?.init === 'undefined') {
                error(errorCodes.getShortErrorMsg(errorCodes.RUNTIME_002, errorCodes.runtimeDescMap, {
                    hostName: this.host.name,
                    remoteName: this.remoteInfo.name,
                    remoteEntryUrl: this.remoteInfo.entry,
                    remoteEntryKey: this.remoteInfo.entryGlobalName,
                }));
            }
            await remoteEntryExports.init(initContainerOptions.shareScope, initContainerOptions.initScope, initContainerOptions.remoteEntryInitOptions);
            await this.host.hooks.lifecycle.initContainer.emit({
                ...initContainerOptions,
                id,
                remoteSnapshot,
                remoteEntryExports,
            });
        }
        this.lib = remoteEntryExports;
        this.inited = true;
        let moduleFactory;
        moduleFactory = await this.host.loaderHook.lifecycle.getModuleFactory.emit({
            remoteEntryExports,
            expose,
            moduleInfo: this.remoteInfo,
        });
        // get exposeGetter
        if (!moduleFactory) {
            moduleFactory = await remoteEntryExports.get(expose);
        }
        assert(moduleFactory, `${getFMId(this.remoteInfo)} remote don't export ${expose}.`);
        // keep symbol for module name always one format
        const symbolName = processModuleAlias(this.remoteInfo.name, expose);
        const wrapModuleFactory = this.wraperFactory(moduleFactory, symbolName);
        if (!loadFactory) {
            return wrapModuleFactory;
        }
        const exposeContent = await wrapModuleFactory();
        return exposeContent;
    }
    wraperFactory(moduleFactory, id) {
        function defineModuleId(res, id) {
            if (res &&
                typeof res === 'object' &&
                Object.isExtensible(res) &&
                !Object.getOwnPropertyDescriptor(res, Symbol.for('mf_module_id'))) {
                Object.defineProperty(res, Symbol.for('mf_module_id'), {
                    value: id,
                    enumerable: false,
                });
            }
        }
        if (moduleFactory instanceof Promise) {
            return async () => {
                const res = await moduleFactory();
                // This parameter is used for bridge debugging
                defineModuleId(res, id);
                return res;
            };
        }
        else {
            return () => {
                const res = moduleFactory();
                // This parameter is used for bridge debugging
                defineModuleId(res, id);
                return res;
            };
        }
    }
}

class SyncHook {
    constructor(type) {
        this.type = '';
        this.listeners = new Set();
        if (type) {
            this.type = type;
        }
    }
    on(fn) {
        if (typeof fn === 'function') {
            this.listeners.add(fn);
        }
    }
    once(fn) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        this.on(function wrapper(...args) {
            self.remove(wrapper);
            // eslint-disable-next-line prefer-spread
            return fn.apply(null, args);
        });
    }
    emit(...data) {
        let result;
        if (this.listeners.size > 0) {
            // eslint-disable-next-line prefer-spread
            this.listeners.forEach((fn) => {
                result = fn(...data);
            });
        }
        return result;
    }
    remove(fn) {
        this.listeners.delete(fn);
    }
    removeAll() {
        this.listeners.clear();
    }
}

class AsyncHook extends SyncHook {
    emit(...data) {
        let result;
        const ls = Array.from(this.listeners);
        if (ls.length > 0) {
            let i = 0;
            const call = (prev) => {
                if (prev === false) {
                    return false; // Abort process
                }
                else if (i < ls.length) {
                    return Promise.resolve(ls[i++].apply(null, data)).then(call);
                }
                else {
                    return prev;
                }
            };
            result = call();
        }
        return Promise.resolve(result);
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function checkReturnData(originalData, returnedData) {
    if (!isObject(returnedData)) {
        return false;
    }
    if (originalData !== returnedData) {
        // eslint-disable-next-line no-restricted-syntax
        for (const key in originalData) {
            if (!(key in returnedData)) {
                return false;
            }
        }
    }
    return true;
}
class SyncWaterfallHook extends SyncHook {
    constructor(type) {
        super();
        this.onerror = error;
        this.type = type;
    }
    emit(data) {
        if (!isObject(data)) {
            error(`The data for the "${this.type}" hook should be an object.`);
        }
        for (const fn of this.listeners) {
            try {
                const tempData = fn(data);
                if (checkReturnData(data, tempData)) {
                    data = tempData;
                }
                else {
                    this.onerror(`A plugin returned an unacceptable value for the "${this.type}" type.`);
                    break;
                }
            }
            catch (e) {
                warn(e);
                this.onerror(e);
            }
        }
        return data;
    }
}

class AsyncWaterfallHook extends SyncHook {
    constructor(type) {
        super();
        this.onerror = error;
        this.type = type;
    }
    emit(data) {
        if (!isObject(data)) {
            error(`The response data for the "${this.type}" hook must be an object.`);
        }
        const ls = Array.from(this.listeners);
        if (ls.length > 0) {
            let i = 0;
            const processError = (e) => {
                warn(e);
                this.onerror(e);
                return data;
            };
            const call = (prevData) => {
                if (checkReturnData(data, prevData)) {
                    data = prevData;
                    if (i < ls.length) {
                        try {
                            return Promise.resolve(ls[i++](data)).then(call, processError);
                        }
                        catch (e) {
                            return processError(e);
                        }
                    }
                }
                else {
                    this.onerror(`A plugin returned an incorrect value for the "${this.type}" type.`);
                }
                return data;
            };
            return Promise.resolve(call(data));
        }
        return Promise.resolve(data);
    }
}

class PluginSystem {
    constructor(lifecycle) {
        this.registerPlugins = {};
        this.lifecycle = lifecycle;
        this.lifecycleKeys = Object.keys(lifecycle);
    }
    applyPlugin(plugin, instance) {
        assert(isPlainObject(plugin), 'Plugin configuration is invalid.');
        // The plugin's name is mandatory and must be unique
        const pluginName = plugin.name;
        assert(pluginName, 'A name must be provided by the plugin.');
        if (!this.registerPlugins[pluginName]) {
            this.registerPlugins[pluginName] = plugin;
            plugin.apply?.(instance);
            Object.keys(this.lifecycle).forEach((key) => {
                const pluginLife = plugin[key];
                if (pluginLife) {
                    this.lifecycle[key].on(pluginLife);
                }
            });
        }
    }
    removePlugin(pluginName) {
        assert(pluginName, 'A name is required.');
        const plugin = this.registerPlugins[pluginName];
        assert(plugin, `The plugin "${pluginName}" is not registered.`);
        Object.keys(plugin).forEach((key) => {
            if (key !== 'name') {
                this.lifecycle[key].remove(plugin[key]);
            }
        });
    }
}

function assignRemoteInfo(remoteInfo, remoteSnapshot) {
    const remoteEntryInfo = getRemoteEntryInfoFromSnapshot(remoteSnapshot);
    if (!remoteEntryInfo.url) {
        error(`The attribute remoteEntry of ${remoteInfo.name} must not be undefined.`);
    }
    let entryUrl = sdk.getResourceUrl(remoteSnapshot, remoteEntryInfo.url);
    if (!sdk.isBrowserEnv() && !entryUrl.startsWith('http')) {
        entryUrl = `https:${entryUrl}`;
    }
    remoteInfo.type = remoteEntryInfo.type;
    remoteInfo.entryGlobalName = remoteEntryInfo.globalName;
    remoteInfo.entry = entryUrl;
    remoteInfo.version = remoteSnapshot.version;
    remoteInfo.buildVersion = remoteSnapshot.buildVersion;
}
function snapshotPlugin() {
    return {
        name: 'snapshot-plugin',
        async afterResolve(args) {
            const { remote, pkgNameOrAlias, expose, origin, remoteInfo, id } = args;
            if (!isRemoteInfoWithEntry(remote) || !isPureRemoteEntry(remote)) {
                const { remoteSnapshot, globalSnapshot } = await origin.snapshotHandler.loadRemoteSnapshotInfo({
                    moduleInfo: remote,
                    id,
                });
                assignRemoteInfo(remoteInfo, remoteSnapshot);
                // preloading assets
                const preloadOptions = {
                    remote,
                    preloadConfig: {
                        nameOrAlias: pkgNameOrAlias,
                        exposes: [expose],
                        resourceCategory: 'sync',
                        share: false,
                        depsRemote: false,
                    },
                };
                const assets = await origin.remoteHandler.hooks.lifecycle.generatePreloadAssets.emit({
                    origin,
                    preloadOptions,
                    remoteInfo,
                    remote,
                    remoteSnapshot,
                    globalSnapshot,
                });
                if (assets) {
                    preloadAssets(remoteInfo, origin, assets, false);
                }
                return {
                    ...args,
                    remoteSnapshot,
                };
            }
            return args;
        },
    };
}

// name
// name:version
function splitId(id) {
    const splitInfo = id.split(':');
    if (splitInfo.length === 1) {
        return {
            name: splitInfo[0],
            version: undefined,
        };
    }
    else if (splitInfo.length === 2) {
        return {
            name: splitInfo[0],
            version: splitInfo[1],
        };
    }
    else {
        return {
            name: splitInfo[1],
            version: splitInfo[2],
        };
    }
}
// Traverse all nodes in moduleInfo and traverse the entire snapshot
function traverseModuleInfo(globalSnapshot, remoteInfo, traverse, isRoot, memo = {}, remoteSnapshot) {
    const id = getFMId(remoteInfo);
    const { value: snapshotValue } = getInfoWithoutType(globalSnapshot, id);
    const effectiveRemoteSnapshot = remoteSnapshot || snapshotValue;
    if (effectiveRemoteSnapshot && !sdk.isManifestProvider(effectiveRemoteSnapshot)) {
        traverse(effectiveRemoteSnapshot, remoteInfo, isRoot);
        if (effectiveRemoteSnapshot.remotesInfo) {
            const remoteKeys = Object.keys(effectiveRemoteSnapshot.remotesInfo);
            for (const key of remoteKeys) {
                if (memo[key]) {
                    continue;
                }
                memo[key] = true;
                const subRemoteInfo = splitId(key);
                const remoteValue = effectiveRemoteSnapshot.remotesInfo[key];
                traverseModuleInfo(globalSnapshot, {
                    name: subRemoteInfo.name,
                    version: remoteValue.matchedVersion,
                }, traverse, false, memo, undefined);
            }
        }
    }
}
const isExisted = (type, url) => {
    return document.querySelector(`${type}[${type === 'link' ? 'href' : 'src'}="${url}"]`);
};
// eslint-disable-next-line max-lines-per-function
function generatePreloadAssets(origin, preloadOptions, remote, globalSnapshot, remoteSnapshot) {
    const cssAssets = [];
    const jsAssets = [];
    const entryAssets = [];
    const loadedSharedJsAssets = new Set();
    const loadedSharedCssAssets = new Set();
    const { options } = origin;
    const { preloadConfig: rootPreloadConfig } = preloadOptions;
    const { depsRemote } = rootPreloadConfig;
    const memo = {};
    traverseModuleInfo(globalSnapshot, remote, (moduleInfoSnapshot, remoteInfo, isRoot) => {
        let preloadConfig;
        if (isRoot) {
            preloadConfig = rootPreloadConfig;
        }
        else {
            if (Array.isArray(depsRemote)) {
                // eslint-disable-next-line array-callback-return
                const findPreloadConfig = depsRemote.find((remoteConfig) => {
                    if (remoteConfig.nameOrAlias === remoteInfo.name ||
                        remoteConfig.nameOrAlias === remoteInfo.alias) {
                        return true;
                    }
                    return false;
                });
                if (!findPreloadConfig) {
                    return;
                }
                preloadConfig = defaultPreloadArgs(findPreloadConfig);
            }
            else if (depsRemote === true) {
                preloadConfig = rootPreloadConfig;
            }
            else {
                return;
            }
        }
        const remoteEntryUrl = sdk.getResourceUrl(moduleInfoSnapshot, getRemoteEntryInfoFromSnapshot(moduleInfoSnapshot).url);
        if (remoteEntryUrl) {
            entryAssets.push({
                name: remoteInfo.name,
                moduleInfo: {
                    name: remoteInfo.name,
                    entry: remoteEntryUrl,
                    type: 'remoteEntryType' in moduleInfoSnapshot
                        ? moduleInfoSnapshot.remoteEntryType
                        : 'global',
                    entryGlobalName: 'globalName' in moduleInfoSnapshot
                        ? moduleInfoSnapshot.globalName
                        : remoteInfo.name,
                    shareScope: '',
                    version: 'version' in moduleInfoSnapshot
                        ? moduleInfoSnapshot.version
                        : undefined,
                },
                url: remoteEntryUrl,
            });
        }
        let moduleAssetsInfo = 'modules' in moduleInfoSnapshot ? moduleInfoSnapshot.modules : [];
        const normalizedPreloadExposes = normalizePreloadExposes(preloadConfig.exposes);
        if (normalizedPreloadExposes.length && 'modules' in moduleInfoSnapshot) {
            moduleAssetsInfo = moduleInfoSnapshot?.modules?.reduce((assets, moduleAssetInfo) => {
                if (normalizedPreloadExposes?.indexOf(moduleAssetInfo.moduleName) !==
                    -1) {
                    assets.push(moduleAssetInfo);
                }
                return assets;
            }, []);
        }
        function handleAssets(assets) {
            const assetsRes = assets.map((asset) => sdk.getResourceUrl(moduleInfoSnapshot, asset));
            if (preloadConfig.filter) {
                return assetsRes.filter(preloadConfig.filter);
            }
            return assetsRes;
        }
        if (moduleAssetsInfo) {
            const assetsLength = moduleAssetsInfo.length;
            for (let index = 0; index < assetsLength; index++) {
                const assetsInfo = moduleAssetsInfo[index];
                const exposeFullPath = `${remoteInfo.name}/${assetsInfo.moduleName}`;
                origin.remoteHandler.hooks.lifecycle.handlePreloadModule.emit({
                    id: assetsInfo.moduleName === '.' ? remoteInfo.name : exposeFullPath,
                    name: remoteInfo.name,
                    remoteSnapshot: moduleInfoSnapshot,
                    preloadConfig,
                    remote: remoteInfo,
                    origin,
                });
                const preloaded = getPreloaded(exposeFullPath);
                if (preloaded) {
                    continue;
                }
                if (preloadConfig.resourceCategory === 'all') {
                    cssAssets.push(...handleAssets(assetsInfo.assets.css.async));
                    cssAssets.push(...handleAssets(assetsInfo.assets.css.sync));
                    jsAssets.push(...handleAssets(assetsInfo.assets.js.async));
                    jsAssets.push(...handleAssets(assetsInfo.assets.js.sync));
                    // eslint-disable-next-line no-constant-condition
                }
                else if ((preloadConfig.resourceCategory = 'sync')) {
                    cssAssets.push(...handleAssets(assetsInfo.assets.css.sync));
                    jsAssets.push(...handleAssets(assetsInfo.assets.js.sync));
                }
                setPreloaded(exposeFullPath);
            }
        }
    }, true, memo, remoteSnapshot);
    if (remoteSnapshot.shared && remoteSnapshot.shared.length > 0) {
        const collectSharedAssets = (shareInfo, snapshotShared) => {
            const registeredShared = getRegisteredShare(origin.shareScopeMap, snapshotShared.sharedName, shareInfo, origin.sharedHandler.hooks.lifecycle.resolveShare);
            // If the global share does not exist, or the lib function does not exist, it means that the shared has not been loaded yet and can be preloaded.
            if (registeredShared && typeof registeredShared.lib === 'function') {
                snapshotShared.assets.js.sync.forEach((asset) => {
                    loadedSharedJsAssets.add(asset);
                });
                snapshotShared.assets.css.sync.forEach((asset) => {
                    loadedSharedCssAssets.add(asset);
                });
            }
        };
        remoteSnapshot.shared.forEach((shared) => {
            const shareInfos = options.shared?.[shared.sharedName];
            if (!shareInfos) {
                return;
            }
            // if no version, preload all shared
            const sharedOptions = shared.version
                ? shareInfos.find((s) => s.version === shared.version)
                : shareInfos;
            if (!sharedOptions) {
                return;
            }
            const arrayShareInfo = arrayOptions(sharedOptions);
            arrayShareInfo.forEach((s) => {
                collectSharedAssets(s, shared);
            });
        });
    }
    const needPreloadJsAssets = jsAssets.filter((asset) => !loadedSharedJsAssets.has(asset) && !isExisted('script', asset));
    const needPreloadCssAssets = cssAssets.filter((asset) => !loadedSharedCssAssets.has(asset) && !isExisted('link', asset));
    return {
        cssAssets: needPreloadCssAssets,
        jsAssetsWithoutEntry: needPreloadJsAssets,
        entryAssets: entryAssets.filter((entry) => !isExisted('script', entry.url)),
    };
}
const generatePreloadAssetsPlugin = function () {
    return {
        name: 'generate-preload-assets-plugin',
        async generatePreloadAssets(args) {
            const { origin, preloadOptions, remoteInfo, remote, globalSnapshot, remoteSnapshot, } = args;
            if (!sdk.isBrowserEnv()) {
                return {
                    cssAssets: [],
                    jsAssetsWithoutEntry: [],
                    entryAssets: [],
                };
            }
            if (isRemoteInfoWithEntry(remote) && isPureRemoteEntry(remote)) {
                return {
                    cssAssets: [],
                    jsAssetsWithoutEntry: [],
                    entryAssets: [
                        {
                            name: remote.name,
                            url: remote.entry,
                            moduleInfo: {
                                name: remoteInfo.name,
                                entry: remote.entry,
                                type: remoteInfo.type || 'global',
                                entryGlobalName: '',
                                shareScope: '',
                            },
                        },
                    ],
                };
            }
            assignRemoteInfo(remoteInfo, remoteSnapshot);
            const assets = generatePreloadAssets(origin, preloadOptions, remoteInfo, globalSnapshot, remoteSnapshot);
            return assets;
        },
    };
};

function getGlobalRemoteInfo(moduleInfo, origin) {
    const hostGlobalSnapshot = getGlobalSnapshotInfoByModuleInfo({
        name: origin.name,
        version: origin.options.version,
    });
    // get remote detail info from global
    const globalRemoteInfo = hostGlobalSnapshot &&
        'remotesInfo' in hostGlobalSnapshot &&
        hostGlobalSnapshot.remotesInfo &&
        getInfoWithoutType(hostGlobalSnapshot.remotesInfo, moduleInfo.name).value;
    if (globalRemoteInfo && globalRemoteInfo.matchedVersion) {
        return {
            hostGlobalSnapshot,
            globalSnapshot: getGlobalSnapshot(),
            remoteSnapshot: getGlobalSnapshotInfoByModuleInfo({
                name: moduleInfo.name,
                version: globalRemoteInfo.matchedVersion,
            }),
        };
    }
    return {
        hostGlobalSnapshot: undefined,
        globalSnapshot: getGlobalSnapshot(),
        remoteSnapshot: getGlobalSnapshotInfoByModuleInfo({
            name: moduleInfo.name,
            version: 'version' in moduleInfo ? moduleInfo.version : undefined,
        }),
    };
}
class SnapshotHandler {
    constructor(HostInstance) {
        this.loadingHostSnapshot = null;
        this.manifestCache = new Map();
        this.hooks = new PluginSystem({
            beforeLoadRemoteSnapshot: new AsyncHook('beforeLoadRemoteSnapshot'),
            loadSnapshot: new AsyncWaterfallHook('loadGlobalSnapshot'),
            loadRemoteSnapshot: new AsyncWaterfallHook('loadRemoteSnapshot'),
            afterLoadSnapshot: new AsyncWaterfallHook('afterLoadSnapshot'),
        });
        this.manifestLoading = Global.__FEDERATION__.__MANIFEST_LOADING__;
        this.HostInstance = HostInstance;
        this.loaderHook = HostInstance.loaderHook;
    }
    // eslint-disable-next-line max-lines-per-function
    async loadRemoteSnapshotInfo({ moduleInfo, id, expose, }) {
        const { options } = this.HostInstance;
        await this.hooks.lifecycle.beforeLoadRemoteSnapshot.emit({
            options,
            moduleInfo,
        });
        let hostSnapshot = getGlobalSnapshotInfoByModuleInfo({
            name: this.HostInstance.options.name,
            version: this.HostInstance.options.version,
        });
        if (!hostSnapshot) {
            hostSnapshot = {
                version: this.HostInstance.options.version || '',
                remoteEntry: '',
                remotesInfo: {},
            };
            addGlobalSnapshot({
                [this.HostInstance.options.name]: hostSnapshot,
            });
        }
        // In dynamic loadRemote scenarios, incomplete remotesInfo delivery may occur. In such cases, the remotesInfo in the host needs to be completed in the snapshot at runtime.
        // This ensures the snapshot's integrity and helps the chrome plugin correctly identify all producer modules, ensuring that proxyable producer modules will not be missing.
        if (hostSnapshot &&
            'remotesInfo' in hostSnapshot &&
            !getInfoWithoutType(hostSnapshot.remotesInfo, moduleInfo.name).value) {
            if ('version' in moduleInfo || 'entry' in moduleInfo) {
                hostSnapshot.remotesInfo = {
                    ...hostSnapshot?.remotesInfo,
                    [moduleInfo.name]: {
                        matchedVersion: 'version' in moduleInfo ? moduleInfo.version : moduleInfo.entry,
                    },
                };
            }
        }
        const { hostGlobalSnapshot, remoteSnapshot, globalSnapshot } = this.getGlobalRemoteInfo(moduleInfo);
        const { remoteSnapshot: globalRemoteSnapshot, globalSnapshot: globalSnapshotRes, } = await this.hooks.lifecycle.loadSnapshot.emit({
            options,
            moduleInfo,
            hostGlobalSnapshot,
            remoteSnapshot,
            globalSnapshot,
        });
        let mSnapshot;
        let gSnapshot;
        // global snapshot includes manifest or module info includes manifest
        if (globalRemoteSnapshot) {
            if (sdk.isManifestProvider(globalRemoteSnapshot)) {
                const remoteEntry = sdk.isBrowserEnv()
                    ? globalRemoteSnapshot.remoteEntry
                    : globalRemoteSnapshot.ssrRemoteEntry ||
                        globalRemoteSnapshot.remoteEntry ||
                        '';
                const moduleSnapshot = await this.getManifestJson(remoteEntry, moduleInfo, {});
                // eslint-disable-next-line @typescript-eslint/no-shadow
                const globalSnapshotRes = setGlobalSnapshotInfoByModuleInfo({
                    ...moduleInfo,
                    // The global remote may be overridden
                    // Therefore, set the snapshot key to the global address of the actual request
                    entry: remoteEntry,
                }, moduleSnapshot);
                mSnapshot = moduleSnapshot;
                gSnapshot = globalSnapshotRes;
            }
            else {
                const { remoteSnapshot: remoteSnapshotRes } = await this.hooks.lifecycle.loadRemoteSnapshot.emit({
                    options: this.HostInstance.options,
                    moduleInfo,
                    remoteSnapshot: globalRemoteSnapshot,
                    from: 'global',
                });
                mSnapshot = remoteSnapshotRes;
                gSnapshot = globalSnapshotRes;
            }
        }
        else {
            if (isRemoteInfoWithEntry(moduleInfo)) {
                // get from manifest.json and merge remote info from remote server
                const moduleSnapshot = await this.getManifestJson(moduleInfo.entry, moduleInfo, {});
                // eslint-disable-next-line @typescript-eslint/no-shadow
                const globalSnapshotRes = setGlobalSnapshotInfoByModuleInfo(moduleInfo, moduleSnapshot);
                const { remoteSnapshot: remoteSnapshotRes } = await this.hooks.lifecycle.loadRemoteSnapshot.emit({
                    options: this.HostInstance.options,
                    moduleInfo,
                    remoteSnapshot: moduleSnapshot,
                    from: 'global',
                });
                mSnapshot = remoteSnapshotRes;
                gSnapshot = globalSnapshotRes;
            }
            else {
                error(errorCodes.getShortErrorMsg(errorCodes.RUNTIME_007, errorCodes.runtimeDescMap, {
                    hostName: moduleInfo.name,
                    hostVersion: moduleInfo.version,
                    globalSnapshot: JSON.stringify(globalSnapshotRes),
                }));
            }
        }
        await this.hooks.lifecycle.afterLoadSnapshot.emit({
            id,
            host: this.HostInstance,
            options,
            moduleInfo,
            remoteSnapshot: mSnapshot,
        });
        return {
            remoteSnapshot: mSnapshot,
            globalSnapshot: gSnapshot,
        };
    }
    getGlobalRemoteInfo(moduleInfo) {
        return getGlobalRemoteInfo(moduleInfo, this.HostInstance);
    }
    async getManifestJson(manifestUrl, moduleInfo, extraOptions) {
        const getManifest = async () => {
            let manifestJson = this.manifestCache.get(manifestUrl);
            if (manifestJson) {
                return manifestJson;
            }
            try {
                let res = await this.loaderHook.lifecycle.fetch.emit(manifestUrl, {});
                if (!res || !(res instanceof Response)) {
                    res = await fetch(manifestUrl, {});
                }
                manifestJson = (await res.json());
            }
            catch (err) {
                manifestJson =
                    (await this.HostInstance.remoteHandler.hooks.lifecycle.errorLoadRemote.emit({
                        id: manifestUrl,
                        error: err,
                        from: 'runtime',
                        lifecycle: 'afterResolve',
                        origin: this.HostInstance,
                    }));
                if (!manifestJson) {
                    delete this.manifestLoading[manifestUrl];
                    error(errorCodes.getShortErrorMsg(errorCodes.RUNTIME_003, errorCodes.runtimeDescMap, {
                        manifestUrl,
                        moduleName: moduleInfo.name,
                        hostName: this.HostInstance.options.name,
                    }, `${err}`));
                }
            }
            assert(manifestJson.metaData && manifestJson.exposes && manifestJson.shared, `${manifestUrl} is not a federation manifest`);
            this.manifestCache.set(manifestUrl, manifestJson);
            return manifestJson;
        };
        const asyncLoadProcess = async () => {
            const manifestJson = await getManifest();
            const remoteSnapshot = sdk.generateSnapshotFromManifest(manifestJson, {
                version: manifestUrl,
            });
            const { remoteSnapshot: remoteSnapshotRes } = await this.hooks.lifecycle.loadRemoteSnapshot.emit({
                options: this.HostInstance.options,
                moduleInfo,
                manifestJson,
                remoteSnapshot,
                manifestUrl,
                from: 'manifest',
            });
            return remoteSnapshotRes;
        };
        if (!this.manifestLoading[manifestUrl]) {
            this.manifestLoading[manifestUrl] = asyncLoadProcess().then((res) => res);
        }
        return this.manifestLoading[manifestUrl];
    }
}

class SharedHandler {
    constructor(host) {
        this.hooks = new PluginSystem({
            afterResolve: new AsyncWaterfallHook('afterResolve'),
            beforeLoadShare: new AsyncWaterfallHook('beforeLoadShare'),
            // not used yet
            loadShare: new AsyncHook(),
            resolveShare: new SyncWaterfallHook('resolveShare'),
            // maybe will change, temporarily for internal use only
            initContainerShareScopeMap: new SyncWaterfallHook('initContainerShareScopeMap'),
        });
        this.host = host;
        this.shareScopeMap = {};
        this.initTokens = {};
        this._setGlobalShareScopeMap(host.options);
    }
    // register shared in shareScopeMap
    registerShared(globalOptions, userOptions) {
        const { shareInfos, shared } = formatShareConfigs(globalOptions, userOptions);
        const sharedKeys = Object.keys(shareInfos);
        sharedKeys.forEach((sharedKey) => {
            const sharedVals = shareInfos[sharedKey];
            sharedVals.forEach((sharedVal) => {
                const registeredShared = getRegisteredShare(this.shareScopeMap, sharedKey, sharedVal, this.hooks.lifecycle.resolveShare);
                if (!registeredShared && sharedVal && sharedVal.lib) {
                    this.setShared({
                        pkgName: sharedKey,
                        lib: sharedVal.lib,
                        get: sharedVal.get,
                        loaded: true,
                        shared: sharedVal,
                        from: userOptions.name,
                    });
                }
            });
        });
        return {
            shareInfos,
            shared,
        };
    }
    async loadShare(pkgName, extraOptions) {
        const { host } = this;
        // This function performs the following steps:
        // 1. Checks if the currently loaded share already exists, if not, it throws an error
        // 2. Searches globally for a matching share, if found, it uses it directly
        // 3. If not found, it retrieves it from the current share and stores the obtained share globally.
        const shareOptions = getTargetSharedOptions({
            pkgName,
            extraOptions,
            shareInfos: host.options.shared,
        });
        if (shareOptions?.scope) {
            await Promise.all(shareOptions.scope.map(async (shareScope) => {
                await Promise.all(this.initializeSharing(shareScope, {
                    strategy: shareOptions.strategy,
                }));
                return;
            }));
        }
        const loadShareRes = await this.hooks.lifecycle.beforeLoadShare.emit({
            pkgName,
            shareInfo: shareOptions,
            shared: host.options.shared,
            origin: host,
        });
        const { shareInfo: shareOptionsRes } = loadShareRes;
        // Assert that shareInfoRes exists, if not, throw an error
        assert(shareOptionsRes, `Cannot find ${pkgName} Share in the ${host.options.name}. Please ensure that the ${pkgName} Share parameters have been injected`);
        // Retrieve from cache
        const registeredShared = getRegisteredShare(this.shareScopeMap, pkgName, shareOptionsRes, this.hooks.lifecycle.resolveShare);
        const addUseIn = (shared) => {
            if (!shared.useIn) {
                shared.useIn = [];
            }
            addUniqueItem(shared.useIn, host.options.name);
        };
        if (registeredShared && registeredShared.lib) {
            addUseIn(registeredShared);
            return registeredShared.lib;
        }
        else if (registeredShared &&
            registeredShared.loading &&
            !registeredShared.loaded) {
            const factory = await registeredShared.loading;
            registeredShared.loaded = true;
            if (!registeredShared.lib) {
                registeredShared.lib = factory;
            }
            addUseIn(registeredShared);
            return factory;
        }
        else if (registeredShared) {
            const asyncLoadProcess = async () => {
                const factory = await registeredShared.get();
                addUseIn(registeredShared);
                registeredShared.loaded = true;
                registeredShared.lib = factory;
                return factory;
            };
            const loading = asyncLoadProcess();
            this.setShared({
                pkgName,
                loaded: false,
                shared: registeredShared,
                from: host.options.name,
                lib: null,
                loading,
            });
            return loading;
        }
        else {
            if (extraOptions?.customShareInfo) {
                return false;
            }
            const asyncLoadProcess = async () => {
                const factory = await shareOptionsRes.get();
                shareOptionsRes.lib = factory;
                shareOptionsRes.loaded = true;
                addUseIn(shareOptionsRes);
                const gShared = getRegisteredShare(this.shareScopeMap, pkgName, shareOptionsRes, this.hooks.lifecycle.resolveShare);
                if (gShared) {
                    gShared.lib = factory;
                    gShared.loaded = true;
                    gShared.from = shareOptionsRes.from;
                }
                return factory;
            };
            const loading = asyncLoadProcess();
            this.setShared({
                pkgName,
                loaded: false,
                shared: shareOptionsRes,
                from: host.options.name,
                lib: null,
                loading,
            });
            return loading;
        }
    }
    /**
     * This function initializes the sharing sequence (executed only once per share scope).
     * It accepts one argument, the name of the share scope.
     * If the share scope does not exist, it creates one.
     */
    // eslint-disable-next-line @typescript-eslint/member-ordering
    initializeSharing(shareScopeName = DEFAULT_SCOPE, extraOptions) {
        const { host } = this;
        const from = extraOptions?.from;
        const strategy = extraOptions?.strategy;
        let initScope = extraOptions?.initScope;
        const promises = [];
        if (from !== 'build') {
            const { initTokens } = this;
            if (!initScope)
                initScope = [];
            let initToken = initTokens[shareScopeName];
            if (!initToken)
                initToken = initTokens[shareScopeName] = { from: this.host.name };
            if (initScope.indexOf(initToken) >= 0)
                return promises;
            initScope.push(initToken);
        }
        const shareScope = this.shareScopeMap;
        const hostName = host.options.name;
        // Creates a new share scope if necessary
        if (!shareScope[shareScopeName]) {
            shareScope[shareScopeName] = {};
        }
        // Executes all initialization snippets from all accessible modules
        const scope = shareScope[shareScopeName];
        const register = (name, shared) => {
            const { version, eager } = shared;
            scope[name] = scope[name] || {};
            const versions = scope[name];
            const activeVersion = versions[version];
            const activeVersionEager = Boolean(activeVersion &&
                (activeVersion.eager || activeVersion.shareConfig?.eager));
            if (!activeVersion ||
                (activeVersion.strategy !== 'loaded-first' &&
                    !activeVersion.loaded &&
                    (Boolean(!eager) !== !activeVersionEager
                        ? eager
                        : hostName > activeVersion.from))) {
                versions[version] = shared;
            }
        };
        const initFn = (mod) => mod && mod.init && mod.init(shareScope[shareScopeName], initScope);
        const initRemoteModule = async (key) => {
            const { module } = await host.remoteHandler.getRemoteModuleAndOptions({
                id: key,
            });
            if (module.getEntry) {
                let remoteEntryExports;
                try {
                    remoteEntryExports = await module.getEntry();
                }
                catch (error) {
                    remoteEntryExports =
                        (await host.remoteHandler.hooks.lifecycle.errorLoadRemote.emit({
                            id: key,
                            error,
                            from: 'runtime',
                            lifecycle: 'beforeLoadShare',
                            origin: host,
                        }));
                }
                if (!module.inited) {
                    await initFn(remoteEntryExports);
                    module.inited = true;
                }
            }
        };
        Object.keys(host.options.shared).forEach((shareName) => {
            const sharedArr = host.options.shared[shareName];
            sharedArr.forEach((shared) => {
                if (shared.scope.includes(shareScopeName)) {
                    register(shareName, shared);
                }
            });
        });
        // TODO: strategy==='version-first' need to be removed in the future
        if (host.options.shareStrategy === 'version-first' ||
            strategy === 'version-first') {
            host.options.remotes.forEach((remote) => {
                if (remote.shareScope === shareScopeName) {
                    promises.push(initRemoteModule(remote.name));
                }
            });
        }
        return promises;
    }
    // The lib function will only be available if the shared set by eager or runtime init is set or the shared is successfully loaded.
    // 1. If the loaded shared already exists globally, then it will be reused
    // 2. If lib exists in local shared, it will be used directly
    // 3. If the local get returns something other than Promise, then it will be used directly
    loadShareSync(pkgName, extraOptions) {
        const { host } = this;
        const shareOptions = getTargetSharedOptions({
            pkgName,
            extraOptions,
            shareInfos: host.options.shared,
        });
        if (shareOptions?.scope) {
            shareOptions.scope.forEach((shareScope) => {
                this.initializeSharing(shareScope, { strategy: shareOptions.strategy });
            });
        }
        const registeredShared = getRegisteredShare(this.shareScopeMap, pkgName, shareOptions, this.hooks.lifecycle.resolveShare);
        const addUseIn = (shared) => {
            if (!shared.useIn) {
                shared.useIn = [];
            }
            addUniqueItem(shared.useIn, host.options.name);
        };
        if (registeredShared) {
            if (typeof registeredShared.lib === 'function') {
                addUseIn(registeredShared);
                if (!registeredShared.loaded) {
                    registeredShared.loaded = true;
                    if (registeredShared.from === host.options.name) {
                        shareOptions.loaded = true;
                    }
                }
                return registeredShared.lib;
            }
            if (typeof registeredShared.get === 'function') {
                const module = registeredShared.get();
                if (!(module instanceof Promise)) {
                    addUseIn(registeredShared);
                    this.setShared({
                        pkgName,
                        loaded: true,
                        from: host.options.name,
                        lib: module,
                        shared: registeredShared,
                    });
                    return module;
                }
            }
        }
        if (shareOptions.lib) {
            if (!shareOptions.loaded) {
                shareOptions.loaded = true;
            }
            return shareOptions.lib;
        }
        if (shareOptions.get) {
            const module = shareOptions.get();
            if (module instanceof Promise) {
                const errorCode = extraOptions?.from === 'build' ? errorCodes.RUNTIME_005 : errorCodes.RUNTIME_006;
                throw new Error(errorCodes.getShortErrorMsg(errorCode, errorCodes.runtimeDescMap, {
                    hostName: host.options.name,
                    sharedPkgName: pkgName,
                }));
            }
            shareOptions.lib = module;
            this.setShared({
                pkgName,
                loaded: true,
                from: host.options.name,
                lib: shareOptions.lib,
                shared: shareOptions,
            });
            return shareOptions.lib;
        }
        throw new Error(errorCodes.getShortErrorMsg(errorCodes.RUNTIME_006, errorCodes.runtimeDescMap, {
            hostName: host.options.name,
            sharedPkgName: pkgName,
        }));
    }
    initShareScopeMap(scopeName, shareScope, extraOptions = {}) {
        const { host } = this;
        this.shareScopeMap[scopeName] = shareScope;
        this.hooks.lifecycle.initContainerShareScopeMap.emit({
            shareScope,
            options: host.options,
            origin: host,
            scopeName,
            hostShareScopeMap: extraOptions.hostShareScopeMap,
        });
    }
    setShared({ pkgName, shared, from, lib, loading, loaded, get, }) {
        const { version, scope = 'default', ...shareInfo } = shared;
        const scopes = Array.isArray(scope) ? scope : [scope];
        scopes.forEach((sc) => {
            if (!this.shareScopeMap[sc]) {
                this.shareScopeMap[sc] = {};
            }
            if (!this.shareScopeMap[sc][pkgName]) {
                this.shareScopeMap[sc][pkgName] = {};
            }
            if (!this.shareScopeMap[sc][pkgName][version]) {
                this.shareScopeMap[sc][pkgName][version] = {
                    version,
                    scope: ['default'],
                    ...shareInfo,
                    lib,
                    loaded,
                    loading,
                };
                if (get) {
                    this.shareScopeMap[sc][pkgName][version].get = get;
                }
                return;
            }
            const registeredShared = this.shareScopeMap[sc][pkgName][version];
            if (loading && !registeredShared.loading) {
                registeredShared.loading = loading;
            }
            if (loaded && !registeredShared.loaded) {
                registeredShared.loaded = loaded;
            }
            if (from && registeredShared.from !== from) {
                registeredShared.from = from;
            }
        });
    }
    _setGlobalShareScopeMap(hostOptions) {
        const globalShareScopeMap = getGlobalShareScope();
        const identifier = hostOptions.id || hostOptions.name;
        if (identifier && !globalShareScopeMap[identifier]) {
            globalShareScopeMap[identifier] = this.shareScopeMap;
        }
    }
}

class RemoteHandler {
    constructor(host) {
        this.hooks = new PluginSystem({
            beforeRegisterRemote: new SyncWaterfallHook('beforeRegisterRemote'),
            registerRemote: new SyncWaterfallHook('registerRemote'),
            beforeRequest: new AsyncWaterfallHook('beforeRequest'),
            onLoad: new AsyncHook('onLoad'),
            handlePreloadModule: new SyncHook('handlePreloadModule'),
            errorLoadRemote: new AsyncHook('errorLoadRemote'),
            beforePreloadRemote: new AsyncHook('beforePreloadRemote'),
            generatePreloadAssets: new AsyncHook('generatePreloadAssets'),
            // not used yet
            afterPreloadRemote: new AsyncHook(),
            loadEntry: new AsyncHook(),
        });
        this.host = host;
        this.idToRemoteMap = {};
    }
    formatAndRegisterRemote(globalOptions, userOptions) {
        const userRemotes = userOptions.remotes || [];
        return userRemotes.reduce((res, remote) => {
            this.registerRemote(remote, res, { force: false });
            return res;
        }, globalOptions.remotes);
    }
    setIdToRemoteMap(id, remoteMatchInfo) {
        const { remote, expose } = remoteMatchInfo;
        const { name, alias } = remote;
        this.idToRemoteMap[id] = { name: remote.name, expose };
        if (alias && id.startsWith(name)) {
            const idWithAlias = id.replace(name, alias);
            this.idToRemoteMap[idWithAlias] = { name: remote.name, expose };
            return;
        }
        if (alias && id.startsWith(alias)) {
            const idWithName = id.replace(alias, name);
            this.idToRemoteMap[idWithName] = { name: remote.name, expose };
        }
    }
    // eslint-disable-next-line max-lines-per-function
    // eslint-disable-next-line @typescript-eslint/member-ordering
    async loadRemote(id, options) {
        const { host } = this;
        try {
            const { loadFactory = true } = options || {
                loadFactory: true,
            };
            // 1. Validate the parameters of the retrieved module. There are two module request methods: pkgName + expose and alias + expose.
            // 2. Request the snapshot information of the current host and globally store the obtained snapshot information. The retrieved module information is partially offline and partially online. The online module information will retrieve the modules used online.
            // 3. Retrieve the detailed information of the current module from global (remoteEntry address, expose resource address)
            // 4. After retrieving remoteEntry, call the init of the module, and then retrieve the exported content of the module through get
            // id: pkgName(@federation/app1) + expose(button) = @federation/app1/button
            // id: alias(app1) + expose(button) = app1/button
            // id: alias(app1/utils) + expose(loadash/sort) = app1/utils/loadash/sort
            const { module, moduleOptions, remoteMatchInfo } = await this.getRemoteModuleAndOptions({
                id,
            });
            const { pkgNameOrAlias, remote, expose, id: idRes, remoteSnapshot, } = remoteMatchInfo;
            const moduleOrFactory = (await module.get(idRes, expose, options, remoteSnapshot));
            const moduleWrapper = await this.hooks.lifecycle.onLoad.emit({
                id: idRes,
                pkgNameOrAlias,
                expose,
                exposeModule: loadFactory ? moduleOrFactory : undefined,
                exposeModuleFactory: loadFactory ? undefined : moduleOrFactory,
                remote,
                options: moduleOptions,
                moduleInstance: module,
                origin: host,
            });
            this.setIdToRemoteMap(id, remoteMatchInfo);
            if (typeof moduleWrapper === 'function') {
                return moduleWrapper;
            }
            return moduleOrFactory;
        }
        catch (error) {
            const { from = 'runtime' } = options || { from: 'runtime' };
            const failOver = await this.hooks.lifecycle.errorLoadRemote.emit({
                id,
                error,
                from,
                lifecycle: 'onLoad',
                origin: host,
            });
            if (!failOver) {
                throw error;
            }
            return failOver;
        }
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    async preloadRemote(preloadOptions) {
        const { host } = this;
        await this.hooks.lifecycle.beforePreloadRemote.emit({
            preloadOps: preloadOptions,
            options: host.options,
            origin: host,
        });
        const preloadOps = formatPreloadArgs(host.options.remotes, preloadOptions);
        await Promise.all(preloadOps.map(async (ops) => {
            const { remote } = ops;
            const remoteInfo = getRemoteInfo(remote);
            const { globalSnapshot, remoteSnapshot } = await host.snapshotHandler.loadRemoteSnapshotInfo({
                moduleInfo: remote,
            });
            const assets = await this.hooks.lifecycle.generatePreloadAssets.emit({
                origin: host,
                preloadOptions: ops,
                remote,
                remoteInfo,
                globalSnapshot,
                remoteSnapshot,
            });
            if (!assets) {
                return;
            }
            preloadAssets(remoteInfo, host, assets);
        }));
    }
    registerRemotes(remotes, options) {
        const { host } = this;
        remotes.forEach((remote) => {
            this.registerRemote(remote, host.options.remotes, {
                force: options?.force,
            });
        });
    }
    async getRemoteModuleAndOptions(options) {
        const { host } = this;
        const { id } = options;
        let loadRemoteArgs;
        try {
            loadRemoteArgs = await this.hooks.lifecycle.beforeRequest.emit({
                id,
                options: host.options,
                origin: host,
            });
        }
        catch (error) {
            loadRemoteArgs = (await this.hooks.lifecycle.errorLoadRemote.emit({
                id,
                options: host.options,
                origin: host,
                from: 'runtime',
                error,
                lifecycle: 'beforeRequest',
            }));
            if (!loadRemoteArgs) {
                throw error;
            }
        }
        const { id: idRes } = loadRemoteArgs;
        const remoteSplitInfo = matchRemoteWithNameAndExpose(host.options.remotes, idRes);
        assert(remoteSplitInfo, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_004, errorCodes.runtimeDescMap, {
            hostName: host.options.name,
            requestId: idRes,
        }));
        const { remote: rawRemote } = remoteSplitInfo;
        const remoteInfo = getRemoteInfo(rawRemote);
        const matchInfo = await host.sharedHandler.hooks.lifecycle.afterResolve.emit({
            id: idRes,
            ...remoteSplitInfo,
            options: host.options,
            origin: host,
            remoteInfo,
        });
        const { remote, expose } = matchInfo;
        assert(remote && expose, `The 'beforeRequest' hook was executed, but it failed to return the correct 'remote' and 'expose' values while loading ${idRes}.`);
        let module = host.moduleCache.get(remote.name);
        const moduleOptions = {
            host: host,
            remoteInfo,
        };
        if (!module) {
            module = new Module(moduleOptions);
            host.moduleCache.set(remote.name, module);
        }
        return {
            module,
            moduleOptions,
            remoteMatchInfo: matchInfo,
        };
    }
    registerRemote(remote, targetRemotes, options) {
        const { host } = this;
        const normalizeRemote = () => {
            if (remote.alias) {
                // Validate if alias equals the prefix of remote.name and remote.alias, if so, throw an error
                // As multi-level path references cannot guarantee unique names, alias being a prefix of remote.name is not supported
                const findEqual = targetRemotes.find((item) => remote.alias &&
                    (item.name.startsWith(remote.alias) ||
                        item.alias?.startsWith(remote.alias)));
                assert(!findEqual, `The alias ${remote.alias} of remote ${remote.name} is not allowed to be the prefix of ${findEqual && findEqual.name} name or alias`);
            }
            // Set the remote entry to a complete path
            if ('entry' in remote) {
                if (sdk.isBrowserEnv() && !remote.entry.startsWith('http')) {
                    remote.entry = new URL(remote.entry, window.location.origin).href;
                }
            }
            if (!remote.shareScope) {
                remote.shareScope = DEFAULT_SCOPE;
            }
            if (!remote.type) {
                remote.type = DEFAULT_REMOTE_TYPE;
            }
        };
        this.hooks.lifecycle.beforeRegisterRemote.emit({ remote, origin: host });
        const registeredRemote = targetRemotes.find((item) => item.name === remote.name);
        if (!registeredRemote) {
            normalizeRemote();
            targetRemotes.push(remote);
            this.hooks.lifecycle.registerRemote.emit({ remote, origin: host });
        }
        else {
            const messages = [
                `The remote "${remote.name}" is already registered.`,
                'Please note that overriding it may cause unexpected errors.',
            ];
            if (options?.force) {
                // remove registered remote
                this.removeRemote(registeredRemote);
                normalizeRemote();
                targetRemotes.push(remote);
                this.hooks.lifecycle.registerRemote.emit({ remote, origin: host });
                sdk.warn(messages.join(' '));
            }
        }
    }
    removeRemote(remote) {
        try {
            const { host } = this;
            const { name } = remote;
            const remoteIndex = host.options.remotes.findIndex((item) => item.name === name);
            if (remoteIndex !== -1) {
                host.options.remotes.splice(remoteIndex, 1);
            }
            const loadedModule = host.moduleCache.get(remote.name);
            if (loadedModule) {
                const remoteInfo = loadedModule.remoteInfo;
                const key = remoteInfo.entryGlobalName;
                if (CurrentGlobal[key]) {
                    if (Object.getOwnPropertyDescriptor(CurrentGlobal, key)?.configurable) {
                        delete CurrentGlobal[key];
                    }
                    else {
                        // @ts-ignore
                        CurrentGlobal[key] = undefined;
                    }
                }
                const remoteEntryUniqueKey = getRemoteEntryUniqueKey(loadedModule.remoteInfo);
                if (globalLoading[remoteEntryUniqueKey]) {
                    delete globalLoading[remoteEntryUniqueKey];
                }
                host.snapshotHandler.manifestCache.delete(remoteInfo.entry);
                // delete unloaded shared and instance
                let remoteInsId = remoteInfo.buildVersion
                    ? sdk.composeKeyWithSeparator(remoteInfo.name, remoteInfo.buildVersion)
                    : remoteInfo.name;
                const remoteInsIndex = CurrentGlobal.__FEDERATION__.__INSTANCES__.findIndex((ins) => {
                    if (remoteInfo.buildVersion) {
                        return ins.options.id === remoteInsId;
                    }
                    else {
                        return ins.name === remoteInsId;
                    }
                });
                if (remoteInsIndex !== -1) {
                    const remoteIns = CurrentGlobal.__FEDERATION__.__INSTANCES__[remoteInsIndex];
                    remoteInsId = remoteIns.options.id || remoteInsId;
                    const globalShareScopeMap = getGlobalShareScope();
                    let isAllSharedNotUsed = true;
                    const needDeleteKeys = [];
                    Object.keys(globalShareScopeMap).forEach((instId) => {
                        const shareScopeMap = globalShareScopeMap[instId];
                        shareScopeMap &&
                            Object.keys(shareScopeMap).forEach((shareScope) => {
                                const shareScopeVal = shareScopeMap[shareScope];
                                shareScopeVal &&
                                    Object.keys(shareScopeVal).forEach((shareName) => {
                                        const sharedPkgs = shareScopeVal[shareName];
                                        sharedPkgs &&
                                            Object.keys(sharedPkgs).forEach((shareVersion) => {
                                                const shared = sharedPkgs[shareVersion];
                                                if (shared &&
                                                    typeof shared === 'object' &&
                                                    shared.from === remoteInfo.name) {
                                                    if (shared.loaded || shared.loading) {
                                                        shared.useIn = shared.useIn.filter((usedHostName) => usedHostName !== remoteInfo.name);
                                                        if (shared.useIn.length) {
                                                            isAllSharedNotUsed = false;
                                                        }
                                                        else {
                                                            needDeleteKeys.push([
                                                                instId,
                                                                shareScope,
                                                                shareName,
                                                                shareVersion,
                                                            ]);
                                                        }
                                                    }
                                                    else {
                                                        needDeleteKeys.push([
                                                            instId,
                                                            shareScope,
                                                            shareName,
                                                            shareVersion,
                                                        ]);
                                                    }
                                                }
                                            });
                                    });
                            });
                    });
                    if (isAllSharedNotUsed) {
                        remoteIns.shareScopeMap = {};
                        delete globalShareScopeMap[remoteInsId];
                    }
                    needDeleteKeys.forEach(([insId, shareScope, shareName, shareVersion]) => {
                        delete globalShareScopeMap[insId]?.[shareScope]?.[shareName]?.[shareVersion];
                    });
                    CurrentGlobal.__FEDERATION__.__INSTANCES__.splice(remoteInsIndex, 1);
                }
                const { hostGlobalSnapshot } = getGlobalRemoteInfo(remote, host);
                if (hostGlobalSnapshot) {
                    const remoteKey = hostGlobalSnapshot &&
                        'remotesInfo' in hostGlobalSnapshot &&
                        hostGlobalSnapshot.remotesInfo &&
                        getInfoWithoutType(hostGlobalSnapshot.remotesInfo, remote.name).key;
                    if (remoteKey) {
                        delete hostGlobalSnapshot.remotesInfo[remoteKey];
                        if (
                        //eslint-disable-next-line no-extra-boolean-cast
                        Boolean(Global.__FEDERATION__.__MANIFEST_LOADING__[remoteKey])) {
                            delete Global.__FEDERATION__.__MANIFEST_LOADING__[remoteKey];
                        }
                    }
                }
                host.moduleCache.delete(remote.name);
            }
        }
        catch (err) {
            logger.log('removeRemote fail: ', err);
        }
    }
}

const USE_SNAPSHOT = typeof FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN === 'boolean'
    ? !FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN
    : true; // Default to true (use snapshot) when not explicitly defined
class ModuleFederation {
    constructor(userOptions) {
        this.hooks = new PluginSystem({
            beforeInit: new SyncWaterfallHook('beforeInit'),
            init: new SyncHook(),
            // maybe will change, temporarily for internal use only
            beforeInitContainer: new AsyncWaterfallHook('beforeInitContainer'),
            // maybe will change, temporarily for internal use only
            initContainer: new AsyncWaterfallHook('initContainer'),
        });
        this.version = "0.21.2";
        this.moduleCache = new Map();
        this.loaderHook = new PluginSystem({
            // FIXME: may not be suitable , not open to the public yet
            getModuleInfo: new SyncHook(),
            createScript: new SyncHook(),
            createLink: new SyncHook(),
            fetch: new AsyncHook(),
            loadEntryError: new AsyncHook(),
            getModuleFactory: new AsyncHook(),
        });
        this.bridgeHook = new PluginSystem({
            beforeBridgeRender: new SyncHook(),
            afterBridgeRender: new SyncHook(),
            beforeBridgeDestroy: new SyncHook(),
            afterBridgeDestroy: new SyncHook(),
        });
        const plugins = USE_SNAPSHOT
            ? [snapshotPlugin(), generatePreloadAssetsPlugin()]
            : [];
        // TODO: Validate the details of the options
        // Initialize options with default values
        const defaultOptions = {
            id: getBuilderId(),
            name: userOptions.name,
            plugins,
            remotes: [],
            shared: {},
            inBrowser: sdk.isBrowserEnv(),
        };
        this.name = userOptions.name;
        this.options = defaultOptions;
        this.snapshotHandler = new SnapshotHandler(this);
        this.sharedHandler = new SharedHandler(this);
        this.remoteHandler = new RemoteHandler(this);
        this.shareScopeMap = this.sharedHandler.shareScopeMap;
        this.registerPlugins([
            ...defaultOptions.plugins,
            ...(userOptions.plugins || []),
        ]);
        this.options = this.formatOptions(defaultOptions, userOptions);
    }
    initOptions(userOptions) {
        this.registerPlugins(userOptions.plugins);
        const options = this.formatOptions(this.options, userOptions);
        this.options = options;
        return options;
    }
    async loadShare(pkgName, extraOptions) {
        return this.sharedHandler.loadShare(pkgName, extraOptions);
    }
    // The lib function will only be available if the shared set by eager or runtime init is set or the shared is successfully loaded.
    // 1. If the loaded shared already exists globally, then it will be reused
    // 2. If lib exists in local shared, it will be used directly
    // 3. If the local get returns something other than Promise, then it will be used directly
    loadShareSync(pkgName, extraOptions) {
        return this.sharedHandler.loadShareSync(pkgName, extraOptions);
    }
    initializeSharing(shareScopeName = DEFAULT_SCOPE, extraOptions) {
        return this.sharedHandler.initializeSharing(shareScopeName, extraOptions);
    }
    initRawContainer(name, url, container) {
        const remoteInfo = getRemoteInfo({ name, entry: url });
        const module = new Module({ host: this, remoteInfo });
        module.remoteEntryExports = container;
        this.moduleCache.set(name, module);
        return module;
    }
    // eslint-disable-next-line max-lines-per-function
    // eslint-disable-next-line @typescript-eslint/member-ordering
    async loadRemote(id, options) {
        return this.remoteHandler.loadRemote(id, options);
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    async preloadRemote(preloadOptions) {
        return this.remoteHandler.preloadRemote(preloadOptions);
    }
    initShareScopeMap(scopeName, shareScope, extraOptions = {}) {
        this.sharedHandler.initShareScopeMap(scopeName, shareScope, extraOptions);
    }
    formatOptions(globalOptions, userOptions) {
        const { shared } = formatShareConfigs(globalOptions, userOptions);
        const { userOptions: userOptionsRes, options: globalOptionsRes } = this.hooks.lifecycle.beforeInit.emit({
            origin: this,
            userOptions,
            options: globalOptions,
            shareInfo: shared,
        });
        const remotes = this.remoteHandler.formatAndRegisterRemote(globalOptionsRes, userOptionsRes);
        const { shared: handledShared } = this.sharedHandler.registerShared(globalOptionsRes, userOptionsRes);
        const plugins = [...globalOptionsRes.plugins];
        if (userOptionsRes.plugins) {
            userOptionsRes.plugins.forEach((plugin) => {
                if (!plugins.includes(plugin)) {
                    plugins.push(plugin);
                }
            });
        }
        const optionsRes = {
            ...globalOptions,
            ...userOptions,
            plugins,
            remotes,
            shared: handledShared,
        };
        this.hooks.lifecycle.init.emit({
            origin: this,
            options: optionsRes,
        });
        return optionsRes;
    }
    registerPlugins(plugins) {
        const pluginRes = registerPlugins(plugins, this);
        // Merge plugin
        this.options.plugins = this.options.plugins.reduce((res, plugin) => {
            if (!plugin)
                return res;
            if (res && !res.find((item) => item.name === plugin.name)) {
                res.push(plugin);
            }
            return res;
        }, pluginRes || []);
    }
    registerRemotes(remotes, options) {
        return this.remoteHandler.registerRemotes(remotes, options);
    }
    registerShared(shared) {
        this.sharedHandler.registerShared(this.options, {
            ...this.options,
            shared,
        });
    }
}

var index = /*#__PURE__*/Object.freeze({
    __proto__: null
});

exports.loadScript = sdk.loadScript;
exports.loadScriptNode = sdk.loadScriptNode;
exports.CurrentGlobal = CurrentGlobal;
exports.Global = Global;
exports.Module = Module;
exports.ModuleFederation = ModuleFederation;
exports.addGlobalSnapshot = addGlobalSnapshot;
exports.assert = assert;
exports.getGlobalFederationConstructor = getGlobalFederationConstructor;
exports.getGlobalSnapshot = getGlobalSnapshot;
exports.getInfoWithoutType = getInfoWithoutType;
exports.getRegisteredShare = getRegisteredShare;
exports.getRemoteEntry = getRemoteEntry;
exports.getRemoteInfo = getRemoteInfo;
exports.helpers = helpers;
exports.isStaticResourcesEqual = isStaticResourcesEqual;
exports.matchRemoteWithNameAndExpose = matchRemoteWithNameAndExpose;
exports.registerGlobalPlugins = registerGlobalPlugins;
exports.resetFederationGlobalInfo = resetFederationGlobalInfo;
exports.safeWrapper = safeWrapper;
exports.satisfy = satisfy;
exports.setGlobalFederationConstructor = setGlobalFederationConstructor;
exports.setGlobalFederationInstance = setGlobalFederationInstance;
exports.types = index;
//# sourceMappingURL=index.cjs.cjs.map


}),
"../../node_modules/.bun/@module-federation+runtime@0.21.2/node_modules/@module-federation/runtime/dist/index.cjs.cjs": 
/*!****************************************************************************************************************************!*\
  !*** ../../node_modules/.bun/@module-federation+runtime@0.21.2/node_modules/@module-federation/runtime/dist/index.cjs.cjs ***!
  \****************************************************************************************************************************/
(function (__unused_webpack_module, exports, __webpack_require__) {
"use strict";


var runtimeCore = __webpack_require__(/*! @module-federation/runtime-core */ "../../node_modules/.bun/@module-federation+runtime-core@0.21.2/node_modules/@module-federation/runtime-core/dist/index.cjs.cjs");
var errorCodes = __webpack_require__(/*! @module-federation/error-codes */ "../../node_modules/.bun/@module-federation+error-codes@0.21.2/node_modules/@module-federation/error-codes/dist/index.cjs.js");
var utils = __webpack_require__(/*! ./utils.cjs.cjs */ "../../node_modules/.bun/@module-federation+runtime@0.21.2/node_modules/@module-federation/runtime/dist/utils.cjs.cjs");

function createInstance(options) {
    // Retrieve debug constructor
    const ModuleFederationConstructor = runtimeCore.getGlobalFederationConstructor() || runtimeCore.ModuleFederation;
    const instance = new ModuleFederationConstructor(options);
    runtimeCore.setGlobalFederationInstance(instance);
    return instance;
}
let FederationInstance = null;
/**
 * @deprecated Use createInstance or getInstance instead
 */
function init(options) {
    // Retrieve the same instance with the same name
    const instance = utils.getGlobalFederationInstance(options.name, options.version);
    if (!instance) {
        FederationInstance = createInstance(options);
        return FederationInstance;
    }
    else {
        // Merge options
        instance.initOptions(options);
        if (!FederationInstance) {
            FederationInstance = instance;
        }
        return instance;
    }
}
function loadRemote(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    const loadRemote = FederationInstance.loadRemote;
    // eslint-disable-next-line prefer-spread
    return loadRemote.apply(FederationInstance, args);
}
function loadShare(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    const loadShare = FederationInstance.loadShare;
    return loadShare.apply(FederationInstance, args);
}
function loadShareSync(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    const loadShareSync = FederationInstance.loadShareSync;
    // eslint-disable-next-line prefer-spread
    return loadShareSync.apply(FederationInstance, args);
}
function preloadRemote(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.preloadRemote.apply(FederationInstance, args);
}
function registerRemotes(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.registerRemotes.apply(FederationInstance, args);
}
function registerPlugins(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.registerPlugins.apply(FederationInstance, args);
}
function getInstance() {
    return FederationInstance;
}
function registerShared(...args) {
    runtimeCore.assert(FederationInstance, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_009, errorCodes.runtimeDescMap));
    // eslint-disable-next-line prefer-spread
    return FederationInstance.registerShared.apply(FederationInstance, args);
}
// Inject for debug
runtimeCore.setGlobalFederationConstructor(runtimeCore.ModuleFederation);

exports.Module = runtimeCore.Module;
exports.ModuleFederation = runtimeCore.ModuleFederation;
exports.getRemoteEntry = runtimeCore.getRemoteEntry;
exports.getRemoteInfo = runtimeCore.getRemoteInfo;
exports.loadScript = runtimeCore.loadScript;
exports.loadScriptNode = runtimeCore.loadScriptNode;
exports.registerGlobalPlugins = runtimeCore.registerGlobalPlugins;
exports.createInstance = createInstance;
exports.getInstance = getInstance;
exports.init = init;
exports.loadRemote = loadRemote;
exports.loadShare = loadShare;
exports.loadShareSync = loadShareSync;
exports.preloadRemote = preloadRemote;
exports.registerPlugins = registerPlugins;
exports.registerRemotes = registerRemotes;
exports.registerShared = registerShared;
//# sourceMappingURL=index.cjs.cjs.map


}),
"../../node_modules/.bun/@module-federation+runtime@0.21.2/node_modules/@module-federation/runtime/dist/utils.cjs.cjs": 
/*!****************************************************************************************************************************!*\
  !*** ../../node_modules/.bun/@module-federation+runtime@0.21.2/node_modules/@module-federation/runtime/dist/utils.cjs.cjs ***!
  \****************************************************************************************************************************/
(function (__unused_webpack_module, exports, __webpack_require__) {
"use strict";


var runtimeCore = __webpack_require__(/*! @module-federation/runtime-core */ "../../node_modules/.bun/@module-federation+runtime-core@0.21.2/node_modules/@module-federation/runtime-core/dist/index.cjs.cjs");

// injected by bundler, so it can not use runtime-core stuff
function getBuilderId() {
    //@ts-ignore
    return typeof FEDERATION_BUILD_IDENTIFIER !== 'undefined'
        ? //@ts-ignore
            FEDERATION_BUILD_IDENTIFIER
        : '';
}
function getGlobalFederationInstance(name, version) {
    const buildId = getBuilderId();
    return runtimeCore.CurrentGlobal.__FEDERATION__.__INSTANCES__.find((GMInstance) => {
        if (buildId && GMInstance.options.id === buildId) {
            return true;
        }
        if (GMInstance.options.name === name &&
            !GMInstance.options.version &&
            !version) {
            return true;
        }
        if (GMInstance.options.name === name &&
            version &&
            GMInstance.options.version === version) {
            return true;
        }
        return false;
    });
}

exports.getGlobalFederationInstance = getGlobalFederationInstance;
//# sourceMappingURL=utils.cjs.cjs.map


}),
"../../node_modules/.bun/@module-federation+sdk@0.21.2/node_modules/@module-federation/sdk/dist/index.cjs.cjs": 
/*!********************************************************************************************************************!*\
  !*** ../../node_modules/.bun/@module-federation+sdk@0.21.2/node_modules/@module-federation/sdk/dist/index.cjs.cjs ***!
  \********************************************************************************************************************/
(function (__unused_webpack_module, exports) {
"use strict";


const FederationModuleManifest = 'federation-manifest.json';
const MANIFEST_EXT = '.json';
const BROWSER_LOG_KEY = 'FEDERATION_DEBUG';
const NameTransformSymbol = {
    AT: '@',
    HYPHEN: '-',
    SLASH: '/',
};
const NameTransformMap = {
    [NameTransformSymbol.AT]: 'scope_',
    [NameTransformSymbol.HYPHEN]: '_',
    [NameTransformSymbol.SLASH]: '__',
};
const EncodedNameTransformMap = {
    [NameTransformMap[NameTransformSymbol.AT]]: NameTransformSymbol.AT,
    [NameTransformMap[NameTransformSymbol.HYPHEN]]: NameTransformSymbol.HYPHEN,
    [NameTransformMap[NameTransformSymbol.SLASH]]: NameTransformSymbol.SLASH,
};
const SEPARATOR = ':';
const ManifestFileName = 'mf-manifest.json';
const StatsFileName = 'mf-stats.json';
const MFModuleType = {
    NPM: 'npm',
    APP: 'app',
};
const MODULE_DEVTOOL_IDENTIFIER = '__MF_DEVTOOLS_MODULE_INFO__';
const ENCODE_NAME_PREFIX = 'ENCODE_NAME_PREFIX';
const TEMP_DIR = '.federation';
const MFPrefetchCommon = {
    identifier: 'MFDataPrefetch',
    globalKey: '__PREFETCH__',
    library: 'mf-data-prefetch',
    exportsKey: '__PREFETCH_EXPORTS__',
    fileName: 'bootstrap.js',
};

/*
 * This file was automatically generated.
 * DO NOT MODIFY BY HAND.
 * Run `yarn special-lint-fix` to update
 */

var ContainerPlugin = /*#__PURE__*/Object.freeze({
    __proto__: null
});

/*
 * This file was automatically generated.
 * DO NOT MODIFY BY HAND.
 * Run `yarn special-lint-fix` to update
 */

var ContainerReferencePlugin = /*#__PURE__*/Object.freeze({
    __proto__: null
});

var ModuleFederationPlugin = /*#__PURE__*/Object.freeze({
    __proto__: null
});

/*
 * This file was automatically generated.
 * DO NOT MODIFY BY HAND.
 * Run `yarn special-lint-fix` to update
 */

var SharePlugin = /*#__PURE__*/Object.freeze({
    __proto__: null
});

function isBrowserEnv() {
    return (typeof window !== 'undefined' && typeof window.document !== 'undefined');
}
function isReactNativeEnv() {
    return (typeof navigator !== 'undefined' && navigator?.product === 'ReactNative');
}
function isBrowserDebug() {
    try {
        if (isBrowserEnv() && window.localStorage) {
            return Boolean(localStorage.getItem(BROWSER_LOG_KEY));
        }
    }
    catch (error) {
        return false;
    }
    return false;
}
function isDebugMode() {
    if (typeof process !== 'undefined' &&
        process.env &&
        process.env['FEDERATION_DEBUG']) {
        return Boolean(process.env['FEDERATION_DEBUG']);
    }
    if (typeof FEDERATION_DEBUG !== 'undefined' && Boolean(FEDERATION_DEBUG)) {
        return true;
    }
    return isBrowserDebug();
}
const getProcessEnv = function () {
    return typeof process !== 'undefined' && process.env ? process.env : {};
};

const LOG_CATEGORY = '[ Federation Runtime ]';
// entry: name:version   version : 1.0.0 | ^1.2.3
// entry: name:entry  entry:  https://localhost:9000/federation-manifest.json
const parseEntry = (str, devVerOrUrl, separator = SEPARATOR) => {
    const strSplit = str.split(separator);
    const devVersionOrUrl = getProcessEnv()['NODE_ENV'] === 'development' && devVerOrUrl;
    const defaultVersion = '*';
    const isEntry = (s) => s.startsWith('http') || s.includes(MANIFEST_EXT);
    // Check if the string starts with a type
    if (strSplit.length >= 2) {
        let [name, ...versionOrEntryArr] = strSplit;
        // @name@manifest-url.json
        if (str.startsWith(separator)) {
            name = strSplit.slice(0, 2).join(separator);
            versionOrEntryArr = [
                devVersionOrUrl || strSplit.slice(2).join(separator),
            ];
        }
        let versionOrEntry = devVersionOrUrl || versionOrEntryArr.join(separator);
        if (isEntry(versionOrEntry)) {
            return {
                name,
                entry: versionOrEntry,
            };
        }
        else {
            // Apply version rule
            // devVersionOrUrl => inputVersion => defaultVersion
            return {
                name,
                version: versionOrEntry || defaultVersion,
            };
        }
    }
    else if (strSplit.length === 1) {
        const [name] = strSplit;
        if (devVersionOrUrl && isEntry(devVersionOrUrl)) {
            return {
                name,
                entry: devVersionOrUrl,
            };
        }
        return {
            name,
            version: devVersionOrUrl || defaultVersion,
        };
    }
    else {
        throw `Invalid entry value: ${str}`;
    }
};
const composeKeyWithSeparator = function (...args) {
    if (!args.length) {
        return '';
    }
    return args.reduce((sum, cur) => {
        if (!cur) {
            return sum;
        }
        if (!sum) {
            return cur;
        }
        return `${sum}${SEPARATOR}${cur}`;
    }, '');
};
const encodeName = function (name, prefix = '', withExt = false) {
    try {
        const ext = withExt ? '.js' : '';
        return `${prefix}${name
            .replace(new RegExp(`${NameTransformSymbol.AT}`, 'g'), NameTransformMap[NameTransformSymbol.AT])
            .replace(new RegExp(`${NameTransformSymbol.HYPHEN}`, 'g'), NameTransformMap[NameTransformSymbol.HYPHEN])
            .replace(new RegExp(`${NameTransformSymbol.SLASH}`, 'g'), NameTransformMap[NameTransformSymbol.SLASH])}${ext}`;
    }
    catch (err) {
        throw err;
    }
};
const decodeName = function (name, prefix, withExt) {
    try {
        let decodedName = name;
        if (prefix) {
            if (!decodedName.startsWith(prefix)) {
                return decodedName;
            }
            decodedName = decodedName.replace(new RegExp(prefix, 'g'), '');
        }
        decodedName = decodedName
            .replace(new RegExp(`${NameTransformMap[NameTransformSymbol.AT]}`, 'g'), EncodedNameTransformMap[NameTransformMap[NameTransformSymbol.AT]])
            .replace(new RegExp(`${NameTransformMap[NameTransformSymbol.SLASH]}`, 'g'), EncodedNameTransformMap[NameTransformMap[NameTransformSymbol.SLASH]])
            .replace(new RegExp(`${NameTransformMap[NameTransformSymbol.HYPHEN]}`, 'g'), EncodedNameTransformMap[NameTransformMap[NameTransformSymbol.HYPHEN]]);
        if (withExt) {
            decodedName = decodedName.replace('.js', '');
        }
        return decodedName;
    }
    catch (err) {
        throw err;
    }
};
const generateExposeFilename = (exposeName, withExt) => {
    if (!exposeName) {
        return '';
    }
    let expose = exposeName;
    if (expose === '.') {
        expose = 'default_export';
    }
    if (expose.startsWith('./')) {
        expose = expose.replace('./', '');
    }
    return encodeName(expose, '__federation_expose_', withExt);
};
const generateShareFilename = (pkgName, withExt) => {
    if (!pkgName) {
        return '';
    }
    return encodeName(pkgName, '__federation_shared_', withExt);
};
const getResourceUrl = (module, sourceUrl) => {
    if ('getPublicPath' in module) {
        let publicPath;
        if (!module.getPublicPath.startsWith('function')) {
            publicPath = new Function(module.getPublicPath)();
        }
        else {
            publicPath = new Function('return ' + module.getPublicPath)()();
        }
        return `${publicPath}${sourceUrl}`;
    }
    else if ('publicPath' in module) {
        if (!isBrowserEnv() && !isReactNativeEnv() && 'ssrPublicPath' in module) {
            return `${module.ssrPublicPath}${sourceUrl}`;
        }
        return `${module.publicPath}${sourceUrl}`;
    }
    else {
        console.warn('Cannot get resource URL. If in debug mode, please ignore.', module, sourceUrl);
        return '';
    }
};
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const assert = (condition, msg) => {
    if (!condition) {
        error(msg);
    }
};
const error = (msg) => {
    throw new Error(`${LOG_CATEGORY}: ${msg}`);
};
const warn = (msg) => {
    console.warn(`${LOG_CATEGORY}: ${msg}`);
};
function safeToString(info) {
    try {
        return JSON.stringify(info, null, 2);
    }
    catch (e) {
        return '';
    }
}
// RegExp for version string
const VERSION_PATTERN_REGEXP = /^([\d^=v<>~]|[*xX]$)/;
function isRequiredVersion(str) {
    return VERSION_PATTERN_REGEXP.test(str);
}

const simpleJoinRemoteEntry = (rPath, rName) => {
    if (!rPath) {
        return rName;
    }
    const transformPath = (str) => {
        if (str === '.') {
            return '';
        }
        if (str.startsWith('./')) {
            return str.replace('./', '');
        }
        if (str.startsWith('/')) {
            const strWithoutSlash = str.slice(1);
            if (strWithoutSlash.endsWith('/')) {
                return strWithoutSlash.slice(0, -1);
            }
            return strWithoutSlash;
        }
        return str;
    };
    const transformedPath = transformPath(rPath);
    if (!transformedPath) {
        return rName;
    }
    if (transformedPath.endsWith('/')) {
        return `${transformedPath}${rName}`;
    }
    return `${transformedPath}/${rName}`;
};
function inferAutoPublicPath(url) {
    return url
        .replace(/#.*$/, '')
        .replace(/\?.*$/, '')
        .replace(/\/[^\/]+$/, '/');
}
// Priority: overrides > remotes
// eslint-disable-next-line max-lines-per-function
function generateSnapshotFromManifest(manifest, options = {}) {
    const { remotes = {}, overrides = {}, version } = options;
    let remoteSnapshot;
    const getPublicPath = () => {
        if ('publicPath' in manifest.metaData) {
            if (manifest.metaData.publicPath === 'auto' && version) {
                // use same implementation as publicPath auto runtime module implements
                return inferAutoPublicPath(version);
            }
            return manifest.metaData.publicPath;
        }
        else {
            return manifest.metaData.getPublicPath;
        }
    };
    const overridesKeys = Object.keys(overrides);
    let remotesInfo = {};
    // If remotes are not provided, only the remotes in the manifest will be read
    if (!Object.keys(remotes).length) {
        remotesInfo =
            manifest.remotes?.reduce((res, next) => {
                let matchedVersion;
                const name = next.federationContainerName;
                // overrides have higher priority
                if (overridesKeys.includes(name)) {
                    matchedVersion = overrides[name];
                }
                else {
                    if ('version' in next) {
                        matchedVersion = next.version;
                    }
                    else {
                        matchedVersion = next.entry;
                    }
                }
                res[name] = {
                    matchedVersion,
                };
                return res;
            }, {}) || {};
    }
    // If remotes (deploy scenario) are specified, they need to be traversed again
    Object.keys(remotes).forEach((key) => (remotesInfo[key] = {
        // overrides will override dependencies
        matchedVersion: overridesKeys.includes(key)
            ? overrides[key]
            : remotes[key],
    }));
    const { remoteEntry: { path: remoteEntryPath, name: remoteEntryName, type: remoteEntryType, }, types: remoteTypes, buildInfo: { buildVersion }, globalName, ssrRemoteEntry, } = manifest.metaData;
    const { exposes } = manifest;
    let basicRemoteSnapshot = {
        version: version ? version : '',
        buildVersion,
        globalName,
        remoteEntry: simpleJoinRemoteEntry(remoteEntryPath, remoteEntryName),
        remoteEntryType,
        remoteTypes: simpleJoinRemoteEntry(remoteTypes.path, remoteTypes.name),
        remoteTypesZip: remoteTypes.zip || '',
        remoteTypesAPI: remoteTypes.api || '',
        remotesInfo,
        shared: manifest?.shared.map((item) => ({
            assets: item.assets,
            sharedName: item.name,
            version: item.version,
        })),
        modules: exposes?.map((expose) => ({
            moduleName: expose.name,
            modulePath: expose.path,
            assets: expose.assets,
        })),
    };
    if (manifest.metaData?.prefetchInterface) {
        const prefetchInterface = manifest.metaData.prefetchInterface;
        basicRemoteSnapshot = {
            ...basicRemoteSnapshot,
            prefetchInterface,
        };
    }
    if (manifest.metaData?.prefetchEntry) {
        const { path, name, type } = manifest.metaData.prefetchEntry;
        basicRemoteSnapshot = {
            ...basicRemoteSnapshot,
            prefetchEntry: simpleJoinRemoteEntry(path, name),
            prefetchEntryType: type,
        };
    }
    if ('publicPath' in manifest.metaData) {
        remoteSnapshot = {
            ...basicRemoteSnapshot,
            publicPath: getPublicPath(),
            ssrPublicPath: manifest.metaData.ssrPublicPath,
        };
    }
    else {
        remoteSnapshot = {
            ...basicRemoteSnapshot,
            getPublicPath: getPublicPath(),
        };
    }
    if (ssrRemoteEntry) {
        const fullSSRRemoteEntry = simpleJoinRemoteEntry(ssrRemoteEntry.path, ssrRemoteEntry.name);
        remoteSnapshot.ssrRemoteEntry = fullSSRRemoteEntry;
        remoteSnapshot.ssrRemoteEntryType =
            ssrRemoteEntry.type || 'commonjs-module';
    }
    return remoteSnapshot;
}
function isManifestProvider(moduleInfo) {
    if ('remoteEntry' in moduleInfo &&
        moduleInfo.remoteEntry.includes(MANIFEST_EXT)) {
        return true;
    }
    else {
        return false;
    }
}

const PREFIX = '[ Module Federation ]';
const DEFAULT_DELEGATE = console;
const LOGGER_STACK_SKIP_TOKENS = [
    'logger.ts',
    'logger.js',
    'captureStackTrace',
    'Logger.emit',
    'Logger.log',
    'Logger.info',
    'Logger.warn',
    'Logger.error',
    'Logger.debug',
];
function captureStackTrace() {
    try {
        const stack = new Error().stack;
        if (!stack) {
            return undefined;
        }
        const [, ...rawLines] = stack.split('\n');
        const filtered = rawLines.filter((line) => !LOGGER_STACK_SKIP_TOKENS.some((token) => line.includes(token)));
        if (!filtered.length) {
            return undefined;
        }
        const stackPreview = filtered.slice(0, 5).join('\n');
        return `Stack trace:\n${stackPreview}`;
    }
    catch {
        return undefined;
    }
}
class Logger {
    constructor(prefix, delegate = DEFAULT_DELEGATE) {
        this.prefix = prefix;
        this.delegate = delegate ?? DEFAULT_DELEGATE;
    }
    setPrefix(prefix) {
        this.prefix = prefix;
    }
    setDelegate(delegate) {
        this.delegate = delegate ?? DEFAULT_DELEGATE;
    }
    emit(method, args) {
        const delegate = this.delegate;
        const debugMode = isDebugMode();
        const stackTrace = debugMode ? captureStackTrace() : undefined;
        const enrichedArgs = stackTrace ? [...args, stackTrace] : args;
        const order = (() => {
            switch (method) {
                case 'log':
                    return ['log', 'info'];
                case 'info':
                    return ['info', 'log'];
                case 'warn':
                    return ['warn', 'info', 'log'];
                case 'error':
                    return ['error', 'warn', 'log'];
                case 'debug':
                default:
                    return ['debug', 'log'];
            }
        })();
        for (const candidate of order) {
            const handler = delegate[candidate];
            if (typeof handler === 'function') {
                handler.call(delegate, this.prefix, ...enrichedArgs);
                return;
            }
        }
        for (const candidate of order) {
            const handler = DEFAULT_DELEGATE[candidate];
            if (typeof handler === 'function') {
                handler.call(DEFAULT_DELEGATE, this.prefix, ...enrichedArgs);
                return;
            }
        }
    }
    log(...args) {
        this.emit('log', args);
    }
    warn(...args) {
        this.emit('warn', args);
    }
    error(...args) {
        this.emit('error', args);
    }
    success(...args) {
        this.emit('info', args);
    }
    info(...args) {
        this.emit('info', args);
    }
    ready(...args) {
        this.emit('info', args);
    }
    debug(...args) {
        if (isDebugMode()) {
            this.emit('debug', args);
        }
    }
}
function createLogger(prefix) {
    return new Logger(prefix);
}
function createInfrastructureLogger(prefix) {
    const infrastructureLogger = new Logger(prefix);
    Object.defineProperty(infrastructureLogger, '__mf_infrastructure_logger__', {
        value: true,
        enumerable: false,
        configurable: false,
    });
    return infrastructureLogger;
}
function bindLoggerToCompiler(loggerInstance, compiler, name) {
    if (!loggerInstance
        .__mf_infrastructure_logger__) {
        return;
    }
    if (!compiler?.getInfrastructureLogger) {
        return;
    }
    try {
        const infrastructureLogger = compiler.getInfrastructureLogger(name);
        if (infrastructureLogger &&
            typeof infrastructureLogger === 'object' &&
            (typeof infrastructureLogger.log === 'function' ||
                typeof infrastructureLogger.info === 'function' ||
                typeof infrastructureLogger.warn === 'function' ||
                typeof infrastructureLogger.error === 'function')) {
            loggerInstance.setDelegate(infrastructureLogger);
        }
    }
    catch {
        // If the bundler throws (older versions), fall back to default console logger.
        loggerInstance.setDelegate(undefined);
    }
}
const logger = createLogger(PREFIX);
const infrastructureLogger = createInfrastructureLogger(PREFIX);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeWrapper(callback, disableWarn) {
    try {
        const res = await callback();
        return res;
    }
    catch (e) {
        !disableWarn && warn(e);
        return;
    }
}
function isStaticResourcesEqual(url1, url2) {
    const REG_EXP = /^(https?:)?\/\//i;
    // Transform url1 and url2 into relative paths
    const relativeUrl1 = url1.replace(REG_EXP, '').replace(/\/$/, '');
    const relativeUrl2 = url2.replace(REG_EXP, '').replace(/\/$/, '');
    // Check if the relative paths are identical
    return relativeUrl1 === relativeUrl2;
}
function createScript(info) {
    // Retrieve the existing script element by its src attribute
    let script = null;
    let needAttach = true;
    let timeout = 20000;
    let timeoutId;
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i];
        const scriptSrc = s.getAttribute('src');
        if (scriptSrc && isStaticResourcesEqual(scriptSrc, info.url)) {
            script = s;
            needAttach = false;
            break;
        }
    }
    if (!script) {
        const attrs = info.attrs;
        script = document.createElement('script');
        script.type = attrs?.['type'] === 'module' ? 'module' : 'text/javascript';
        let createScriptRes = undefined;
        if (info.createScriptHook) {
            createScriptRes = info.createScriptHook(info.url, info.attrs);
            if (createScriptRes instanceof HTMLScriptElement) {
                script = createScriptRes;
            }
            else if (typeof createScriptRes === 'object') {
                if ('script' in createScriptRes && createScriptRes.script) {
                    script = createScriptRes.script;
                }
                if ('timeout' in createScriptRes && createScriptRes.timeout) {
                    timeout = createScriptRes.timeout;
                }
            }
        }
        if (!script.src) {
            script.src = info.url;
        }
        if (attrs && !createScriptRes) {
            Object.keys(attrs).forEach((name) => {
                if (script) {
                    if (name === 'async' || name === 'defer') {
                        script[name] = attrs[name];
                        // Attributes that do not exist are considered overridden
                    }
                    else if (!script.getAttribute(name)) {
                        script.setAttribute(name, attrs[name]);
                    }
                }
            });
        }
    }
    const onScriptComplete = async (prev, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event) => {
        clearTimeout(timeoutId);
        const onScriptCompleteCallback = () => {
            if (event?.type === 'error') {
                info?.onErrorCallback && info?.onErrorCallback(event);
            }
            else {
                info?.cb && info?.cb();
            }
        };
        // Prevent memory leaks in IE.
        if (script) {
            script.onerror = null;
            script.onload = null;
            safeWrapper(() => {
                const { needDeleteScript = true } = info;
                if (needDeleteScript) {
                    script?.parentNode && script.parentNode.removeChild(script);
                }
            });
            if (prev && typeof prev === 'function') {
                const result = prev(event);
                if (result instanceof Promise) {
                    const res = await result;
                    onScriptCompleteCallback();
                    return res;
                }
                onScriptCompleteCallback();
                return result;
            }
        }
        onScriptCompleteCallback();
    };
    script.onerror = onScriptComplete.bind(null, script.onerror);
    script.onload = onScriptComplete.bind(null, script.onload);
    timeoutId = setTimeout(() => {
        onScriptComplete(null, new Error(`Remote script "${info.url}" time-outed.`));
    }, timeout);
    return { script, needAttach };
}
function createLink(info) {
    // <link rel="preload" href="script.js" as="script">
    // Retrieve the existing script element by its src attribute
    let link = null;
    let needAttach = true;
    const links = document.getElementsByTagName('link');
    for (let i = 0; i < links.length; i++) {
        const l = links[i];
        const linkHref = l.getAttribute('href');
        const linkRel = l.getAttribute('rel');
        if (linkHref &&
            isStaticResourcesEqual(linkHref, info.url) &&
            linkRel === info.attrs['rel']) {
            link = l;
            needAttach = false;
            break;
        }
    }
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('href', info.url);
        let createLinkRes = undefined;
        const attrs = info.attrs;
        if (info.createLinkHook) {
            createLinkRes = info.createLinkHook(info.url, attrs);
            if (createLinkRes instanceof HTMLLinkElement) {
                link = createLinkRes;
            }
        }
        if (attrs && !createLinkRes) {
            Object.keys(attrs).forEach((name) => {
                if (link && !link.getAttribute(name)) {
                    link.setAttribute(name, attrs[name]);
                }
            });
        }
    }
    const onLinkComplete = (prev, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event) => {
        const onLinkCompleteCallback = () => {
            if (event?.type === 'error') {
                info?.onErrorCallback && info?.onErrorCallback(event);
            }
            else {
                info?.cb && info?.cb();
            }
        };
        // Prevent memory leaks in IE.
        if (link) {
            link.onerror = null;
            link.onload = null;
            safeWrapper(() => {
                const { needDeleteLink = true } = info;
                if (needDeleteLink) {
                    link?.parentNode && link.parentNode.removeChild(link);
                }
            });
            if (prev) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const res = prev(event);
                onLinkCompleteCallback();
                return res;
            }
        }
        onLinkCompleteCallback();
    };
    link.onerror = onLinkComplete.bind(null, link.onerror);
    link.onload = onLinkComplete.bind(null, link.onload);
    return { link, needAttach };
}
function loadScript(url, info) {
    const { attrs = {}, createScriptHook } = info;
    return new Promise((resolve, reject) => {
        const { script, needAttach } = createScript({
            url,
            cb: resolve,
            onErrorCallback: reject,
            attrs: {
                fetchpriority: 'high',
                ...attrs,
            },
            createScriptHook,
            needDeleteScript: true,
        });
        needAttach && document.head.appendChild(script);
    });
}

const sdkImportCache = new Map();
function importNodeModule(name) {
    if (!name) {
        throw new Error('import specifier is required');
    }
    // Check cache to prevent infinite recursion
    if (sdkImportCache.has(name)) {
        return sdkImportCache.get(name);
    }
    const importModule = new Function('name', `return import(name)`);
    const promise = importModule(name)
        .then((res) => res)
        .catch((error) => {
        console.error(`Error importing module ${name}:`, error);
        // Remove from cache on error so it can be retried
        sdkImportCache.delete(name);
        throw error;
    });
    // Cache the promise to prevent recursive calls
    sdkImportCache.set(name, promise);
    return promise;
}
const loadNodeFetch = async () => {
    const fetchModule = await importNodeModule('node-fetch');
    return (fetchModule.default || fetchModule);
};
const lazyLoaderHookFetch = async (input, init, loaderHook) => {
    const hook = (url, init) => {
        return loaderHook.lifecycle.fetch.emit(url, init);
    };
    const res = await hook(input, init || {});
    if (!res || !(res instanceof Response)) {
        const fetchFunction = typeof fetch === 'undefined' ? await loadNodeFetch() : fetch;
        return fetchFunction(input, init || {});
    }
    return res;
};
const createScriptNode = typeof ENV_TARGET === 'undefined' || ENV_TARGET !== 'web'
    ? (url, cb, attrs, loaderHook) => {
        if (loaderHook?.createScriptHook) {
            const hookResult = loaderHook.createScriptHook(url);
            if (hookResult &&
                typeof hookResult === 'object' &&
                'url' in hookResult) {
                url = hookResult.url;
            }
        }
        let urlObj;
        try {
            urlObj = new URL(url);
        }
        catch (e) {
            console.error('Error constructing URL:', e);
            cb(new Error(`Invalid URL: ${e}`));
            return;
        }
        const getFetch = async () => {
            if (loaderHook?.fetch) {
                return (input, init) => lazyLoaderHookFetch(input, init, loaderHook);
            }
            return typeof fetch === 'undefined' ? loadNodeFetch() : fetch;
        };
        const handleScriptFetch = async (f, urlObj) => {
            try {
                const res = await f(urlObj.href);
                const data = await res.text();
                const [path, vm] = await Promise.all([
                    importNodeModule('path'),
                    importNodeModule('vm'),
                ]);
                const scriptContext = { exports: {}, module: { exports: {} } };
                const urlDirname = urlObj.pathname
                    .split('/')
                    .slice(0, -1)
                    .join('/');
                const filename = path.basename(urlObj.pathname);
                const script = new vm.Script(`(function(exports, module, require, __dirname, __filename) {${data}\n})`, {
                    filename,
                    importModuleDynamically: 
                    //@ts-ignore
                    vm.constants?.USE_MAIN_CONTEXT_DEFAULT_LOADER ??
                        importNodeModule,
                });
                script.runInThisContext()(scriptContext.exports, scriptContext.module, eval('require'), urlDirname, filename);
                const exportedInterface = scriptContext.module.exports || scriptContext.exports;
                if (attrs && exportedInterface && attrs['globalName']) {
                    const container = exportedInterface[attrs['globalName']] || exportedInterface;
                    cb(undefined, container);
                    return;
                }
                cb(undefined, exportedInterface);
            }
            catch (e) {
                cb(e instanceof Error
                    ? e
                    : new Error(`Script execution error: ${e}`));
            }
        };
        getFetch()
            .then(async (f) => {
            if (attrs?.['type'] === 'esm' || attrs?.['type'] === 'module') {
                return loadModule(urlObj.href, {
                    fetch: f,
                    vm: await importNodeModule('vm'),
                })
                    .then(async (module) => {
                    await module.evaluate();
                    cb(undefined, module.namespace);
                })
                    .catch((e) => {
                    cb(e instanceof Error
                        ? e
                        : new Error(`Script execution error: ${e}`));
                });
            }
            handleScriptFetch(f, urlObj);
        })
            .catch((err) => {
            cb(err);
        });
    }
    : (url, cb, attrs, loaderHook) => {
        cb(new Error('createScriptNode is disabled in non-Node.js environment'));
    };
const loadScriptNode = typeof ENV_TARGET === 'undefined' || ENV_TARGET !== 'web'
    ? (url, info) => {
        return new Promise((resolve, reject) => {
            createScriptNode(url, (error, scriptContext) => {
                if (error) {
                    reject(error);
                }
                else {
                    const remoteEntryKey = info?.attrs?.['globalName'] ||
                        `__FEDERATION_${info?.attrs?.['name']}:custom__`;
                    const entryExports = (globalThis[remoteEntryKey] =
                        scriptContext);
                    resolve(entryExports);
                }
            }, info.attrs, info.loaderHook);
        });
    }
    : (url, info) => {
        throw new Error('loadScriptNode is disabled in non-Node.js environment');
    };
const esmModuleCache = new Map();
async function loadModule(url, options) {
    // Check cache to prevent infinite recursion in ESM loading
    if (esmModuleCache.has(url)) {
        return esmModuleCache.get(url);
    }
    const { fetch, vm } = options;
    const response = await fetch(url);
    const code = await response.text();
    const module = new vm.SourceTextModule(code, {
        // @ts-ignore
        importModuleDynamically: async (specifier, script) => {
            const resolvedUrl = new URL(specifier, url).href;
            return loadModule(resolvedUrl, options);
        },
    });
    // Cache the module before linking to prevent cycles
    esmModuleCache.set(url, module);
    await module.link(async (specifier) => {
        const resolvedUrl = new URL(specifier, url).href;
        const module = await loadModule(resolvedUrl, options);
        return module;
    });
    return module;
}

function normalizeOptions(enableDefault, defaultOptions, key) {
    return function (options) {
        if (options === false) {
            return false;
        }
        if (typeof options === 'undefined') {
            if (enableDefault) {
                return defaultOptions;
            }
            else {
                return false;
            }
        }
        if (options === true) {
            return defaultOptions;
        }
        if (options && typeof options === 'object') {
            return {
                ...defaultOptions,
                ...options,
            };
        }
        throw new Error(`Unexpected type for \`${key}\`, expect boolean/undefined/object, got: ${typeof options}`);
    };
}

const createModuleFederationConfig = (options) => {
    return options;
};

exports.BROWSER_LOG_KEY = BROWSER_LOG_KEY;
exports.ENCODE_NAME_PREFIX = ENCODE_NAME_PREFIX;
exports.EncodedNameTransformMap = EncodedNameTransformMap;
exports.FederationModuleManifest = FederationModuleManifest;
exports.MANIFEST_EXT = MANIFEST_EXT;
exports.MFModuleType = MFModuleType;
exports.MFPrefetchCommon = MFPrefetchCommon;
exports.MODULE_DEVTOOL_IDENTIFIER = MODULE_DEVTOOL_IDENTIFIER;
exports.ManifestFileName = ManifestFileName;
exports.NameTransformMap = NameTransformMap;
exports.NameTransformSymbol = NameTransformSymbol;
exports.SEPARATOR = SEPARATOR;
exports.StatsFileName = StatsFileName;
exports.TEMP_DIR = TEMP_DIR;
exports.assert = assert;
exports.bindLoggerToCompiler = bindLoggerToCompiler;
exports.composeKeyWithSeparator = composeKeyWithSeparator;
exports.containerPlugin = ContainerPlugin;
exports.containerReferencePlugin = ContainerReferencePlugin;
exports.createInfrastructureLogger = createInfrastructureLogger;
exports.createLink = createLink;
exports.createLogger = createLogger;
exports.createModuleFederationConfig = createModuleFederationConfig;
exports.createScript = createScript;
exports.createScriptNode = createScriptNode;
exports.decodeName = decodeName;
exports.encodeName = encodeName;
exports.error = error;
exports.generateExposeFilename = generateExposeFilename;
exports.generateShareFilename = generateShareFilename;
exports.generateSnapshotFromManifest = generateSnapshotFromManifest;
exports.getProcessEnv = getProcessEnv;
exports.getResourceUrl = getResourceUrl;
exports.inferAutoPublicPath = inferAutoPublicPath;
exports.infrastructureLogger = infrastructureLogger;
exports.isBrowserEnv = isBrowserEnv;
exports.isDebugMode = isDebugMode;
exports.isManifestProvider = isManifestProvider;
exports.isReactNativeEnv = isReactNativeEnv;
exports.isRequiredVersion = isRequiredVersion;
exports.isStaticResourcesEqual = isStaticResourcesEqual;
exports.loadScript = loadScript;
exports.loadScriptNode = loadScriptNode;
exports.logger = logger;
exports.moduleFederationPlugin = ModuleFederationPlugin;
exports.normalizeOptions = normalizeOptions;
exports.parseEntry = parseEntry;
exports.safeToString = safeToString;
exports.safeWrapper = safeWrapper;
exports.sharePlugin = SharePlugin;
exports.simpleJoinRemoteEntry = simpleJoinRemoteEntry;
exports.warn = warn;
//# sourceMappingURL=index.cjs.cjs.map


}),
"../../node_modules/.bun/@module-federation+webpack-bundler-runtime@0.21.2/node_modules/@module-federation/webpack-bundler-runtime/dist/constant.cjs.cjs": 
/*!***************************************************************************************************************************************************************!*\
  !*** ../../node_modules/.bun/@module-federation+webpack-bundler-runtime@0.21.2/node_modules/@module-federation/webpack-bundler-runtime/dist/constant.cjs.cjs ***!
  \***************************************************************************************************************************************************************/
(function (__unused_webpack_module, exports) {
"use strict";


const FEDERATION_SUPPORTED_TYPES = ['script'];

exports.FEDERATION_SUPPORTED_TYPES = FEDERATION_SUPPORTED_TYPES;
//# sourceMappingURL=constant.cjs.cjs.map


}),
"../../node_modules/.bun/@module-federation+webpack-bundler-runtime@0.21.2/node_modules/@module-federation/webpack-bundler-runtime/dist/index.cjs.cjs": 
/*!************************************************************************************************************************************************************!*\
  !*** ../../node_modules/.bun/@module-federation+webpack-bundler-runtime@0.21.2/node_modules/@module-federation/webpack-bundler-runtime/dist/index.cjs.cjs ***!
  \************************************************************************************************************************************************************/
(function (module, __unused_webpack_exports, __webpack_require__) {
"use strict";


var runtime = __webpack_require__(/*! @module-federation/runtime */ "../../node_modules/.bun/@module-federation+runtime@0.21.2/node_modules/@module-federation/runtime/dist/index.cjs.cjs");
var constant = __webpack_require__(/*! ./constant.cjs.cjs */ "../../node_modules/.bun/@module-federation+webpack-bundler-runtime@0.21.2/node_modules/@module-federation/webpack-bundler-runtime/dist/constant.cjs.cjs");
var sdk = __webpack_require__(/*! @module-federation/sdk */ "../../node_modules/.bun/@module-federation+sdk@0.21.2/node_modules/@module-federation/sdk/dist/index.cjs.cjs");

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        for (var k in e) {
            n[k] = e[k];
        }
    }
    n.default = e;
    return Object.freeze(n);
}

var runtime__namespace = /*#__PURE__*/_interopNamespaceDefault(runtime);

function attachShareScopeMap(webpackRequire) {
    if (!webpackRequire.S ||
        webpackRequire.federation.hasAttachShareScopeMap ||
        !webpackRequire.federation.instance ||
        !webpackRequire.federation.instance.shareScopeMap) {
        return;
    }
    webpackRequire.S = webpackRequire.federation.instance.shareScopeMap;
    webpackRequire.federation.hasAttachShareScopeMap = true;
}

function updateConsumeOptions(options) {
    const { webpackRequire, moduleToHandlerMapping } = options;
    const { consumesLoadingData, initializeSharingData } = webpackRequire;
    if (consumesLoadingData && !consumesLoadingData._updated) {
        const { moduleIdToConsumeDataMapping: updatedModuleIdToConsumeDataMapping = {}, initialConsumes: updatedInitialConsumes = [], chunkMapping: updatedChunkMapping = {}, } = consumesLoadingData;
        Object.entries(updatedModuleIdToConsumeDataMapping).forEach(([id, data]) => {
            if (!moduleToHandlerMapping[id]) {
                moduleToHandlerMapping[id] = {
                    getter: data.fallback,
                    shareInfo: {
                        shareConfig: {
                            requiredVersion: data.requiredVersion,
                            strictVersion: data.strictVersion,
                            singleton: data.singleton,
                            eager: data.eager,
                            layer: data.layer,
                        },
                        scope: Array.isArray(data.shareScope)
                            ? data.shareScope
                            : [data.shareScope || 'default'],
                    },
                    shareKey: data.shareKey,
                };
            }
        });
        if ('initialConsumes' in options) {
            const { initialConsumes = [] } = options;
            updatedInitialConsumes.forEach((id) => {
                if (!initialConsumes.includes(id)) {
                    initialConsumes.push(id);
                }
            });
        }
        if ('chunkMapping' in options) {
            const { chunkMapping = {} } = options;
            Object.entries(updatedChunkMapping).forEach(([id, chunkModules]) => {
                if (!chunkMapping[id]) {
                    chunkMapping[id] = [];
                }
                chunkModules.forEach((moduleId) => {
                    if (!chunkMapping[id].includes(moduleId)) {
                        chunkMapping[id].push(moduleId);
                    }
                });
            });
        }
        consumesLoadingData._updated = 1;
    }
    if (initializeSharingData && !initializeSharingData._updated) {
        const { federation } = webpackRequire;
        if (!federation.instance ||
            !initializeSharingData.scopeToSharingDataMapping) {
            return;
        }
        const shared = {};
        for (let [scope, stages] of Object.entries(initializeSharingData.scopeToSharingDataMapping)) {
            for (let stage of stages) {
                if (typeof stage === 'object' && stage !== null) {
                    const { name, version, factory, eager, singleton, requiredVersion, strictVersion, } = stage;
                    const shareConfig = {
                        requiredVersion: `^${version}`,
                    };
                    const isValidValue = function (val) {
                        return typeof val !== 'undefined';
                    };
                    if (isValidValue(singleton)) {
                        shareConfig.singleton = singleton;
                    }
                    if (isValidValue(requiredVersion)) {
                        shareConfig.requiredVersion = requiredVersion;
                    }
                    if (isValidValue(eager)) {
                        shareConfig.eager = eager;
                    }
                    if (isValidValue(strictVersion)) {
                        shareConfig.strictVersion = strictVersion;
                    }
                    const options = {
                        version,
                        scope: [scope],
                        shareConfig,
                        get: factory,
                    };
                    if (shared[name]) {
                        shared[name].push(options);
                    }
                    else {
                        shared[name] = [options];
                    }
                }
            }
        }
        federation.instance.registerShared(shared);
        initializeSharingData._updated = 1;
    }
}
function updateRemoteOptions(options) {
    const { webpackRequire, idToExternalAndNameMapping = {}, idToRemoteMap = {}, chunkMapping = {}, } = options;
    const { remotesLoadingData } = webpackRequire;
    const remoteInfos = webpackRequire.federation?.bundlerRuntimeOptions?.remotes?.remoteInfos;
    if (!remotesLoadingData || remotesLoadingData._updated || !remoteInfos) {
        return;
    }
    const { chunkMapping: updatedChunkMapping, moduleIdToRemoteDataMapping } = remotesLoadingData;
    if (!updatedChunkMapping || !moduleIdToRemoteDataMapping) {
        return;
    }
    for (let [moduleId, data] of Object.entries(moduleIdToRemoteDataMapping)) {
        if (!idToExternalAndNameMapping[moduleId]) {
            idToExternalAndNameMapping[moduleId] = [
                data.shareScope,
                data.name,
                data.externalModuleId,
            ];
        }
        if (!idToRemoteMap[moduleId] && remoteInfos[data.remoteName]) {
            const items = remoteInfos[data.remoteName];
            idToRemoteMap[moduleId] ||= [];
            items.forEach((item) => {
                if (!idToRemoteMap[moduleId].includes(item)) {
                    idToRemoteMap[moduleId].push(item);
                }
            });
        }
    }
    if (chunkMapping) {
        Object.entries(updatedChunkMapping).forEach(([id, chunkModules]) => {
            if (!chunkMapping[id]) {
                chunkMapping[id] = [];
            }
            chunkModules.forEach((moduleId) => {
                if (!chunkMapping[id].includes(moduleId)) {
                    chunkMapping[id].push(moduleId);
                }
            });
        });
    }
    remotesLoadingData._updated = 1;
}

function remotes(options) {
    updateRemoteOptions(options);
    const { chunkId, promises, webpackRequire, chunkMapping, idToExternalAndNameMapping, idToRemoteMap, } = options;
    attachShareScopeMap(webpackRequire);
    if (webpackRequire.o(chunkMapping, chunkId)) {
        chunkMapping[chunkId].forEach((id) => {
            let getScope = webpackRequire.R;
            if (!getScope) {
                getScope = [];
            }
            const data = idToExternalAndNameMapping[id];
            const remoteInfos = idToRemoteMap[id] || [];
            // @ts-ignore seems not work
            if (getScope.indexOf(data) >= 0) {
                return;
            }
            // @ts-ignore seems not work
            getScope.push(data);
            if (data.p) {
                return promises.push(data.p);
            }
            const onError = (error) => {
                if (!error) {
                    error = new Error('Container missing');
                }
                if (typeof error.message === 'string') {
                    error.message += `\nwhile loading "${data[1]}" from ${data[2]}`;
                }
                webpackRequire.m[id] = () => {
                    throw error;
                };
                data.p = 0;
            };
            const handleFunction = (fn, arg1, arg2, d, next, first) => {
                try {
                    const promise = fn(arg1, arg2);
                    if (promise && promise.then) {
                        const p = promise.then((result) => next(result, d), onError);
                        if (first) {
                            promises.push((data.p = p));
                        }
                        else {
                            return p;
                        }
                    }
                    else {
                        return next(promise, d, first);
                    }
                }
                catch (error) {
                    onError(error);
                }
            };
            const onExternal = (external, _, first) => external
                ? handleFunction(webpackRequire.I, data[0], 0, external, onInitialized, first)
                : onError();
            // eslint-disable-next-line no-var
            var onInitialized = (_, external, first) => handleFunction(external.get, data[1], getScope, 0, onFactory, first);
            // eslint-disable-next-line no-var
            var onFactory = (factory) => {
                data.p = 1;
                webpackRequire.m[id] = (module) => {
                    module.exports = factory();
                };
            };
            const onRemoteLoaded = () => {
                try {
                    const remoteName = sdk.decodeName(remoteInfos[0].name, sdk.ENCODE_NAME_PREFIX);
                    const remoteModuleName = remoteName + data[1].slice(1);
                    const instance = webpackRequire.federation.instance;
                    const loadRemote = () => webpackRequire.federation.instance.loadRemote(remoteModuleName, {
                        loadFactory: false,
                        from: 'build',
                    });
                    if (instance.options.shareStrategy === 'version-first') {
                        return Promise.all(instance.sharedHandler.initializeSharing(data[0])).then(() => {
                            return loadRemote();
                        });
                    }
                    return loadRemote();
                }
                catch (error) {
                    onError(error);
                }
            };
            const useRuntimeLoad = remoteInfos.length === 1 &&
                constant.FEDERATION_SUPPORTED_TYPES.includes(remoteInfos[0].externalType) &&
                remoteInfos[0].name;
            if (useRuntimeLoad) {
                handleFunction(onRemoteLoaded, data[2], 0, 0, onFactory, 1);
            }
            else {
                handleFunction(webpackRequire, data[2], 0, 0, onExternal, 1);
            }
        });
    }
}

function consumes(options) {
    updateConsumeOptions(options);
    const { chunkId, promises, installedModules, webpackRequire, chunkMapping, moduleToHandlerMapping, } = options;
    attachShareScopeMap(webpackRequire);
    if (webpackRequire.o(chunkMapping, chunkId)) {
        chunkMapping[chunkId].forEach((id) => {
            if (webpackRequire.o(installedModules, id)) {
                return promises.push(installedModules[id]);
            }
            const onFactory = (factory) => {
                installedModules[id] = 0;
                webpackRequire.m[id] = (module) => {
                    delete webpackRequire.c[id];
                    const result = factory();
                    // Add layer property from shareConfig if available
                    const { shareInfo } = moduleToHandlerMapping[id];
                    if (shareInfo?.shareConfig?.layer &&
                        result &&
                        typeof result === 'object') {
                        try {
                            // Only set layer if it's not already defined or if it's undefined
                            if (!result.hasOwnProperty('layer') ||
                                result.layer === undefined) {
                                result.layer = shareInfo.shareConfig.layer;
                            }
                        }
                        catch (e) {
                            // Ignore if layer property is read-only
                        }
                    }
                    module.exports = result;
                };
            };
            const onError = (error) => {
                delete installedModules[id];
                webpackRequire.m[id] = (module) => {
                    delete webpackRequire.c[id];
                    throw error;
                };
            };
            try {
                const federationInstance = webpackRequire.federation.instance;
                if (!federationInstance) {
                    throw new Error('Federation instance not found!');
                }
                const { shareKey, getter, shareInfo } = moduleToHandlerMapping[id];
                const promise = federationInstance
                    .loadShare(shareKey, { customShareInfo: shareInfo })
                    .then((factory) => {
                    if (factory === false) {
                        return getter();
                    }
                    return factory;
                });
                if (promise.then) {
                    promises.push((installedModules[id] = promise.then(onFactory).catch(onError)));
                }
                else {
                    // @ts-ignore maintain previous logic
                    onFactory(promise);
                }
            }
            catch (e) {
                onError(e);
            }
        });
    }
}

function initializeSharing({ shareScopeName, webpackRequire, initPromises, initTokens, initScope, }) {
    const shareScopeKeys = Array.isArray(shareScopeName)
        ? shareScopeName
        : [shareScopeName];
    var initializeSharingPromises = [];
    var _initializeSharing = function (shareScopeKey) {
        if (!initScope)
            initScope = [];
        const mfInstance = webpackRequire.federation.instance;
        // handling circular init calls
        var initToken = initTokens[shareScopeKey];
        if (!initToken)
            initToken = initTokens[shareScopeKey] = { from: mfInstance.name };
        if (initScope.indexOf(initToken) >= 0)
            return;
        initScope.push(initToken);
        const promise = initPromises[shareScopeKey];
        if (promise)
            return promise;
        var warn = (msg) => typeof console !== 'undefined' && console.warn && console.warn(msg);
        var initExternal = (id) => {
            var handleError = (err) => warn('Initialization of sharing external failed: ' + err);
            try {
                var module = webpackRequire(id);
                if (!module)
                    return;
                var initFn = (module) => module &&
                    module.init &&
                    // @ts-ignore compat legacy mf shared behavior
                    module.init(webpackRequire.S[shareScopeKey], initScope, {
                        shareScopeMap: webpackRequire.S || {},
                        shareScopeKeys: shareScopeName,
                    });
                if (module.then)
                    return promises.push(module.then(initFn, handleError));
                var initResult = initFn(module);
                // @ts-ignore
                if (initResult && typeof initResult !== 'boolean' && initResult.then)
                    // @ts-ignore
                    return promises.push(initResult['catch'](handleError));
            }
            catch (err) {
                handleError(err);
            }
        };
        const promises = mfInstance.initializeSharing(shareScopeKey, {
            strategy: mfInstance.options.shareStrategy,
            initScope,
            from: 'build',
        });
        attachShareScopeMap(webpackRequire);
        const bundlerRuntimeRemotesOptions = webpackRequire.federation.bundlerRuntimeOptions.remotes;
        if (bundlerRuntimeRemotesOptions) {
            Object.keys(bundlerRuntimeRemotesOptions.idToRemoteMap).forEach((moduleId) => {
                const info = bundlerRuntimeRemotesOptions.idToRemoteMap[moduleId];
                const externalModuleId = bundlerRuntimeRemotesOptions.idToExternalAndNameMapping[moduleId][2];
                if (info.length > 1) {
                    initExternal(externalModuleId);
                }
                else if (info.length === 1) {
                    const remoteInfo = info[0];
                    if (!constant.FEDERATION_SUPPORTED_TYPES.includes(remoteInfo.externalType)) {
                        initExternal(externalModuleId);
                    }
                }
            });
        }
        if (!promises.length) {
            return (initPromises[shareScopeKey] = true);
        }
        return (initPromises[shareScopeKey] = Promise.all(promises).then(() => (initPromises[shareScopeKey] = true)));
    };
    shareScopeKeys.forEach((key) => {
        initializeSharingPromises.push(_initializeSharing(key));
    });
    return Promise.all(initializeSharingPromises).then(() => true);
}

function handleInitialConsumes(options) {
    const { moduleId, moduleToHandlerMapping, webpackRequire } = options;
    const federationInstance = webpackRequire.federation.instance;
    if (!federationInstance) {
        throw new Error('Federation instance not found!');
    }
    const { shareKey, shareInfo } = moduleToHandlerMapping[moduleId];
    try {
        return federationInstance.loadShareSync(shareKey, {
            customShareInfo: shareInfo,
        });
    }
    catch (err) {
        console.error('loadShareSync failed! The function should not be called unless you set "eager:true". If you do not set it, and encounter this issue, you can check whether an async boundary is implemented.');
        console.error('The original error message is as follows: ');
        throw err;
    }
}
function installInitialConsumes(options) {
    const { webpackRequire } = options;
    updateConsumeOptions(options);
    const { initialConsumes, moduleToHandlerMapping, installedModules } = options;
    initialConsumes.forEach((id) => {
        webpackRequire.m[id] = (module) => {
            // Handle scenario when module is used synchronously
            installedModules[id] = 0;
            delete webpackRequire.c[id];
            const factory = handleInitialConsumes({
                moduleId: id,
                moduleToHandlerMapping,
                webpackRequire,
            });
            if (typeof factory !== 'function') {
                throw new Error(`Shared module is not available for eager consumption: ${id}`);
            }
            const result = factory();
            // Add layer property from shareConfig if available
            const { shareInfo } = moduleToHandlerMapping[id];
            if (shareInfo?.shareConfig?.layer &&
                result &&
                typeof result === 'object') {
                try {
                    // Only set layer if it's not already defined or if it's undefined
                    if (!result.hasOwnProperty('layer') ||
                        result.layer === undefined) {
                        result.layer = shareInfo.shareConfig.layer;
                    }
                }
                catch (e) {
                    // Ignore if layer property is read-only
                }
            }
            module.exports = result;
        };
    });
}

function initContainerEntry(options) {
    const { webpackRequire, shareScope, initScope, shareScopeKey, remoteEntryInitOptions, } = options;
    if (!webpackRequire.S)
        return;
    if (!webpackRequire.federation ||
        !webpackRequire.federation.instance ||
        !webpackRequire.federation.initOptions)
        return;
    const federationInstance = webpackRequire.federation.instance;
    federationInstance.initOptions({
        name: webpackRequire.federation.initOptions.name,
        remotes: [],
        ...remoteEntryInitOptions,
    });
    const hostShareScopeKeys = remoteEntryInitOptions?.shareScopeKeys;
    const hostShareScopeMap = remoteEntryInitOptions?.shareScopeMap;
    // host: 'default' remote: 'default'  remote['default'] = hostShareScopeMap['default']
    // host: ['default', 'scope1'] remote: 'default'  remote['default'] = hostShareScopeMap['default']; remote['scope1'] = hostShareScopeMap['scop1']
    // host: 'default' remote: ['default','scope1']  remote['default'] = hostShareScopeMap['default']; remote['scope1'] = hostShareScopeMap['scope1'] = {}
    // host: ['scope1','default'] remote: ['scope1','scope2'] => remote['scope1'] = hostShareScopeMap['scope1']; remote['scope2'] = hostShareScopeMap['scope2'] = {};
    if (!shareScopeKey || typeof shareScopeKey === 'string') {
        const key = shareScopeKey || 'default';
        if (Array.isArray(hostShareScopeKeys)) {
            // const sc = hostShareScopeMap![key];
            // if (!sc) {
            //   throw new Error('shareScopeKey is not exist in hostShareScopeMap');
            // }
            // federationInstance.initShareScopeMap(key, sc, {
            //   hostShareScopeMap: remoteEntryInitOptions?.shareScopeMap || {},
            // });
            hostShareScopeKeys.forEach((hostKey) => {
                if (!hostShareScopeMap[hostKey]) {
                    hostShareScopeMap[hostKey] = {};
                }
                const sc = hostShareScopeMap[hostKey];
                federationInstance.initShareScopeMap(hostKey, sc, {
                    hostShareScopeMap: remoteEntryInitOptions?.shareScopeMap || {},
                });
            });
        }
        else {
            federationInstance.initShareScopeMap(key, shareScope, {
                hostShareScopeMap: remoteEntryInitOptions?.shareScopeMap || {},
            });
        }
    }
    else {
        shareScopeKey.forEach((key) => {
            if (!hostShareScopeKeys || !hostShareScopeMap) {
                federationInstance.initShareScopeMap(key, shareScope, {
                    hostShareScopeMap: remoteEntryInitOptions?.shareScopeMap || {},
                });
                return;
            }
            if (!hostShareScopeMap[key]) {
                hostShareScopeMap[key] = {};
            }
            const sc = hostShareScopeMap[key];
            federationInstance.initShareScopeMap(key, sc, {
                hostShareScopeMap: remoteEntryInitOptions?.shareScopeMap || {},
            });
        });
    }
    if (webpackRequire.federation.attachShareScopeMap) {
        webpackRequire.federation.attachShareScopeMap(webpackRequire);
    }
    if (typeof webpackRequire.federation.prefetch === 'function') {
        webpackRequire.federation.prefetch();
    }
    if (!Array.isArray(shareScopeKey)) {
        // @ts-ignore
        return webpackRequire.I(shareScopeKey || 'default', initScope);
    }
    var proxyInitializeSharing = Boolean(webpackRequire.federation.initOptions.shared);
    if (proxyInitializeSharing) {
        // @ts-ignore
        return webpackRequire.I(shareScopeKey, initScope);
    }
    // @ts-ignore
    return Promise.all(shareScopeKey.map((key) => {
        // @ts-ignore
        return webpackRequire.I(key, initScope);
    })).then(() => true);
}

const federation = {
    runtime: runtime__namespace,
    instance: undefined,
    initOptions: undefined,
    bundlerRuntime: {
        remotes,
        consumes,
        I: initializeSharing,
        S: {},
        installInitialConsumes,
        initContainerEntry,
    },
    attachShareScopeMap,
    bundlerRuntimeOptions: {},
};

module.exports = federation;
//# sourceMappingURL=index.cjs.cjs.map


}),

});
/************************************************************************/
// The module cache
var __webpack_module_cache__ = {};

// The require function
function __webpack_require__(moduleId) {

// Check if module is in cache
var cachedModule = __webpack_module_cache__[moduleId];
if (cachedModule !== undefined) {
return cachedModule.exports;
}
// Create a new module (and put it into the cache)
var module = (__webpack_module_cache__[moduleId] = {
id: moduleId,
exports: {}
});
// Execute the module function
var execOptions = { id: moduleId, module: module, factory: __webpack_modules__[moduleId], require: __webpack_require__ };
__webpack_require__.i.forEach(function(handler) { handler(execOptions); });
module = execOptions.module;
if (!execOptions.factory) {
  console.error("undefined factory", moduleId);
  throw Error("RuntimeError: factory is undefined (" + moduleId + ")");
}
execOptions.factory.call(module.exports, module, module.exports, execOptions.require);

// Return the exports of the module
return module.exports;

}

// expose the modules object (__webpack_modules__)
__webpack_require__.m = __webpack_modules__;

// expose the module cache
__webpack_require__.c = __webpack_module_cache__;

// expose the module execution interceptor
__webpack_require__.i = [];

// the startup function
__webpack_require__.x = () => {
// Load entry module and return exports
__webpack_require__("../../node_modules/.bun/@rspack+core@1.6.1/node_modules/@rspack/core/hot/dev-server.js");
var __webpack_exports__ = __webpack_require__("webpack/container/entry/near-intents_debridge-data-provider");
return __webpack_exports__
};

/************************************************************************/
// module_federation/runtime
(() => {

if(!__webpack_require__.federation){
    __webpack_require__.federation = {
        
chunkMatcher: function(chunkId) {
    return !/^webpack_sharing_consume_default_orpc_(contract_orpc_contract|server_orpc_server\-webpack_sharing_consume_default_effec\-593267)$/.test(chunkId);
},
rootOutputDir: "",

    };
}

})();
// webpack/runtime/compat_get_default_export
(() => {
// getDefaultExport function for compatibility with non-ESM modules
__webpack_require__.n = (module) => {
	var getter = module && module.__esModule ?
		() => (module['default']) :
		() => (module);
	__webpack_require__.d(getter, { a: getter });
	return getter;
};

})();
// webpack/runtime/create_fake_namespace_object
(() => {
var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
var leafPrototypes;
// create a fake namespace object
// mode & 1: value is a module id, require it
// mode & 2: merge all properties of value into the ns
// mode & 4: return value when already ns object
// mode & 16: return value when it's Promise-like
// mode & 8|1: behave like require
__webpack_require__.t = function(value, mode) {
	if(mode & 1) value = this(value);
	if(mode & 8) return value;
	if(typeof value === 'object' && value) {
		if((mode & 4) && value.__esModule) return value;
		if((mode & 16) && typeof value.then === 'function') return value;
	}
	var ns = Object.create(null);
  __webpack_require__.r(ns);
	var def = {};
	leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
	for(var current = mode & 2 && value; (typeof current == 'object' || typeof current == 'function') && !~leafPrototypes.indexOf(current); current = getProto(current)) {
		Object.getOwnPropertyNames(current).forEach((key) => { def[key] = () => (value[key]) });
	}
	def['default'] = () => (value);
	__webpack_require__.d(ns, def);
	return ns;
};
})();
// webpack/runtime/define_property_getters
(() => {
__webpack_require__.d = (exports, definition) => {
	for(var key in definition) {
        if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
            Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
        }
    }
};
})();
// webpack/runtime/embed_federation_runtime
(() => {
var prevStartup = __webpack_require__.x;
var hasRun = false;
__webpack_require__.x = function() {
	if (!hasRun) {
		hasRun = true;
		__webpack_require__("@module-federation/runtime/rspack.js!=!data:text/javascript,import __module_federation_bundler_runtime__ from \"/Users/ebraem/workspace/bounties/data-providers/data-provider-playground/node_modules/.bun/@module-federation+webpack-bundler-runtime@0.21.2/node_modules/@module-federation/webpack-bundler-runtime/dist/index.cjs.cjs\";import __module_federation_runtime_plugin_0__ from \"/Users/ebraem/workspace/bounties/data-providers/data-provider-playground/node_modules/.bun/@module-federation+node@2.7.22+914b6fe990853d82/node_modules/@module-federation/node/dist/src/runtimePlugin.js\";const __module_federation_runtime_plugins__ = [__module_federation_runtime_plugin_0__(undefined)];const __module_federation_remote_infos__ = {};const __module_federation_container_name__ = \"near-intents_debridge-data-provider\";const __module_federation_share_strategy__ = \"version-first\";if((__webpack_require__.initializeSharingData||__webpack_require__.initializeExposesData)&&__webpack_require__.federation){var __webpack_require___remotesLoadingData,__webpack_require___remotesLoadingData1,__webpack_require___initializeSharingData,__webpack_require___consumesLoadingData,__webpack_require___consumesLoadingData1,__webpack_require___initializeExposesData,__webpack_require___consumesLoadingData2;const override=(obj,key,value)=>{if(!obj)return;if(obj[key])obj[key]=value};const merge=(obj,key,fn)=>{const value=fn();if(Array.isArray(value)){var _obj,_key;var _;(_=(_obj=obj)[_key=key])!==null&&_!==void 0?_:_obj[_key]=[];obj[key].push(...value)}else if(typeof value===\"object\"&&value!==null){var _obj1,_key1;var _1;(_1=(_obj1=obj)[_key1=key])!==null&&_1!==void 0?_1:_obj1[_key1]={};Object.assign(obj[key],value)}};const early=(obj,key,initial)=>{var _obj,_key;var _;(_=(_obj=obj)[_key=key])!==null&&_!==void 0?_:_obj[_key]=initial()};var __webpack_require___remotesLoadingData_chunkMapping;const remotesLoadingChunkMapping=(__webpack_require___remotesLoadingData_chunkMapping=(__webpack_require___remotesLoadingData=__webpack_require__.remotesLoadingData)===null||__webpack_require___remotesLoadingData===void 0?void 0:__webpack_require___remotesLoadingData.chunkMapping)!==null&&__webpack_require___remotesLoadingData_chunkMapping!==void 0?__webpack_require___remotesLoadingData_chunkMapping:{};var __webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping;const remotesLoadingModuleIdToRemoteDataMapping=(__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping=(__webpack_require___remotesLoadingData1=__webpack_require__.remotesLoadingData)===null||__webpack_require___remotesLoadingData1===void 0?void 0:__webpack_require___remotesLoadingData1.moduleIdToRemoteDataMapping)!==null&&__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping!==void 0?__webpack_require___remotesLoadingData_moduleIdToRemoteDataMapping:{};var __webpack_require___initializeSharingData_scopeToSharingDataMapping;const initializeSharingScopeToInitDataMapping=(__webpack_require___initializeSharingData_scopeToSharingDataMapping=(__webpack_require___initializeSharingData=__webpack_require__.initializeSharingData)===null||__webpack_require___initializeSharingData===void 0?void 0:__webpack_require___initializeSharingData.scopeToSharingDataMapping)!==null&&__webpack_require___initializeSharingData_scopeToSharingDataMapping!==void 0?__webpack_require___initializeSharingData_scopeToSharingDataMapping:{};var __webpack_require___consumesLoadingData_chunkMapping;const consumesLoadingChunkMapping=(__webpack_require___consumesLoadingData_chunkMapping=(__webpack_require___consumesLoadingData=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData===void 0?void 0:__webpack_require___consumesLoadingData.chunkMapping)!==null&&__webpack_require___consumesLoadingData_chunkMapping!==void 0?__webpack_require___consumesLoadingData_chunkMapping:{};var __webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping;const consumesLoadingModuleToConsumeDataMapping=(__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping=(__webpack_require___consumesLoadingData1=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData1===void 0?void 0:__webpack_require___consumesLoadingData1.moduleIdToConsumeDataMapping)!==null&&__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping!==void 0?__webpack_require___consumesLoadingData_moduleIdToConsumeDataMapping:{};const consumesLoadinginstalledModules={};const initializeSharingInitPromises=[];const initializeSharingInitTokens={};const containerShareScope=(__webpack_require___initializeExposesData=__webpack_require__.initializeExposesData)===null||__webpack_require___initializeExposesData===void 0?void 0:__webpack_require___initializeExposesData.shareScope;for(const key in __module_federation_bundler_runtime__){__webpack_require__.federation[key]=__module_federation_bundler_runtime__[key]}early(__webpack_require__.federation,\"consumesLoadingModuleToHandlerMapping\",()=>{const consumesLoadingModuleToHandlerMapping={};for(let[moduleId,data]of Object.entries(consumesLoadingModuleToConsumeDataMapping)){consumesLoadingModuleToHandlerMapping[moduleId]={getter:data.fallback,shareInfo:{shareConfig:{fixedDependencies:false,requiredVersion:data.requiredVersion,strictVersion:data.strictVersion,singleton:data.singleton,eager:data.eager},scope:[data.shareScope]},shareKey:data.shareKey}}return consumesLoadingModuleToHandlerMapping});early(__webpack_require__.federation,\"initOptions\",()=>({}));early(__webpack_require__.federation.initOptions,\"name\",()=>__module_federation_container_name__);early(__webpack_require__.federation.initOptions,\"shareStrategy\",()=>__module_federation_share_strategy__);early(__webpack_require__.federation.initOptions,\"shared\",()=>{const shared={};for(let[scope,stages]of Object.entries(initializeSharingScopeToInitDataMapping)){for(let stage of stages){if(typeof stage===\"object\"&&stage!==null){const{name,version,factory,eager,singleton,requiredVersion,strictVersion}=stage;const shareConfig={};const isValidValue=function(val){return typeof val!==\"undefined\"};if(isValidValue(singleton)){shareConfig.singleton=singleton}if(isValidValue(requiredVersion)){shareConfig.requiredVersion=requiredVersion}if(isValidValue(eager)){shareConfig.eager=eager}if(isValidValue(strictVersion)){shareConfig.strictVersion=strictVersion}const options={version,scope:[scope],shareConfig,get:factory};if(shared[name]){shared[name].push(options)}else{shared[name]=[options]}}}}return shared});merge(__webpack_require__.federation.initOptions,\"remotes\",()=>Object.values(__module_federation_remote_infos__).flat().filter(remote=>remote.externalType===\"script\"));merge(__webpack_require__.federation.initOptions,\"plugins\",()=>__module_federation_runtime_plugins__);early(__webpack_require__.federation,\"bundlerRuntimeOptions\",()=>({}));early(__webpack_require__.federation.bundlerRuntimeOptions,\"remotes\",()=>({}));early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,\"chunkMapping\",()=>remotesLoadingChunkMapping);early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,\"remoteInfos\",()=>__module_federation_remote_infos__);early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,\"idToExternalAndNameMapping\",()=>{const remotesLoadingIdToExternalAndNameMappingMapping={};for(let[moduleId,data]of Object.entries(remotesLoadingModuleIdToRemoteDataMapping)){remotesLoadingIdToExternalAndNameMappingMapping[moduleId]=[data.shareScope,data.name,data.externalModuleId,data.remoteName]}return remotesLoadingIdToExternalAndNameMappingMapping});early(__webpack_require__.federation.bundlerRuntimeOptions.remotes,\"webpackRequire\",()=>__webpack_require__);merge(__webpack_require__.federation.bundlerRuntimeOptions.remotes,\"idToRemoteMap\",()=>{const idToRemoteMap={};for(let[id,remoteData]of Object.entries(remotesLoadingModuleIdToRemoteDataMapping)){const info=__module_federation_remote_infos__[remoteData.remoteName];if(info)idToRemoteMap[id]=info}return idToRemoteMap});override(__webpack_require__,\"S\",__webpack_require__.federation.bundlerRuntime.S);if(__webpack_require__.federation.attachShareScopeMap){__webpack_require__.federation.attachShareScopeMap(__webpack_require__)}override(__webpack_require__.f,\"remotes\",(chunkId,promises)=>__webpack_require__.federation.bundlerRuntime.remotes({chunkId,promises,chunkMapping:remotesLoadingChunkMapping,idToExternalAndNameMapping:__webpack_require__.federation.bundlerRuntimeOptions.remotes.idToExternalAndNameMapping,idToRemoteMap:__webpack_require__.federation.bundlerRuntimeOptions.remotes.idToRemoteMap,webpackRequire:__webpack_require__}));override(__webpack_require__.f,\"consumes\",(chunkId,promises)=>__webpack_require__.federation.bundlerRuntime.consumes({chunkId,promises,chunkMapping:consumesLoadingChunkMapping,moduleToHandlerMapping:__webpack_require__.federation.consumesLoadingModuleToHandlerMapping,installedModules:consumesLoadinginstalledModules,webpackRequire:__webpack_require__}));override(__webpack_require__,\"I\",(name,initScope)=>__webpack_require__.federation.bundlerRuntime.I({shareScopeName:name,initScope,initPromises:initializeSharingInitPromises,initTokens:initializeSharingInitTokens,webpackRequire:__webpack_require__}));override(__webpack_require__,\"initContainer\",(shareScope,initScope,remoteEntryInitOptions)=>__webpack_require__.federation.bundlerRuntime.initContainerEntry({shareScope,initScope,remoteEntryInitOptions,shareScopeKey:containerShareScope,webpackRequire:__webpack_require__}));override(__webpack_require__,\"getContainer\",(module1,getScope)=>{var moduleMap=__webpack_require__.initializeExposesData.moduleMap;__webpack_require__.R=getScope;getScope=Object.prototype.hasOwnProperty.call(moduleMap,module1)?moduleMap[module1]():Promise.resolve().then(()=>{throw new Error('Module \"'+module1+'\" does not exist in container.')});__webpack_require__.R=undefined;return getScope});__webpack_require__.federation.instance=__webpack_require__.federation.runtime.init(__webpack_require__.federation.initOptions);if((__webpack_require___consumesLoadingData2=__webpack_require__.consumesLoadingData)===null||__webpack_require___consumesLoadingData2===void 0?void 0:__webpack_require___consumesLoadingData2.initialConsumes){__webpack_require__.federation.bundlerRuntime.installInitialConsumes({webpackRequire:__webpack_require__,installedModules:consumesLoadinginstalledModules,initialConsumes:__webpack_require__.consumesLoadingData.initialConsumes,moduleToHandlerMapping:__webpack_require__.federation.consumesLoadingModuleToHandlerMapping})}}")
	}
	if (typeof prevStartup === 'function') {
		return prevStartup();
	} else {
		console.warn('[MF] Invalid prevStartup');
	}
};
})();
// webpack/runtime/ensure_chunk
(() => {
__webpack_require__.f = {};
// This file contains only the entry chunk.
// The chunk loading function for additional chunks
__webpack_require__.e = (chunkId) => {
	return Promise.all(
		Object.keys(__webpack_require__.f).reduce((promises, key) => {
			__webpack_require__.f[key](chunkId, promises);
			return promises;
		}, [])
	);
};
})();
// webpack/runtime/get javascript chunk filename
(() => {
// This function allow to reference chunks
__webpack_require__.u = (chunkId) => {
  // return url for filenames not based on template
  
  // return url for filenames based on template
  return "" + chunkId + ".js"
}
})();
// webpack/runtime/get_chunk_update_filename
(() => {
__webpack_require__.hu = (chunkId) => ('' + chunkId + '.' + __webpack_require__.h() + '.hot-update.js')
})();
// webpack/runtime/get_full_hash
(() => {
__webpack_require__.h = () => ("b252ff320b1fdc67")
})();
// webpack/runtime/get_main_filename/update manifest
(() => {
__webpack_require__.hmrF = function () {
            return "near-intents_debridge-data-provider." + __webpack_require__.h() + ".hot-update.json";
         };
        
})();
// webpack/runtime/has_own_property
(() => {
__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
})();
// webpack/runtime/hot_module_replacement
(() => {
var currentModuleData = {};
var installedModules = __webpack_require__.c;

// module and require creation
var currentChildModule;
var currentParents = [];

// status
var registeredStatusHandlers = [];
var currentStatus = "idle";

// while downloading
var blockingPromises = 0;
var blockingPromisesWaiting = [];

// The update info
var currentUpdateApplyHandlers;
var queuedInvalidatedModules;

__webpack_require__.hmrD = currentModuleData;
__webpack_require__.i.push(function (options) {
	var module = options.module;
	var require = createRequire(options.require, options.id);
	module.hot = createModuleHotObject(options.id, module);
	module.parents = currentParents;
	module.children = [];
	currentParents = [];
	options.require = require;
});

__webpack_require__.hmrC = {};
__webpack_require__.hmrI = {};

function createRequire(require, moduleId) {
	var me = installedModules[moduleId];
	if (!me) return require;
	var fn = function (request) {
		if (me.hot.active) {
			if (installedModules[request]) {
				var parents = installedModules[request].parents;
				if (parents.indexOf(moduleId) === -1) {
					parents.push(moduleId);
				}
			} else {
				currentParents = [moduleId];
				currentChildModule = request;
			}
			if (me.children.indexOf(request) === -1) {
				me.children.push(request);
			}
		} else {
			console.warn(
				"[HMR] unexpected require(" +
				request +
				") from disposed module " +
				moduleId
			);
			currentParents = [];
		}
		return require(request);
	};
	var createPropertyDescriptor = function (name) {
		return {
			configurable: true,
			enumerable: true,
			get: function () {
				return require[name];
			},
			set: function (value) {
				require[name] = value;
			}
		};
	};
	for (var name in require) {
		if (Object.prototype.hasOwnProperty.call(require, name) && name !== "e") {
			Object.defineProperty(fn, name, createPropertyDescriptor(name));
		}
	}

	fn.e = function (chunkId, fetchPriority) {
		return trackBlockingPromise(require.e(chunkId, fetchPriority));
	};

	return fn;
}

function createModuleHotObject(moduleId, me) {
	var _main = currentChildModule !== moduleId;
	var hot = {
		_acceptedDependencies: {},
		_acceptedErrorHandlers: {},
		_declinedDependencies: {},
		_selfAccepted: false,
		_selfDeclined: false,
		_selfInvalidated: false,
		_disposeHandlers: [],
		_main: _main,
		_requireSelf: function () {
			currentParents = me.parents.slice();
			currentChildModule = _main ? undefined : moduleId;
			__webpack_require__(moduleId);
		},
		active: true,
		accept: function (dep, callback, errorHandler) {
			if (dep === undefined) hot._selfAccepted = true;
			else if (typeof dep === "function") hot._selfAccepted = dep;
			else if (typeof dep === "object" && dep !== null) {
				for (var i = 0; i < dep.length; i++) {
					hot._acceptedDependencies[dep[i]] = callback || function () { };
					hot._acceptedErrorHandlers[dep[i]] = errorHandler;
				}
			} else {
				hot._acceptedDependencies[dep] = callback || function () { };
				hot._acceptedErrorHandlers[dep] = errorHandler;
			}
		},
		decline: function (dep) {
			if (dep === undefined) hot._selfDeclined = true;
			else if (typeof dep === "object" && dep !== null)
				for (var i = 0; i < dep.length; i++)
					hot._declinedDependencies[dep[i]] = true;
			else hot._declinedDependencies[dep] = true;
		},
		dispose: function (callback) {
			hot._disposeHandlers.push(callback);
		},
		addDisposeHandler: function (callback) {
			hot._disposeHandlers.push(callback);
		},
		removeDisposeHandler: function (callback) {
			var idx = hot._disposeHandlers.indexOf(callback);
			if (idx >= 0) hot._disposeHandlers.splice(idx, 1);
		},
		invalidate: function () {
			this._selfInvalidated = true;
			switch (currentStatus) {
				case "idle":
					currentUpdateApplyHandlers = [];
					Object.keys(__webpack_require__.hmrI).forEach(function (key) {
						__webpack_require__.hmrI[key](moduleId, currentUpdateApplyHandlers);
					});
					setStatus("ready");
					break;
				case "ready":
					Object.keys(__webpack_require__.hmrI).forEach(function (key) {
						__webpack_require__.hmrI[key](moduleId, currentUpdateApplyHandlers);
					});
					break;
				case "prepare":
				case "check":
				case "dispose":
				case "apply":
					(queuedInvalidatedModules = queuedInvalidatedModules || []).push(
						moduleId
					);
					break;
				default:
					break;
			}
		},
		check: hotCheck,
		apply: hotApply,
		status: function (l) {
			if (!l) return currentStatus;
			registeredStatusHandlers.push(l);
		},
		addStatusHandler: function (l) {
			registeredStatusHandlers.push(l);
		},
		removeStatusHandler: function (l) {
			var idx = registeredStatusHandlers.indexOf(l);
			if (idx >= 0) registeredStatusHandlers.splice(idx, 1);
		},
		data: currentModuleData[moduleId]
	};
	currentChildModule = undefined;
	return hot;
}

function setStatus(newStatus) {
	currentStatus = newStatus; 
	var results = [];
	for (var i = 0; i < registeredStatusHandlers.length; i++)
		results[i] = registeredStatusHandlers[i].call(null, newStatus);

	return Promise.all(results).then(function () { });
}

function unblock() {
	if (--blockingPromises === 0) {
		setStatus("ready").then(function () {
			if (blockingPromises === 0) {
				var list = blockingPromisesWaiting;
				blockingPromisesWaiting = [];
				for (var i = 0; i < list.length; i++) {
					list[i]();
				}
			}
		});
	}
}

function trackBlockingPromise(promise) {
	switch (currentStatus) {
		case "ready":
			setStatus("prepare");
		case "prepare":
			blockingPromises++;
			promise.then(unblock, unblock);
			return promise;
		default:
			return promise;
	}
}

function waitForBlockingPromises(fn) {
	if (blockingPromises === 0) return fn();
	return new Promise(function (resolve) {
		blockingPromisesWaiting.push(function () {
			resolve(fn());
		});
	});
}

function hotCheck(applyOnUpdate) {
	if (currentStatus !== "idle") {
		throw new Error("check() is only allowed in idle status");
	} 
	return setStatus("check")
		.then(__webpack_require__.hmrM)
		.then(function (update) {
			if (!update) {
				return setStatus(applyInvalidatedModules() ? "ready" : "idle").then(
					function () {
						return null;
					}
				);
			}

			return setStatus("prepare").then(function () {
				var updatedModules = [];
				currentUpdateApplyHandlers = [];

				return Promise.all(
					Object.keys(__webpack_require__.hmrC).reduce(function (
						promises,
						key
					) {
						__webpack_require__.hmrC[key](
							update.c,
							update.r,
							update.m,
							promises,
							currentUpdateApplyHandlers,
							updatedModules
						);
						return promises;
					},
						[])
				).then(function () {
					return waitForBlockingPromises(function () {
						if (applyOnUpdate) {
							return internalApply(applyOnUpdate);
						}
						return setStatus("ready").then(function () {
							return updatedModules;
						});
					});
				});
			});
		});
}

function hotApply(options) {
	if (currentStatus !== "ready") {
		return Promise.resolve().then(function () {
			throw new Error(
				"apply() is only allowed in ready status (state: " + currentStatus + ")"
			);
		});
	}
	return internalApply(options);
}

function internalApply(options) {
	options = options || {};
	applyInvalidatedModules();
	var results = currentUpdateApplyHandlers.map(function (handler) {
		return handler(options);
	});
	currentUpdateApplyHandlers = undefined;
	var errors = results
		.map(function (r) {
			return r.error;
		})
		.filter(Boolean);

	if (errors.length > 0) {
		return setStatus("abort").then(function () {
			throw errors[0];
		});
	}

	var disposePromise = setStatus("dispose");

	results.forEach(function (result) {
		if (result.dispose) result.dispose();
	});

	var applyPromise = setStatus("apply");

	var error;
	var reportError = function (err) {
		if (!error) error = err;
	};

	var outdatedModules = [];
	results.forEach(function (result) {
		if (result.apply) {
			var modules = result.apply(reportError);
			if (modules) {
				for (var i = 0; i < modules.length; i++) {
					outdatedModules.push(modules[i]);
				}
			}
		}
	});

	return Promise.all([disposePromise, applyPromise]).then(function () {
		if (error) {
			return setStatus("fail").then(function () {
				throw error;
			});
		}

		if (queuedInvalidatedModules) {
			return internalApply(options).then(function (list) {
				outdatedModules.forEach(function (moduleId) {
					if (list.indexOf(moduleId) < 0) list.push(moduleId);
				});
				return list;
			});
		}

		return setStatus("idle").then(function () {
			return outdatedModules;
		});
	});
}

function applyInvalidatedModules() {
	if (queuedInvalidatedModules) {
		if (!currentUpdateApplyHandlers) currentUpdateApplyHandlers = [];
		Object.keys(__webpack_require__.hmrI).forEach(function (key) {
			queuedInvalidatedModules.forEach(function (moduleId) {
				__webpack_require__.hmrI[key](moduleId, currentUpdateApplyHandlers);
			});
		});
		queuedInvalidatedModules = undefined;
		return true;
	}
}

})();
// webpack/runtime/make_namespace_object
(() => {
// define __esModule on exports
__webpack_require__.r = (exports) => {
	if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
	}
	Object.defineProperty(exports, '__esModule', { value: true });
};
})();
// webpack/runtime/sharing
(() => {

__webpack_require__.S = {};
__webpack_require__.initializeSharingData = { scopeToSharingDataMapping: { "default": [{ name: "@orpc/contract", version: "^1.10.0", factory: () => (Promise.all([__webpack_require__.e("vendors-node_modules_bun_orpc_client_1_10_4_node_modules_orpc_client_dist_shared_client_DmkMd-ec2cea"), __webpack_require__.e("vendors-node_modules_bun_orpc_contract_1_10_4_node_modules_orpc_contract_dist_index_mjs")]).then(() => (() => (__webpack_require__(/*! ../../node_modules/.bun/@orpc+contract@1.10.4/node_modules/@orpc/contract/dist/index.mjs */ "../../node_modules/.bun/@orpc+contract@1.10.4/node_modules/@orpc/contract/dist/index.mjs"))))), eager: 0, singleton: 1, requiredVersion: "^1.10.0", strictVersion: 0 }, { name: "@orpc/server", version: "^1.10.0", factory: () => (Promise.all([__webpack_require__.e("vendors-node_modules_bun_orpc_client_1_10_4_node_modules_orpc_client_dist_shared_client_DmkMd-ec2cea"), __webpack_require__.e("vendors-node_modules_bun_orpc_server_1_10_4_node_modules_orpc_server_dist_index_mjs"), __webpack_require__.e("webpack_sharing_consume_default_orpc_contract_orpc_contract")]).then(() => (() => (__webpack_require__(/*! ../../node_modules/.bun/@orpc+server@1.10.4/node_modules/@orpc/server/dist/index.mjs */ "../../node_modules/.bun/@orpc+server@1.10.4/node_modules/@orpc/server/dist/index.mjs"))))), eager: 0, singleton: 1, requiredVersion: "^1.10.0", strictVersion: 0 }, { name: "effect", version: "3.18.1", factory: () => (__webpack_require__.e("vendors-node_modules_bun_effect_3_18_1_node_modules_effect_dist_esm_index_js").then(() => (() => (__webpack_require__(/*! ../../node_modules/.bun/effect@3.18.1/node_modules/effect/dist/esm/index.js */ "../../node_modules/.bun/effect@3.18.1/node_modules/effect/dist/esm/index.js"))))), eager: 0, singleton: 1, requiredVersion: "3.18.1", strictVersion: 0 }, { name: "every-plugin", version: "0.4.10", factory: () => (Promise.all([__webpack_require__.e("vendors-node_modules_bun_every-plugin_0_4_10_914b6fe990853d82_node_modules_every-plugin_dist_-96ac2b"), __webpack_require__.e("webpack_sharing_consume_default_orpc_contract_orpc_contract"), __webpack_require__.e("webpack_sharing_consume_default_orpc_server_orpc_server-webpack_sharing_consume_default_effec-593267"), __webpack_require__.e("node_modules_bun_every-plugin_0_4_10_914b6fe990853d82_node_modules_every-plugin_dist_zod-BVo5-58ee39")]).then(() => (() => (__webpack_require__(/*! ../../node_modules/.bun/every-plugin@0.4.10+914b6fe990853d82/node_modules/every-plugin/dist/index.mjs */ "../../node_modules/.bun/every-plugin@0.4.10+914b6fe990853d82/node_modules/every-plugin/dist/index.mjs"))))), eager: 0, singleton: 1, requiredVersion: "0.4.10", strictVersion: 0 }, { name: "zod", version: "4.1.5", factory: () => (__webpack_require__.e("vendors-node_modules_bun_zod_4_1_5_node_modules_zod_index_js").then(() => (() => (__webpack_require__(/*! ../../node_modules/.bun/zod@4.1.5/node_modules/zod/index.js */ "../../node_modules/.bun/zod@4.1.5/node_modules/zod/index.js"))))), eager: 0, singleton: 1, requiredVersion: "4.1.5", strictVersion: 0 }] }, uniqueName: "near-intents_debridge-data-provider" };
__webpack_require__.I = __webpack_require__.I || function() { throw new Error("should have __webpack_require__.I") }

})();
// webpack/runtime/consumes_loading
(() => {

__webpack_require__.consumesLoadingData = { chunkMapping: {"src_index_ts":["webpack/sharing/consume/default/every-plugin/every-plugin"],"webpack_sharing_consume_default_orpc_server_orpc_server-webpack_sharing_consume_default_effec-593267":["webpack/sharing/consume/default/zod/zod","webpack/sharing/consume/default/effect/effect","webpack/sharing/consume/default/@orpc/server/@orpc/server"],"webpack_sharing_consume_default_orpc_contract_orpc_contract":["webpack/sharing/consume/default/@orpc/contract/@orpc/contract"]}, moduleIdToConsumeDataMapping: {"webpack/sharing/consume/default/@orpc/server/@orpc/server": { shareScope: "default", shareKey: "@orpc/server", import: "@orpc/server", requiredVersion: "^1.10.0", strictVersion: false, singleton: true, eager: false, fallback: () => (Promise.all([__webpack_require__.e("vendors-node_modules_bun_orpc_client_1_10_4_node_modules_orpc_client_dist_shared_client_DmkMd-ec2cea"), __webpack_require__.e("vendors-node_modules_bun_orpc_server_1_10_4_node_modules_orpc_server_dist_index_mjs")]).then(() => (() => (__webpack_require__(/*! @orpc/server */ "../../node_modules/.bun/@orpc+server@1.10.4/node_modules/@orpc/server/dist/index.mjs"))))) }, "webpack/sharing/consume/default/effect/effect": { shareScope: "default", shareKey: "effect", import: "effect", requiredVersion: "3.18.1", strictVersion: false, singleton: true, eager: false, fallback: () => (__webpack_require__.e("vendors-node_modules_bun_effect_3_18_1_node_modules_effect_dist_esm_index_js").then(() => (() => (__webpack_require__(/*! effect */ "../../node_modules/.bun/effect@3.18.1/node_modules/effect/dist/esm/index.js"))))) }, "webpack/sharing/consume/default/every-plugin/every-plugin": { shareScope: "default", shareKey: "every-plugin", import: "every-plugin", requiredVersion: "0.4.10", strictVersion: false, singleton: true, eager: false, fallback: () => (__webpack_require__.e("vendors-node_modules_bun_every-plugin_0_4_10_914b6fe990853d82_node_modules_every-plugin_dist_-96ac2b").then(() => (() => (__webpack_require__(/*! every-plugin */ "../../node_modules/.bun/every-plugin@0.4.10+914b6fe990853d82/node_modules/every-plugin/dist/index.mjs"))))) }, "webpack/sharing/consume/default/@orpc/contract/@orpc/contract": { shareScope: "default", shareKey: "@orpc/contract", import: "@orpc/contract", requiredVersion: "^1.10.0", strictVersion: false, singleton: true, eager: false, fallback: () => (Promise.all([__webpack_require__.e("vendors-node_modules_bun_orpc_client_1_10_4_node_modules_orpc_client_dist_shared_client_DmkMd-ec2cea"), __webpack_require__.e("vendors-node_modules_bun_orpc_contract_1_10_4_node_modules_orpc_contract_dist_index_mjs")]).then(() => (() => (__webpack_require__(/*! @orpc/contract */ "../../node_modules/.bun/@orpc+contract@1.10.4/node_modules/@orpc/contract/dist/index.mjs"))))) }, "webpack/sharing/consume/default/zod/zod": { shareScope: "default", shareKey: "zod", import: "zod", requiredVersion: "4.1.5", strictVersion: false, singleton: true, eager: false, fallback: () => (__webpack_require__.e("vendors-node_modules_bun_zod_4_1_5_node_modules_zod_index_js").then(() => (() => (__webpack_require__(/*! zod */ "../../node_modules/.bun/zod@4.1.5/node_modules/zod/index.js"))))) }}, initialConsumes: [] };
__webpack_require__.f.consumes = __webpack_require__.f.consumes || function() { throw new Error("should have __webpack_require__.f.consumes") }
})();
// webpack/runtime/initialize_exposes
(() => {

__webpack_require__.initializeExposesData = {
  moduleMap: {
  "./plugin": () => {
return Promise.all([__webpack_require__.e("vendors-node_modules_bun_orpc_client_1_10_4_node_modules_orpc_client_dist_shared_client_DmkMd-ec2cea"), __webpack_require__.e("vendors-node_modules_bun_bottleneck_2_19_5_node_modules_bottleneck_lib_index_js-node_modules_-c3cd55"), __webpack_require__.e("webpack_sharing_consume_default_orpc_contract_orpc_contract"), __webpack_require__.e("webpack_sharing_consume_default_orpc_server_orpc_server-webpack_sharing_consume_default_effec-593267"), __webpack_require__.e("src_index_ts")]).then(() => (() => (__webpack_require__(/*! ./src/index.ts */ "./src/index.ts"))));
},
},
  shareScope: "default",
};
__webpack_require__.getContainer = __webpack_require__.getContainer || function() { throw new Error("should have __webpack_require__.getContainer") };__webpack_require__.initContainer = __webpack_require__.initContainer || function() { throw new Error("should have __webpack_require__.initContainer") };
})();
// webpack/runtime/readfile_chunk_loading
(() => {
var installedChunks = __webpack_require__.hmrS_readFileVm = __webpack_require__.hmrS_readFileVm || {"near-intents_debridge-data-provider": 0,};
var installChunk = (chunk) => {
  var moreModules = chunk.modules, chunkIds = chunk.ids,
    runtime = chunk.runtime;
  for (var moduleId in moreModules) {
    if (__webpack_require__.o(moreModules, moduleId)) {
      __webpack_require__.m[moduleId] = moreModules[moduleId];
    }
  }
  if (runtime) runtime(__webpack_require__ );
  for (var i = 0; i < chunkIds.length; i++) {
    if (installedChunks[chunkIds[i]]) {
      installedChunks[chunkIds[i]][0]();
    }
    installedChunks[chunkIds[i]] = 0;
  }
  
};
        // ReadFile + VM.run chunk loading for javascript"
        __webpack_require__.f.readFileVm = function (chunkId, promises) {
          var installedChunkData = installedChunks[chunkId];
if (installedChunkData !== 0) {  // 0 means "already installed".
  // array of [resolve, reject, promise] means "currently loading"
  if (installedChunkData) {
    promises.push(installedChunkData[2]);
  } else {
    if (!/^webpack_sharing_consume_default_orpc_(contract_orpc_contract|server_orpc_server\-webpack_sharing_consume_default_effec\-593267)$/.test(chunkId)) {  // all chunks have JS
      // load the chunk and return promise to it
      var promise = new Promise(function (resolve, reject) {
        installedChunkData = installedChunks[chunkId] = [resolve, reject];
        var filename = require('path').join(
          __dirname, "" + __webpack_require__.u(chunkId));
        require('fs').readFile(filename, 'utf-8', function (err, content) {
          if (err) return reject(err);
          var chunk = {};
          require('vm').runInThisContext(
            '(function(exports, require, __dirname, __filename) {' +
            content + '\n})',
            filename)(
              chunk, require, require('path').dirname(filename), filename);
          installChunk(chunk);
        });
      });
      promises.push(installedChunkData[2] = promise);
    } else installedChunks[chunkId] = 0;

  }
}
        };
        function loadUpdateChunk(chunkId, updatedModulesList) {
	return new Promise(function(resolve, reject) {
		var filename = require('path').join(__dirname, "" + __webpack_require__.hu(chunkId));
		require('fs').readFile(filename, 'utf-8', function(err, content) {
			if(err) return reject(err);
			var update = {};
			require('vm').runInThisContext('(function(exports, require, __dirname, __filename) {' + content + '\n})', filename)(update, require, require('path').dirname(filename), filename);
			var updatedModules = update.modules;
			var runtime = update.runtime;
			for(var moduleId in updatedModules) {
				if(__webpack_require__.o(updatedModules, moduleId)) {
					currentUpdate[moduleId] = updatedModules[moduleId];
					if(updatedModulesList) updatedModulesList.push(moduleId);
				}
			}
			if(runtime) currentUpdateRuntime.push(runtime);
			resolve();
		});
	});
}var currentUpdateChunks;
var currentUpdate;
var currentUpdateRemovedChunks;
var currentUpdateRuntime;
function applyHandler(options) {
	if (__webpack_require__.f) delete __webpack_require__.f.readFileVmHmr;
	currentUpdateChunks = undefined;
	function getAffectedModuleEffects(updateModuleId) {
		var outdatedModules = [updateModuleId];
		var outdatedDependencies = {};
		var queue = outdatedModules.map(function (id) {
			return {
				chain: [id],
				id: id
			};
		});
		while (queue.length > 0) {
			var queueItem = queue.pop();
			var moduleId = queueItem.id;
			var chain = queueItem.chain;
			var module = __webpack_require__.c[moduleId];
			if (
				!module ||
				(module.hot._selfAccepted && !module.hot._selfInvalidated)
			) {
				continue;
			}

			if (module.hot._selfDeclined) {
				return {
					type: "self-declined",
					chain: chain,
					moduleId: moduleId
				};
			}

			if (module.hot._main) {
				return {
					type: "unaccepted",
					chain: chain,
					moduleId: moduleId
				};
			}

			for (var i = 0; i < module.parents.length; i++) {
				var parentId = module.parents[i];
				var parent = __webpack_require__.c[parentId];
				if (!parent) {
					continue;
				}
				if (parent.hot._declinedDependencies[moduleId]) {
					return {
						type: "declined",
						chain: chain.concat([parentId]),
						moduleId: moduleId,
						parentId: parentId
					};
				}
				if (outdatedModules.indexOf(parentId) !== -1) {
					continue;
				}
				if (parent.hot._acceptedDependencies[moduleId]) {
					if (!outdatedDependencies[parentId]) {
						outdatedDependencies[parentId] = [];
					}
					addAllToSet(outdatedDependencies[parentId], [moduleId]);
					continue;
				}
				delete outdatedDependencies[parentId];
				outdatedModules.push(parentId);
				queue.push({
					chain: chain.concat([parentId]),
					id: parentId
				});
			}
		}

		return {
			type: "accepted",
			moduleId: updateModuleId,
			outdatedModules: outdatedModules,
			outdatedDependencies: outdatedDependencies
		};
	}

	function addAllToSet(a, b) {
		for (var i = 0; i < b.length; i++) {
			var item = b[i];
			if (a.indexOf(item) === -1) a.push(item);
		}
	}

	var outdatedDependencies = {};
	var outdatedModules = [];
	var appliedUpdate = {};

	var warnUnexpectedRequire = function warnUnexpectedRequire(module) {
		console.warn(
			"[HMR] unexpected require(" + module.id + ") to disposed module"
		);
		throw Error("RuntimeError: factory is undefined(" + module.id + ")");
	};

	for (var moduleId in currentUpdate) {
		if (__webpack_require__.o(currentUpdate, moduleId)) {
			var newModuleFactory = currentUpdate[moduleId];
			var result = newModuleFactory ? getAffectedModuleEffects(moduleId) : {
				type: "disposed",
				moduleId: moduleId
			};
			var abortError = false;
			var doApply = false;
			var doDispose = false;
			var chainInfo = "";
			if (result.chain) {
				chainInfo = "\nUpdate propagation: " + result.chain.join(" -> ");
			}
			switch (result.type) {
				case "self-declined":
					if (options.onDeclined) options.onDeclined(result);
					if (!options.ignoreDeclined)
						abortError = new Error(
							"Aborted because of self decline: " + result.moduleId + chainInfo
						);
					break;
				case "declined":
					if (options.onDeclined) options.onDeclined(result);
					if (!options.ignoreDeclined)
						abortError = new Error(
							"Aborted because of declined dependency: " +
							result.moduleId +
							" in " +
							result.parentId +
							chainInfo
						);
					break;
				case "unaccepted":
					if (options.onUnaccepted) options.onUnaccepted(result);
					if (!options.ignoreUnaccepted)
						abortError = new Error(
							"Aborted because " + moduleId + " is not accepted" + chainInfo
						);
					break;
				case "accepted":
					if (options.onAccepted) options.onAccepted(result);
					doApply = true;
					break;
				case "disposed":
					if (options.onDisposed) options.onDisposed(result);
					doDispose = true;
					break;
				default:
					throw new Error("Unexception type " + result.type);
			}
			if (abortError) {
				return {
					error: abortError
				};
			}
			if (doApply) {
				appliedUpdate[moduleId] = newModuleFactory;
				addAllToSet(outdatedModules, result.outdatedModules);
				for (moduleId in result.outdatedDependencies) {
					if (__webpack_require__.o(result.outdatedDependencies, moduleId)) {
						if (!outdatedDependencies[moduleId])
							outdatedDependencies[moduleId] = [];
						addAllToSet(
							outdatedDependencies[moduleId],
							result.outdatedDependencies[moduleId]
						);
					}
				}
			}
			if (doDispose) {
				addAllToSet(outdatedModules, [result.moduleId]);
				appliedUpdate[moduleId] = warnUnexpectedRequire;
			}
		}
	}
	currentUpdate = undefined;

	var outdatedSelfAcceptedModules = [];
	for (var j = 0; j < outdatedModules.length; j++) {
		var outdatedModuleId = outdatedModules[j];
		var module = __webpack_require__.c[outdatedModuleId];
		if (
			module &&
			(module.hot._selfAccepted || module.hot._main) &&
			// removed self-accepted modules should not be required
			appliedUpdate[outdatedModuleId] !== warnUnexpectedRequire &&
			// when called invalidate self-accepting is not possible
			!module.hot._selfInvalidated
		) {
			outdatedSelfAcceptedModules.push({
				module: outdatedModuleId,
				require: module.hot._requireSelf,
				errorHandler: module.hot._selfAccepted
			});
		}
	} 

	var moduleOutdatedDependencies;
	return {
		dispose: function () {
			currentUpdateRemovedChunks.forEach(function (chunkId) {
				delete installedChunks[chunkId];
			});
			currentUpdateRemovedChunks = undefined;

			var idx;
			var queue = outdatedModules.slice();
			while (queue.length > 0) {
				var moduleId = queue.pop();
				var module = __webpack_require__.c[moduleId];
				if (!module) continue;

				var data = {};

				// Call dispose handlers
				var disposeHandlers = module.hot._disposeHandlers; 
				for (j = 0; j < disposeHandlers.length; j++) {
					disposeHandlers[j].call(null, data);
				}
				__webpack_require__.hmrD[moduleId] = data;

				module.hot.active = false;

				delete __webpack_require__.c[moduleId];

				delete outdatedDependencies[moduleId];

				for (j = 0; j < module.children.length; j++) {
					var child = __webpack_require__.c[module.children[j]];
					if (!child) continue;
					idx = child.parents.indexOf(moduleId);
					if (idx >= 0) {
						child.parents.splice(idx, 1);
					}
				}
			}

			var dependency;
			for (var outdatedModuleId in outdatedDependencies) {
				if (__webpack_require__.o(outdatedDependencies, outdatedModuleId)) {
					module = __webpack_require__.c[outdatedModuleId];
					if (module) {
						moduleOutdatedDependencies = outdatedDependencies[outdatedModuleId];
						for (j = 0; j < moduleOutdatedDependencies.length; j++) {
							dependency = moduleOutdatedDependencies[j];
							idx = module.children.indexOf(dependency);
							if (idx >= 0) module.children.splice(idx, 1);
						}
					}
				}
			}
		},
		apply: function (reportError) {
			// insert new code
			for (var updateModuleId in appliedUpdate) {
				if (__webpack_require__.o(appliedUpdate, updateModuleId)) {
					__webpack_require__.m[updateModuleId] = appliedUpdate[updateModuleId]; 
				}
			}

			// run new runtime modules
			for (var i = 0; i < currentUpdateRuntime.length; i++) {
				currentUpdateRuntime[i](__webpack_require__);
			}

			// call accept handlers
			for (var outdatedModuleId in outdatedDependencies) {
				if (__webpack_require__.o(outdatedDependencies, outdatedModuleId)) {
					var module = __webpack_require__.c[outdatedModuleId];
					if (module) {
						moduleOutdatedDependencies = outdatedDependencies[outdatedModuleId];
						var callbacks = [];
						var errorHandlers = [];
						var dependenciesForCallbacks = [];
						for (var j = 0; j < moduleOutdatedDependencies.length; j++) {
							var dependency = moduleOutdatedDependencies[j];
							var acceptCallback = module.hot._acceptedDependencies[dependency];
							var errorHandler = module.hot._acceptedErrorHandlers[dependency];
							if (acceptCallback) {
								if (callbacks.indexOf(acceptCallback) !== -1) continue;
								callbacks.push(acceptCallback);
								errorHandlers.push(errorHandler); 
								dependenciesForCallbacks.push(dependency);
							}
						}
						for (var k = 0; k < callbacks.length; k++) {
							try {
								callbacks[k].call(null, moduleOutdatedDependencies);
							} catch (err) {
								if (typeof errorHandlers[k] === "function") {
									try {
										errorHandlers[k](err, {
											moduleId: outdatedModuleId,
											dependencyId: dependenciesForCallbacks[k]
										});
									} catch (err2) {
										if (options.onErrored) {
											options.onErrored({
												type: "accept-error-handler-errored",
												moduleId: outdatedModuleId,
												dependencyId: dependenciesForCallbacks[k],
												error: err2,
												originalError: err
											});
										}
										if (!options.ignoreErrored) {
											reportError(err2);
											reportError(err);
										}
									}
								} else {
									if (options.onErrored) {
										options.onErrored({
											type: "accept-errored",
											moduleId: outdatedModuleId,
											dependencyId: dependenciesForCallbacks[k],
											error: err
										});
									}
									if (!options.ignoreErrored) {
										reportError(err);
									}
								}
							}
						}
					}
				}
			}

			// Load self accepted modules
			for (var o = 0; o < outdatedSelfAcceptedModules.length; o++) {
				var item = outdatedSelfAcceptedModules[o];
				var moduleId = item.module;
				try {
					item.require(moduleId);
				} catch (err) {
					if (typeof item.errorHandler === "function") {
						try {
							item.errorHandler(err, {
								moduleId: moduleId,
								module: __webpack_require__.c[moduleId]
							});
						} catch (err1) {
							if (options.onErrored) {
								options.onErrored({
									type: "self-accept-error-handler-errored",
									moduleId: moduleId,
									error: err1,
									originalError: err
								});
							}
							if (!options.ignoreErrored) {
								reportError(err1);
								reportError(err);
							}
						}
					} else {
						if (options.onErrored) {
							options.onErrored({
								type: "self-accept-errored",
								moduleId: moduleId,
								error: err
							});
						}
						if (!options.ignoreErrored) {
							reportError(err);
						}
					}
				}
			}

			return outdatedModules;
		}
	};
}

__webpack_require__.hmrI.readFileVm = function (moduleId, applyHandlers) {
	if (!currentUpdate) {
		currentUpdate = {};
		currentUpdateRuntime = [];
		currentUpdateRemovedChunks = [];
		applyHandlers.push(applyHandler);
	}
	if (!__webpack_require__.o(currentUpdate, moduleId)) {
		currentUpdate[moduleId] = __webpack_require__.m[moduleId];
	}
};

__webpack_require__.hmrC.readFileVm = function (
	chunkIds,
	removedChunks,
	removedModules,
	promises,
	applyHandlers,
	updatedModulesList
) {
	applyHandlers.push(applyHandler);
	currentUpdateChunks = {};
	currentUpdateRemovedChunks = removedChunks;
	currentUpdate = removedModules.reduce(function (obj, key) {
		obj[key] = false;
		return obj;
	}, {});
	currentUpdateRuntime = [];
	chunkIds.forEach(function (chunkId) {
		if (
			__webpack_require__.o(installedChunks, chunkId) &&
			installedChunks[chunkId] !== undefined
		) {
			promises.push(loadUpdateChunk(chunkId, updatedModulesList));
			currentUpdateChunks[chunkId] = true;
		} else {
			currentUpdateChunks[chunkId] = false;
		}
	});
	if (__webpack_require__.f) {
		__webpack_require__.f.readFileVmHmr = function (chunkId, promises) {
			if (
				currentUpdateChunks &&
				__webpack_require__.o(currentUpdateChunks, chunkId) &&
				!currentUpdateChunks[chunkId]
			) {
				promises.push(loadUpdateChunk(chunkId));
				currentUpdateChunks[chunkId] = true;
			}
		};
	}
};
__webpack_require__.hmrM = () => {
	return new Promise((resolve, reject) => {
		var filename = require('path').join(__dirname, "" + __webpack_require__.hmrF());
		require('fs').readFile(filename, 'utf-8', (err, content) => {
			if (err) {
				if (err.code === "ENOENT") return resolve();
				return reject(err);
			}
			try { resolve(JSON.parse(content)); }
			catch (e) { reject(e); }
		});
	});
}
})();
/************************************************************************/
// module cache are used so entry inlining is disabled
// run startup
var __webpack_exports__ = __webpack_require__.x();
module.exports = __webpack_exports__;
})()
;
//# sourceMappingURL=remoteEntry.js.map