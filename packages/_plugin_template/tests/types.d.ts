import type TemplatePlugin from "@/index";

declare module "every-plugin" {
  interface RegisteredPlugins {
    "template": typeof TemplatePlugin;
  }
}