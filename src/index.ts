import { createElement } from 'react';
import { render } from 'react-dom';
import StudioContainer from './containers/StudioContainer';
import './stylesheets/index.css';

render(createElement(StudioContainer), document.getElementById('root'));
