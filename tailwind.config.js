const colors = require('tailwindcss/colors');

module.exports = {
  mode: "jit",
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
      gray: colors.trueGray,
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
    gridTemplateAreas: {
      'project': [
        'model animation texture',
        'remote remote texture'
      ],
      'modeling': [
        'command command sidebar',
        'shortcuts canvas sidebar',
        'gumball gumball sidebar',
        'info info sidebar'
      ],
      'mapper': [
        'tools canvas layers',
        'info info layers'
      ],
      'texture': [
        'tools canvas layers',
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
      ],
      "animator-skeleton": [
        "tabs properties",
        "canvas properties",
        "scrub properties"
      ]
    }
  },
  darkMode: 'class', // or 'media' or 'class'
  purge: [
    './src/**/*.html',
    './src/**/*.js',
    './src/**/*.jsx',
    './src/**/*.ts',
    './src/**/*.tsx',
    './public/index.html',
    './public/normalize.css',
  ],
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@savvywombat/tailwindcss-grid-areas'),
    require('tailwind-scrollbar'),
  ],
};
