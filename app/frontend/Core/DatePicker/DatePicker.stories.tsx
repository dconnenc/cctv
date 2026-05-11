import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { DatePicker } from './DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'Core/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof DatePicker>;

function StatefulDatePicker() {
  const [date, setDate] = useState<Date | undefined>();

  return (
    <DatePicker label="Event date" placeholder="Choose a day" date={date} onSelect={setDate} />
  );
}

export const Default: Story = {
  render: () => <StatefulDatePicker />,
};

export const Disabled: Story = {
  args: {
    label: 'Starts on',
    placeholder: 'Unavailable',
    disabled: true,
  },
};
