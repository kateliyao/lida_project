import React, { useState,useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import VoucherWhiteIcon from './assets/voucherStatisticsTable_white_icon.png';
import VoucherBlueIcon from './assets/voucherStatisticsTable_blue_icon.png';
import RequestWhiteIcon from './assets/requestForm_white_icon.png';
import RequestBlueIcon from './assets/requestForm_blue_icon.png';
import QuotationWhiteIcon from './assets/quotation_white_icon.png';
import QuotationBlueIcon from './assets/quotation_blue_icon.png';
import StagingArea from './assets/stagingArea_icon.png';
import AccountButton from './AccountButton';
import FormA from './FormA';
import CartPage from './CartPage'; // 引入 CartPage
import './MainPage.css';

const MainPage = ({ cart, onSave,onLogout,user }) => {
  console.log("MainPage 收到的 user:", user);  // 打印傳遞來的 user
  //const [cart, setCart] = useState(initialCart || []);
  const [activeForm, setActiveForm] = useState(null);
  //const [cart, setCart] = useState([]); // 在 MainPage 中管理購物車
  const navigate = useNavigate();


  useEffect(() => {
    console.log('購物車更新:', cart); // 監聽 cart 的變化
  }, [cart]);

  const handleGoBack = () => {
    window.history.back();
    window.location.reload();
  };

  const handleFormClick = (form) => {
    console.log(`選擇了 ${form} 表單`);
    setActiveForm(form);
  };

  // 登出功能
    const handleLogout = () => {
        console.log('登出被觸發'); // 這裡可以確認是否進入此函數
        //navigate('/'); // 導航回 Login 頁面
        window.location.href = '/'; // 強制導航到 Login 頁面
      };
  // const handleSaveToCart = (formData) => {
  //   setCart((prevCart) => [...prevCart, formData]); // 更新購物車
  //   console.log('購物車更新:', cart);
  // };
  const handleSaveToCart = (formData) => {
//     console.log('handleSaveToCart 被調用:', formData);
//     setCart((prevCart) => {
//         const updatedCart = [...prevCart, formData];
//         console.log('購物車更新:', updatedCart); // 確認更新後的狀態
//         return updatedCart; // 返回新的狀態
//     });
    console.log('handleSaveToCart 被調用:', formData);
    onSave(formData);
   };

  console.log('當前購物車內容:', cart);
  return (
    <div className="mainpage">
      <div className="top">
        <div className="logo-mainpage">
            <img src={logo} alt="Logo" />
        </div>
        <div className="stagingarea-icon">
          <button onClick={() => {
              //setActiveForm('C'); // 當點擊購物車時設置 activeForm 為 C
              console.log('當前購物車內容:', cart);
              navigate('/StagingArea'); // 如果需要導航到單獨的路由
          }}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}  // 隱藏按鈕邊框並設定為可點擊
          >
          <img src={StagingArea} alt="StagingArea" style={{ width: '40px', height: '40px' }} />  {/* 根據需要調整圖片大小 */}

          </button>
      </div>
          <AccountButton onLogout={handleLogout} username={user} />


{/*           <button onClick={onLogout}>登出</button> */}

      </div>

      <div className="side-container">
          <nav className="sidebar">
            <div>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    <li
                        onClick={() => handleFormClick('A')}
                        onMouseEnter={(e) => e.target.firstChild.src = VoucherBlueIcon}
                        onMouseLeave={(e) => e.target.firstChild.src = VoucherWhiteIcon} >
                        <img src={VoucherWhiteIcon} alt="pngA" style={{ width: '25px', marginRight: '10px' }} />
                        憑證統計表
                    </li>
                    <li
                        onClick={() => handleFormClick('B')}
                        onMouseEnter={(e) => e.target.firstChild.src = RequestBlueIcon}
                        onMouseLeave={(e) => e.target.firstChild.src = RequestWhiteIcon} >
                        <img src={RequestWhiteIcon} alt="pngB" style={{ width: '25px', marginRight: '10px' }} />
                        請款單
                    </li>
                    <li
                        onClick={() => handleFormClick('C')}
                        onMouseEnter={(e) => e.target.firstChild.src = QuotationBlueIcon}
                        onMouseLeave={(e) => e.target.firstChild.src = QuotationWhiteIcon} >
                        <img src={QuotationWhiteIcon} alt="pngC" style={{ width: '25px', marginRight: '10px' }} />
                        報價單
                    </li>
{/*                   <li onClick={() => handleFormClick('A')}>憑證統計表</li> */}
{/*                   <li onClick={() => handleFormClick('B')}>請款單</li> */}
{/*                   <li onClick={() => handleFormClick('C')}>報價單</li> */}
                </ul>
            </div>
          </nav>

          <div className="form-area">
            {activeForm === 'A' && <FormA onSave={handleSaveToCart} />}
            {activeForm === 'Cart' && <CartPage cart={cart} setCart={setCart} />} {/* 顯示購物車 */}
            {/* {activeForm === 'C' && <CartPage cart={cart} />} 顯示購物車 */}
            {/* {activeForm === 'C' && (
              <>
                <CartPage cart={cart} />
                <div>當前購物車內容: {JSON.stringify(cart)}</div>
              </>
            )} */}
          </div>
      </div>


  </div>
  );
};

export default MainPage;