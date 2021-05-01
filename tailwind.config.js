const colors = require('tailwindcss/colors');

module.exports = {
  theme: {
    colors: {
      black: colors.black,
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
    gridTemplateAreas: {
      'project': [
        'changelog remote texture',
        'changelog model texture',
        'changelog model animation'
      ],'modeling': [
        'command command rtop',
        'shortcuts canvas rtop',
        'shortcuts canvas rbottom',
        'shortcuts gumball rbottom',
        'info info rbottom'
      ],
      'texture': [
        'views views views',
        'tools canvas canvas',
        'properties properties layers',
        'info info layers',
      ],
      'animator': [
        'tabs tabs properties',
        'tools canvas properties',
        'scrub scrub properties',
        'timeline timeline properties',
        'gumball gumball properties',
        'info info properties'
      ]
    }
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
    require('@savvywombat/tailwindcss-grid-areas'),
  ],
};
