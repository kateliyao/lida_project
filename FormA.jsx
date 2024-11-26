import React, { useState, useEffect,useRef } from 'react';
import SystemDate from './SystemDate';
import NumberFormat from './NumberFormat';
import FinancialForm from './FinancialForm';
import TickYellow from './assets/tick_yellow.png';
import './FormA.css';

const FormA = ({ user }) => {
	console.log("FormA 收到的 user:", user);  // 打印傳遞來的 user

	const [isChecked, setIsChecked] = useState(false);  //是否勾選
    const [inputValue, setInputValue] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [formId, setFormId] = useState('無');  // 表單編號，默認為無
    const [note, setNote] = useState('');  // 用來儲存textarea的內容
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const maxLines = 7; // 限制最大行数
    const maxLength = 245; // 限制最大字数
    const [currentUserStaffMenu, setCurrentUserStaffMenu] = useState(''); // 初始化為空字符串
    const apiUrl = import.meta.env.VITE_API_URL;

    const handleCheckboxChange = (event) => {
        setIsChecked(event.target.checked);
    };
    const buttonRef = useRef();

    const handleInputChange = (event) => {
        const value = event.target.value;

        // 計算當前行數
        const lines = value.split('\n').length;
        // 計算當前字數
        const charCount = value.length;

        if (lines > maxLines) {
          alert('您已超過最大行數限制！');
          return;
        }
        if (charCount > maxLength) {
          alert('您已超過最大字數限制！');
          return;
        }
        // 如果沒有超過限制，更新state
        setNote(value);
    };


    //引入系統日期
    const { year, month, date ,handleYearChange, handleMonthChange ,handleDateChange,year1, month1 ,handleYear1Change, handleMonth1Change } = SystemDate();

    const [revenue, setRevenue] = useState(0);
    const [cost, setCost] = useState(0);
    const [expense, setExpense] = useState(0);
    const [profit, setProfit] = useState(0);
    const [nonrevenue, setNonrevenue] = useState(0);
    const [noncost, setNoncost] = useState(0);
    const [income, setIncome] = useState(0);
    const [netincome, setNetIncome] = useState(0);
    const [extracost, setExtraCost] = useState(0);
    const [extraexpense, setExtraExpense] = useState(0);

    const handleRevenueChange = (newValue) => {
        setRevenue(newValue);
    };
    const handleCostChange = (newValue) => {
        setCost(newValue);
    };
    const handleExpenseChange = (newValue) => {
        setExpense(newValue);
    };
    const handleProfitChange = (newValue) => {
        setProfit(newValue);
    };
    const handleNonrevenueChange = (newValue) => {
        setNonrevenue(newValue);
    };
    const handleNoncostChange = (newValue) => {
        setNoncost(newValue);
    };
    const handleIncomeChange = (newValue) => {
        setIncome(newValue);
    };
    const VoucherNumber = (Number(income) || 0) - (Number(netincome) || 0)

    const formatNumber = (number) => {
        const isNegative = number < 0;
        const formattedNumber = new Intl.NumberFormat().format(Math.abs(number)); // 先取得絕對值後進行千分位格式化
        if (isNegative) {
            return `(${formattedNumber})`; // 負數顯示為括號形式
        }
        return formattedNumber;
    };

    // 設置數字顯示的樣式
    const getNumberStyle = (number) => {
        return number < 0 ? { color: 'red' } : {}; // 負數時設置為紅色字體
    };

    const [companyId, setCompanyId] = useState('');
    const formRef = useRef();

    const handleChange = (e) => {
        setCompanyId(e.target.value);
    };

    // 透過公司ID帶出公司名稱與表單編號
    const handleSearch = async (e) => {
        e.preventDefault();
        if (companyId) {
          try {
            const response = await fetch(`${apiUrl}/api/getCompanyName?companyId=${companyId}`);
            const data = await response.json();

            if (response.ok && data.companyName) {
                setCompanyName(data.companyName); // 成功返回公司名稱

                const sequenceResponse = await fetch(`${apiUrl}/api/getSequence?companyId=${companyId}`);
                const sequenceData = await sequenceResponse.json();

                if (sequenceData.success) {
                    const formId = `${sequenceData.formId}`;
                    setFormId(formId); // 生成新的編號，格式：公司編碼_A_系統日期_序號
                    setErrorMessage(''); // 清空錯誤訊息
                } else {
                    setErrorMessage('獲取序號失敗');
                    setFormId('無');
                }
            } else {
                setCompanyName('');
                setErrorMessage('找不到對應的公司名稱');
                setFormId('無');
            }
            } catch (err) {
                setErrorMessage('查詢失敗，請稍後重試');
                setFormId('無');
            }
        } else {
            setErrorMessage('請輸入公司編碼');
            setFormId('無');
        }
        // setCompanyId(''); // 提交後清空查詢，先暫停使用
    };

    // 員工下拉式菜單
    useEffect(() => {
        const fetchStaffData = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/getStaffInfo?user=${user}`);
                if (!response.ok) {
                    throw new Error('網路無回應，請檢查服務器是否確實已啟動');
                }
                const data = await response.json();

                if (data) {
                    setSelectedStaff(data.staff_menu);  // 回傳當前用戶對應的員工菜單
                    setStaffList(data.allStaffMenus);  // 回傳所有員工的菜單
                    setErrorMessage('');
                } else {
                    setStaffList([]);  // 如果沒有找到服務人員，清空列表
                    setErrorMessage('沒有查到服務人員');
                }
            } catch (err) {
                setStaffList([]);
                setErrorMessage('查詢失敗，請稍後重試');
            }
        };

        fetchStaffData();  // 調用函數從後端獲取資料
    }, [user]);  // 依賴於user，每一次用戶變更時，重新加載數據

    // 處理下拉式菜單的選擇變化
    const handleStaffChange = (e) => {
        setSelectedStaff(e.target.value);
    };

    // 處理表單提交後送資料庫以及轉印成PDF
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("handleSubmit 被調用"); // 檢查是否多次調用

        // 在這裡檢查 formId 是否為 "無"，限定用戶提交基本原則
        if (formId === '無' || !formId) {
            alert('無效的表單編號！請檢查表單編號');
            return; // 阻止表單提交
        }

        // 檢查服務人員是否已選擇
        if (selectedStaff === '' || selectedStaff === '選擇負責人員') {
            alert('請選擇負責人員！');
            return; // 阻止表單提交
        }

        // 計算比例給後端使用
        const costPercent = revenue ? (cost / revenue) * 100 : 0;
        const expensePercent = revenue ? (expense / revenue) * 100 : 0;
        const profitPercent = revenue ? (profit / revenue) * 100 : 0;
        const nonrevenuePercent = revenue ? (nonrevenue / revenue) * 100 : 0;
        const noncostPercent = revenue ? (noncost / revenue) * 100 : 0;
        const incomePercent = revenue ? (income / revenue) * 100 : 0;

        const formData = {
            formId,
            companyId,
            companyName,
            year1,
            month1,
            revenue,
            cost,
            expense,
            profit,
            nonrevenue,
            noncost,
            income,
            costPercent,
            expensePercent,
            profitPercent,
            nonrevenuePercent,
            noncostPercent,
            incomePercent,
            isChecked: isChecked ? 'Y':'N', //是否勾選轉為Y或N
            netincome,
            extracost,
            extraexpense,
            note,
            selectedStaff,
            year,
            month,
            date,
            user
        };
        console.log('提交的表單數據:', formData); // 確認提交的數據

        try {
            const response = await fetch(`${apiUrl}/api/submitForm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                // 判斷回應的類型是否為 PDF
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/pdf')) {
                    // 如果是 PDF，獲取 PDF 文件的 blob 資料
                    const blob = await response.blob();
                    // 創建一個臨時連結來觸發文件下載
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob); // 創建 blob 物件 URL
                    link.download = '憑證統計表.pdf'; // 設定下載檔案的名稱
                    //link.click(); // 自動觸發下載
                    alert('表單提交成功！');
                } else {
                    // 如果不是 PDF，嘗試讀取 JSON 錯誤訊息
                    const result = await response.json();
                    console.error('提交表單失敗:', result.message);
                    alert('提交表單失敗: ' + result.message);
                }
            } else {
                // 如果回傳的 HTTP 狀態碼不是 2xx，讀取錯誤訊息
                const error = await response.json();
                console.error('提交表單失敗:', error.message);
                alert('提交表單失敗: ' + error.message);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
        setFormId(''); // 清除表單編號
    };

    return (
		<form onSubmit={handleSubmit}>
            <div ref={formRef} className="FormA">
                <div className="form-container">
                    <div style={{textAlign: 'left'}}>憑證統計表</div>
                    <div style={{textAlign: 'left'}}>編號:{formId}</div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            className="input-large"
                            value={companyId}
                            onChange={handleChange}
                            placeholder="輸入公司編碼"
                            required />
                        <button onClick={handleSearch} className="search_button">查詢公司名稱</button>
                    </div>
                    <div className="title">
                        {companyName && <p>{companyName}</p>}
                        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                    </div>

                    <div className="title">
                        <div htmlFor="line1" style={{ display: 'flex', alignItems: 'center' }}>
                            憑證統計表- <input
                                type="text"
                                id="year1"
                                className="input-medium"
                                value={year1}
                                onChange={handleYear1Change} /> 年
                            <input
                                type="text"
                                id="month1"
                                className="input-small"
                                value={month1}
                                onChange={handleMonth1Change} /> 月
                        </div>
                    </div>
                    <div htmlFor="line1" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        ● 截至 <input
                            type="text"
                            id="year1"
                            className="input-medium"
                            value={year1}
                            onChange={handleYear1Change} /> 年
                        <input
                            type="text"
                            id="month1"
                            className="input-small"
                            value={month1}
                            onChange={handleMonth1Change} /> 月
                        貴公司損益資料下(詳如後附損益表)(薪資部分已照去年同期估計):
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
                        <FinancialForm onRevenueChange={handleRevenueChange}
                                       onCostChange={handleCostChange}
                                       onExpenseChange={handleExpenseChange}
                                       onProfitChange={handleProfitChange}
                                       onNonrevenueChange={handleNonrevenueChange}
                                       onNoncostChange={handleNoncostChange}
                                       onIncomeChange={handleIncomeChange} />
                    </div><br />

                    <div>
                        <label className="mainpage-label" style={{ display: 'flex', alignItems: 'center' , flexWrap: 'wrap'}}>
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={handleCheckboxChange}
                                style={{ width: '20px',
                                         height: '20px',
                                         marginRight: '10px',
                                         appearance: 'none',  // 取消原生的勾選框外觀
                                         backgroundImage: isChecked ? `url(${TickYellow})` : '', // 使用匯入的圖片
                                         backgroundSize: 'cover', // 讓圖片填滿 checkbox
                                         backgroundRepeat: 'no-repeat',
                                         backgroundColor:'transparent',
                                         border: '1px solid #ccc', // 增加邊框使其更像原生的 checkbox
                                         cursor: 'pointer', // 改變鼠標指標樣式,
                                         padding:'15px'
                                }} />如需填寫請勾選
                        </label>

                        {isChecked ? (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center' , flexWrap: 'wrap'}}>
                                    <div className="mainpage-label">● 若年底結算申報採書審/所得額/查帳 淨利%申報淨利為(B)：&nbsp;</div>
                                    <NumberFormat onValueChange={setNetIncome} />。
                                </div>

                                <div style={{backgroundColor: '#EBC857',padding:'20px'}}>
                                    <div style={{ display: 'flex', justifyContent: 'center',alignItems: 'center' , flexWrap: 'wrap'}}>
                                        <div className="mainpage-label" >綜上所述，尚缺憑證金額(A-B)：&nbsp;</div>
                                        <span style={{ borderBottom: '2px solid white',...getNumberStyle(VoucherNumber)}}>{formatNumber(VoucherNumber)}</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'center',alignItems: 'center' , flexWrap: 'wrap'}}>
                                        <div className="mainpage-label">建議補成本 &nbsp;</div>
                                        <NumberFormat onValueChange={setExtraCost} />元及費用 &nbsp;
                                        <NumberFormat onValueChange={setExtraExpense} />元。
                                    </div>
                                </div>
                                <div style={{ color: 'red',textAlign:'left' }}>
                                    ※成本、費用如有不足情形請儘量補足，避免造成日後國稅局調閱時無法提示帳證，以同業利潤標準遭國稅局逕決！
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'gray' ,textAlign:'left' }}>
                                <span>如需填寫申報採書審/所得額/查帳，請勾選上行方框。</span>
                            </div>
                        )}
                    </div><br />

                    <div style={{ textAlign:'left' }}>
                        <div>● 其他：(當前字數:{note.length}/{maxLength} 當前行數:{note.split('\n').length}/{maxLines}) </div>
                        <div>
                            <textarea
                                rows="7"
                                id="textarea-input"
                                className="textarea-box"
                                placeholder="請在此輸入您的內容..."
                                value={note}  // 綁定textarea的值到state
                                onChange={handleInputChange}  // 設定事件處理函數
                            />
                        </div>
                    </div><br />

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        敬祝 商棋 力達稅務記帳士事務所
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap'  }}>
                            <label htmlFor="staff" style={{ color: 'white' }}>服務人員：</label>
                            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                            {staffList.length > 0 && (
                            <div>
                                <select
                                    value={selectedStaff}
                                    onChange={handleStaffChange}
                                    className="custom-select">

                                    <option value="">選擇負責人員</option>
                                    {staffList.map((staffMenu, index) => (
                                        <option key={index} value={staffMenu}>
                                            {staffMenu}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap'  }}>
                            <input
                                type="text"
                                id="year"
                                className="input-medium"
                                value={year}
                                onChange={handleYearChange} /> 年
                            <input
                                type="text"
                                id="month"
                                className="input-small"
                                value={month}
                                onChange={handleMonthChange} /> 月
                            <input
                                type="text"
                                id="date"
                                className="input-small"
                                value={date}
                                onChange={handleDateChange} /> 日
                        </div>
                    </div>

                    <div style={{
                        width: '100%',
                        height: '2px',
                        backgroundColor: 'white',
                        marginTop: '5px'}} />

                    <div style={{ display: 'flex', alignItems: 'center' , flexWrap: 'wrap',textAlign:'left' }}>
                        茲收到貴所提供
                        <input
                            type="text"
                            id="year1"
                            className="input-medium"
                            value={year1}
                            onChange={handleYear1Change} /> 年
                        <input
                            type="text"
                            id="month1"
                            className="input-small"
                            value={month1}
                            onChange={handleMonth1Change} /> 月憑證通知書，並以瞭解本公司目前帳務情況，
                    </div><br/><br/>
                    <div style={{textAlign:'left'}}>簽收：＿＿＿＿＿＿＿＿＿＿＿＿（可撕下簽回聯或PDF電子簽章回傳事務所)</div>
                </div><br />
            </div>
            <button ref={buttonRef} type="submit" className="submit_button">暫存檔案</button>
        </form>
    );
};

export default FormA;