import { createElement } from 'react';
import { render } from 'react-dom';
import App from './containers/StudioContainer';
import './stylesheets/index.css';

render(createElement(App), document.getElementById('root'));
