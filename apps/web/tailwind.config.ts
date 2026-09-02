import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: 'var(--navy)',
        gold: 'var(--gold)',
        ivory: 'var(--ivory)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-dark': 'var(--surface-dark)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-faint': 'var(--ink-faint)',
        'ink-on-dark': 'var(--ink-on-dark)',
        'ink-on-gold': 'var(--ink-on-gold)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'border-dark': 'var(--border-dark)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-ink': 'var(--accent-ink)',
        ok: 'var(--ok)',
        'ok-soft': 'var(--ok-soft)',
        warn: 'var(--warn)',
        'warn-soft': 'var(--warn-soft)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
        info: 'var(--info)',
        'info-soft': 'var(--info-soft)',
        'ch-website': 'var(--ch-website)',
        'ch-walkin': 'var(--ch-walkin)',
        'ch-phone': 'var(--ch-phone)',
        'ch-partner': 'var(--ch-partner)',
        'ch-admin': 'var(--ch-admin)',
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
} satisfies Config;
