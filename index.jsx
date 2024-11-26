// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'
//
// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';  // 引入 App 組件
import { BrowserRouter as Router } from 'react-router-dom';  // 確保使用 Router

ReactDOM.render(
  <Router> {/* 包裹 App 組件 */}
    <App />
  </Router>,
  document.getElementById('root')
);
