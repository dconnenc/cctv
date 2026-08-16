import type { StorybookConfig } from '@storybook/react-vite';
import type { PluginOption } from 'vite';

const RUBY_PLUGIN_PREFIX = 'vite-plugin-ruby';

const isRubyPlugin = (plugin: PluginOption): boolean => {
  if (!plugin || Array.isArray(plugin)) return false;
  return 'name' in plugin && plugin.name.startsWith(RUBY_PLUGIN_PREFIX);
};

const config: StorybookConfig = {
  stories: ['../app/frontend/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-interactions'],
  framework: '@storybook/react-vite',
  viteFinal: async (viteConfig) => {
    viteConfig.plugins = (viteConfig.plugins ?? []).flatMap((plugin) => {
      if (Array.isArray(plugin)) return plugin.filter((nested) => !isRubyPlugin(nested));
      return isRubyPlugin(plugin) ? [] : [plugin];
    });
    viteConfig.base = '/';
    return viteConfig;
  },
};
export default config;
