import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {HashRouter} from 'react-router-dom';
import TokenContainer from './TokenContainer';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <HashRouter>
      <TokenContainer />
    </HashRouter>
);