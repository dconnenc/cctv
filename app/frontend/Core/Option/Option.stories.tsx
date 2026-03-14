import type { Meta, StoryObj } from '@storybook/react-vite';

import { Option } from './Option';

const meta: Meta<typeof Option> = {
  title: 'Core/Option',
  component: Option,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Option>;

export const Radio: Story = {
  args: { name: 'color', option: 'Red' },
};

export const Checkbox: Story = {
  args: { name: 'toppings', option: 'Cheese', allowMultiple: true },
};

export const Disabled: Story = {
  args: { name: 'color', option: 'Blue', disabled: true },
};

export const RadioGroup: Story = {
  render: () => (
    <fieldset style={{ border: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Option name="favorite" option="Option A" />
      <Option name="favorite" option="Option B" />
      <Option name="favorite" option="Option C" />
    </fieldset>
  ),
};

export const CheckboxGroup: Story = {
  render: () => (
    <fieldset style={{ border: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Option name="interests" option="Music" allowMultiple />
      <Option name="interests" option="Sports" allowMultiple />
      <Option name="interests" option="Art" allowMultiple />
    </fieldset>
  ),
};
