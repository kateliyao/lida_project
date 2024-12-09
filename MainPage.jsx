import React, { useState,useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import VoucherWhiteIcon from './assets/voucherStatisticsTable_white_icon.png';
import VoucherBlueIcon from './assets/voucherStatisticsTable_blue_icon.png';
import RequestWhiteIcon from './assets/requestForm_white_icon.png';
import RequestBlueIcon from './assets/requestForm_blue_icon.png';
import QuotationWhiteIcon from './assets/quotation_white_icon.png';
import QuotationBlueIcon from './assets/quotation_blue_icon.png';
import HistoryWhiteIcon from './assets/history_white_icon.png';
import HistoryBlueIcon from './assets/history_blue_icon.png';
import StagingAreaIcon from './assets/stagingArea_icon.png';
import ChartWhiteIcon from './assets/chart_white_icon.png';
import ChartBlueIcon from './assets/chart_blue_icon.png';
import AccountButton from './AccountButton';
import FormA from './FormA';
import HistoryForm from './HistoryForm';
import ChartComponent from './ChartComponent';
import './MainPage.css';

const MainPage = ({ onLogout,user }) => {
    console.log("MainPage 收到的 user:", user);  // 打印傳遞來的 user
    console.log(window.innerWidth);
    const [activeForm, setActiveForm] = useState(null);
    const navigate = useNavigate();

    const handleFormClick = (form) => {
        console.log(`選擇了 ${form} 表單`);
        setActiveForm(form);
    };

    const handleLogout = () => {
        console.log('登出被觸發'); // 這裡可以確認是否進入此函數
        //navigate('/'); // 導航回 Login 頁面
        window.location.href = '/'; // 強制導航到 Login 頁面
    };

    // 檢查用戶是否有權限查看 "統計圖表" 項目
    const canViewChart = user && user.startsWith('lda');

    return (
    <div className="mainpage">
        <div className="top">
            <div className="logo-mainpage">
                <img src={logo} alt="Logo" />
            </div>
            <div className="stagingarea-icon">
                <button onClick={() => {
                  navigate('/StagingArea'); // 如果需要導航到單獨的路由
                }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}  // 隱藏按鈕邊框並設定為可點擊
                >
                <img src={StagingAreaIcon} alt="StagingAreaIcon"  />  {/* 根據需要調整圖片大小 */}
                </button>
            </div>
            <AccountButton onLogout={handleLogout} username={user} />
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
                    <li
                        onClick={() => handleFormClick('HISTORY')}
                        onMouseEnter={(e) => e.target.firstChild.src = HistoryBlueIcon}
                        onMouseLeave={(e) => e.target.firstChild.src = HistoryWhiteIcon} >
                        <img src={HistoryWhiteIcon} alt="pngC" style={{ width: '25px', marginRight: '10px' }} />
                        歷史資料
                    </li>

                    {/* 只有 user.startsWith('lda') 的使用者才能看到統計圖表選項 */}
                    {canViewChart && (
                        <li
                            onClick={() => handleFormClick('CHART')}
                            onMouseEnter={(e) => e.target.firstChild.src = ChartBlueIcon}
                            onMouseLeave={(e) => e.target.firstChild.src = ChartWhiteIcon} >
                            <img src={ChartWhiteIcon} alt="pngC" style={{ width: '25px', marginRight: '10px' }} />
                            統計圖表
                        </li>
                    )}
                </ul>
            </div>
            </nav>

            <div className="form-area">
                {activeForm === 'A' && <FormA user={user}/>}
                {activeForm === 'HISTORY' && <HistoryForm user={user}/>}
                {activeForm === 'CHART' && <ChartComponent user={user}/>}
            </div>
        </div>
    </div>
    );
};
export default MainPage;