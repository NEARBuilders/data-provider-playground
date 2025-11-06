import DataProviderTemplatePlugin from "@/index";

declare module "every-plugin" {
  interface RegisteredPlugins {
    "@data-provider/template": typeof DataProviderTemplatePlugin;
  }
}