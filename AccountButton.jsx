import React, { useState } from 'react';
import AccountIcon from './assets/account_icon.png'
import './AccountButton.css';

function AccountButton({ onLogout,username }) {
  // 控制顯示登出框的狀態
  console.log("AccountButton 收到的 username:", username);
  const [isOpen, setIsOpen] = useState(false); // 控制菜單顯示與否

  // 顯示/隱藏菜單
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="account-container">
      {/* 帳戶圖示 */}
      <div className="account-icon" onClick={toggleMenu}>

        <img src={AccountIcon} alt="Logout Icon" />
        <span className="account-name" style={{ color: '#FFFFFF' , marginLeft: '8px'  }}>{username}</span>
      </div>

      {/* 下拉菜單 */}
      {isOpen && (
        <div className="account-menu">
{/*           <button className="menu-item">隱私設定</button> */}
          <button className="menu-item" onClick={onLogout}>登出</button>
        </div>
      )}
    </div>
  );
}

export default AccountButton;
