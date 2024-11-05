import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from './assets/logo.png';

//帳號密碼登入功能
const validUsers = [
  { username: 'user1', password: '2wsx#EDC' },
  { username: 'user2', password: 'pass2' },
  { username: 'user3', password: 'pass3' },
  { username: 'user4', password: 'pass4' },
  { username: 'user5', password: 'pass5' },
];

function Login ({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // 檢查用戶名和密碼是否匹配
    const user = validUsers.find(
      (user) => user.username === username && user.password === password
    );

    if (user) {
      //setIsLoggedIn(true);
      onLogin(username); // 呼叫父組件的登入方法
      navigate('/MainPage'); // 進行頁面跳轉
      setErrorMessage('');
    } else {
      setErrorMessage('錯誤的帳號或密碼。 請重新輸入.');
    }
  };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (username) {
//         onLogin(username); // 呼叫父組件的登入方法
//     }
//   };

//   useEffect(() => {
//     if (isLoggedIn) {
//       navigate('/MainPage'); // 進行頁面跳轉
//     }
//   }, [isLoggedIn, navigate]);
  // const handleSubmit = (e) => {
  //   e.preventDefault();
    
  //   const formData = {
  //     username, // 包含 username
  //     // 其他表单字段
  //   };

  //   onLogin(formData); // 调用 onLogin 并传递 formData
  // };

  return (
    <div className="login">
      <div className="logo-login">  
            <img src={logo} alt="Logo" />
      </div>
      <form onSubmit={handleLogin}>
        <div style={{ display: 'flex',alignItems: 'flex-start' }}>
          <label className="label-login">帳號:&nbsp;&nbsp;</label>
          <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required />

        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label className="label-login">密碼&nbsp;:&nbsp;</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required />
        </div>
        <button className="login_button" type="submit">登入</button>
      </form>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
}

export default Login;