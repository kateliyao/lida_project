import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Login from './Login';
import MainPage from './MainPage';
import FormA from './FormA';
import HistoryForm from './HistoryForm';
import ChartComponent from './ChartComponent';
import Quotation from './Quotation';
import ServiceItem from './ServiceItem';
import RequestPayment from './RequestPayment';
import StagingArea from './StagingArea';
import QuotationLd from './QuotationLd';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (username) => {
    console.log("登入成功，收到的 username:", username);
    setUser(username);
  };

  const handleLogout = () => {
    console.log('登出被觸發');
    setUser(null);
    navigate('/');
  };

  // 新增：監聽 user 狀態變化
  useEffect(() => {
    // 如果沒有登入且當前路徑不是根路徑
    if (!user && window.location.pathname !== '/') {
      navigate('/');
    }
  }, [user, navigate]); // 當 user 或 navigate 變化時觸發

  // 可選：網路狀態監聽（根據第一段代碼的邏輯）
  useEffect(() => {
    const handleNetworkChange = () => {
      if (!navigator.onLine) {
        handleLogout(); // 斷網時自動登出
      }
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={user ? <MainPage onLogout={handleLogout} user={user} /> : <Login onLogin={handleLogin} />} />
        <Route path="/:user/mainpage" element={user ? <MainPage onLogout={handleLogout} user={user} /> : <Login onLogin={handleLogin} />}>
          <Route path="formA" element={<FormA user={user} />} />
          <Route path="requestPayment" element={<RequestPayment user={user} />} />
          <Route path="quotation" element={<Quotation user={user} />} />
          <Route path="history" element={<HistoryForm user={user} />} />
          <Route path="chart" element={<ChartComponent user={user} />} />
          <Route path="serviceItem" element={<ServiceItem user={user} />} />
          <Route path="stagingarea" element={<StagingArea onLogout={handleLogout} user={user} />} />
          <Route path="quotationLd" element={<QuotationLd user={user} />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;