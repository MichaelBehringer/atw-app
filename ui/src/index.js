import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {HashRouter} from 'react-router-dom';
import {ToastContainer} from 'react-toastify';
import TokenContainer from './TokenContainer';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <HashRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <TokenContainer />
    </HashRouter>
);