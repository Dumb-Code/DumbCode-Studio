import { createElement } from 'react';
import { render } from 'react-dom';
import StudioContainer from './containers/StudioContainer';
import './stylesheets/index.css';

//Fix an issue with FIK
window['FIK'] = require('@aminere/fullik')
window['THREE'] = require('three')

document.addEventListener('contextmenu', function (event) { event.preventDefault(); })

render(createElement(StudioContainer), document.getElementById('root'));
