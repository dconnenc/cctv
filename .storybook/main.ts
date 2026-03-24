import type { StorybookConfig } from '@storybook/react-vite';
import type { Plugin } from 'vite';

const isRubyPlugin = (p: unknown): boolean => {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return false;
  return (p as Plugin).name?.startsWith('vite-plugin-ruby') ?? false;
};

const config: StorybookConfig = {
  stories: ['../app/frontend/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-interactions'],
  framework: '@storybook/react-vite',
  viteFinal: async (config) => {
    config.plugins = (config.plugins ?? []).flatMap((p) => {
      if (Array.isArray(p)) return (p as Plugin[]).filter((item) => !isRubyPlugin(item));
      return isRubyPlugin(p) ? [] : [p];
    });
    config.base = '/';
    return config;
  },
};
export default config;
