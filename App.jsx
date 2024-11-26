import React, { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Login from './Login';
import MainPage from './MainPage';
import StagingArea from './StagingArea';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();  // 使用 useNavigate

  const handleLogin = (username) => {
    console.log("登入成功，收到的 username:", username);
    setUser(username);
    navigate('/MainPage');  // 登入後跳轉到 MainPage
  };

  const handleLogout = () => {
    console.log('登出被觸發');
    setUser(null);
    navigate('/');  // 登出後跳轉回 Login 頁面
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={user ? <MainPage onLogout={handleLogout} user={user} /> : <Login onLogin={handleLogin} />} />
        <Route path="/MainPage" element={user ? <MainPage onLogout={handleLogout} user={user} /> : <Login onLogin={handleLogin} />} />
        <Route path="/StagingArea" element={user ? <StagingArea onLogout={handleLogout} user={user} /> : <Login onLogin={handleLogin} />} />
      </Routes>
    </div>
  );
};

export default App;