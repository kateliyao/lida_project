import React, { useState } from 'react';
import './Login.css';
import logo from './assets/logo.png';

function Login ({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // If login is successful, call the parent component's onLogin
          onLogin(username);
        } else {
          setErrorMessage(data.message || '錯誤的帳號或密碼，請重新輸入。');
        }
      } catch (error) {
        console.error('Login error:', error);
        setErrorMessage('無法連接伺服器，請稍後再試。');
      }
    };


  return (
    <div className="login" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
      {errorMessage && <p style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</p>}

    </div>

  );
}

export default Login;