// Minimal shims to satisfy TypeScript when the `every-plugin` catalog package
// is provided via workspace tooling at runtime but not present as an npm package
// in this local dev environment.

declare module "every-plugin";
declare module "every-plugin/*";

// A few named submodules we reference directly in the codebase
declare module "every-plugin/effect" {
  export const Effect: any;
  export default Effect;
}

declare module "every-plugin/zod" {
  import { z } from "zod";
  export { z };
}

declare module "every-plugin/orpc" {
  export const oc: any;
}

declare module "every-plugin/testing" {
  export function createLocalPluginRuntime<T>(...args: any[]): any;
}
