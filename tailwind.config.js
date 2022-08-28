const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      transitionProperty: {
        'height': 'height',
        'grid-template-rows': 'grid-template-rows'
      },
      height: {
        104: '27rem'
      }
    },
    colors: {
      transparent: 'transparent',
      black: colors.black,
      white: colors.white,
      cyan: colors.cyan,
      gray: colors.neutral,
      red: colors.red,
      orange: colors.orange,
      yellow: colors.yellow,
      lime: colors.lime,
      green: colors.green,
      sky: colors.sky,
      teal: colors.teal,
      purple: colors.purple,
      blue: colors.blue,
    },
  },
  darkMode: 'class', // or 'media' or 'class'
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@savvywombat/tailwindcss-grid-areas'),
    require('tailwind-scrollbar'),
  ],
}
