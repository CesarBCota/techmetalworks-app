/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0a0a',
          card: '#111318',
          hover: '#161b24',
          border: '#1e2433',
        },
        blue: {
          deep:  '#1a3a5c',
          mid:   '#1e4a7a',
          main:  '#2d6a9f',
          light: '#3d8abf',
          glow:  '#4da6e0',
        },
        silver: {
          dim:   '#8a9bb0',
          mid:   '#a8bcd0',
          light: '#c4d4e4',
          bright:'#d4dde6',
        },
        text: {
          DEFAULT: '#f0f4f8',
          muted:   '#8a9bb0',
          faint:   '#4a5568',
        },
        status: {
          rascunho: '#4a5568',
          enviado:  '#2d6a9f',
          aprovado: '#16a34a',
          perdido:  '#dc2626',
          expirado: '#92400e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
