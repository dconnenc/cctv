import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, Save, Trash2, X } from 'lucide-react';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Core/Button',
  component: Button,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Click me' },
};

export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
};

export const Loading: Story = {
  args: { children: 'Save', loading: true, loadingText: 'Saving...' },
};

export const LoadingNoText: Story = {
  args: { children: 'Submit', loading: true },
};

export const Submit: Story = {
  args: { children: 'Submit', type: 'submit' },
};

const VARIANTS = ['primary', 'secondary', 'outline', 'ghost'] as const;
const SIZES = ['sm', 'default', 'lg'] as const;

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  alignItems: 'center',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.6875rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'hsl(var(--muted-foreground))',
};

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
      <section style={sectionStyle}>
        <span style={labelStyle}>Variants</span>
        <div style={rowStyle}>
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <span style={labelStyle}>Sizes</span>
        {SIZES.map((size) => (
          <div key={size} style={rowStyle}>
            {VARIANTS.map((variant) => (
              <Button key={`${variant}-${size}`} variant={variant} size={size}>
                {`${variant} / ${size}`}
              </Button>
            ))}
          </div>
        ))}
      </section>

      <section style={sectionStyle}>
        <span style={labelStyle}>Disabled</span>
        <div style={rowStyle}>
          {VARIANTS.map((variant) => (
            <Button key={`${variant}-disabled`} variant={variant} disabled>
              {variant}
            </Button>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <span style={labelStyle}>Loading</span>
        <div style={rowStyle}>
          {VARIANTS.map((variant) => (
            <Button key={`${variant}-loading`} variant={variant} loading loadingText="Saving…">
              {variant}
            </Button>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <span style={labelStyle}>HTML type</span>
        <div style={rowStyle}>
          <Button type="button">type="button"</Button>
          <Button type="submit" variant="secondary">
            type="submit"
          </Button>
          <Button type="reset" variant="ghost">
            type="reset"
          </Button>
        </div>
      </section>

      <section style={sectionStyle}>
        <span style={labelStyle}>As Link (to=…)</span>
        <div style={rowStyle}>
          {VARIANTS.map((variant) => (
            <Button key={`${variant}-link`} to="/example" variant={variant}>
              {variant} link
            </Button>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <span style={labelStyle}>Icon + label</span>
        <div style={rowStyle}>
          <Button icon={<Plus size={14} />}>Add block</Button>
          <Button variant="secondary" icon={<Save size={14} />}>
            Save
          </Button>
          <Button variant="outline" icon={<Trash2 size={14} />}>
            Remove
          </Button>
          <Button variant="ghost" icon={<X size={14} />}>
            Cancel
          </Button>
        </div>
      </section>

      <section style={sectionStyle}>
        <span style={labelStyle}>aria-pressed (toggle / segmented control)</span>
        <div style={rowStyle}>
          {VARIANTS.map((variant) => (
            <Button key={`${variant}-pressed`} variant={variant} aria-pressed>
              {variant} pressed
            </Button>
          ))}
        </div>
        <div
          role="group"
          aria-label="Segmented control example"
          style={{
            display: 'inline-flex',
            gap: '0.25rem',
            padding: '0.25rem',
            background: 'hsl(var(--muted))',
            borderRadius: 'var(--radius)',
          }}
        >
          <Button variant="ghost" size="sm" aria-pressed="true">
            Monitor
          </Button>
          <Button variant="ghost" size="sm" aria-pressed="false">
            Participant
          </Button>
          <Button variant="ghost" size="sm" aria-pressed="false">
            Responses
          </Button>
        </div>
      </section>

      <section style={sectionStyle}>
        <span style={labelStyle}>Icon only (hideLabel — label still announced)</span>
        {SIZES.map((size) => (
          <div key={size} style={rowStyle}>
            {VARIANTS.map((variant) => (
              <Button
                key={`${variant}-${size}-icon`}
                variant={variant}
                size={size}
                icon={<X size={size === 'lg' ? 18 : size === 'sm' ? 12 : 14} />}
                hideLabel
              >
                Close
              </Button>
            ))}
          </div>
        ))}
      </section>
    </div>
  ),
};
