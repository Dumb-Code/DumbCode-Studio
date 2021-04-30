const colors = require('tailwindcss/colors');

module.exports = {
  theme: {
    colors: {
      cyan: colors.cyan,
      gray: colors.trueGray,
      red: colors.red,
      orange: colors.orange,
      yellow: colors.yellow,
      green: colors.lime,
      lightBlue: colors.lightBlue,
      teal: colors.teal,
      purple: colors.purple,
    },
  },
  variants: {},
  darkMode: false, // or 'media' or 'class'
  purge: [
    './src/**/*.html',
    './src/**/*.js',
    './src/**/*.jsx',
    './src/**/*.ts',
    './src/**/*.tsx',
    './public/index.html',
  ],
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
