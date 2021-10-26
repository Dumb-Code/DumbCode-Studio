import { createElement } from 'react';
import { render } from 'react-dom';
import StudioContainer from './containers/StudioContainer';
import './stylesheets/index.css';

document.addEventListener('contextmenu', function (event) { event.preventDefault(); })

render(createElement(StudioContainer), document.getElementById('root'));
