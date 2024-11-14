import React, { useState, useEffect,useRef } from 'react';
import './FormA.css';
import { useForm } from 'react-hook-form';
import html2pdf from 'html2pdf.js';
import SystemDate from './SystemDate';
//import NumberFormat from 'react-number-format';
import NumberFormat from './NumberFormat';
import FinancialForm from './FinancialForm';
//import axios from 'axios';

const FormA = ({ user }) => {
	console.log("FormA 收到的 user:", user);  // 打印傳遞來的 user
	//是否套用pdf版面設定
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    //是否勾選
	const [isChecked, setIsChecked] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [formId, setFormId] = useState('無');  // 表單編號，默認為無
    const [note, setNote] = useState('');  // 用來儲存textarea的內容
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const maxLines = 7; // 限制最大行数
    const maxLength = 245; // 限制最大字数

    //是否勾選
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

    //匯出成pdf
    const handleGeneratePDF = async () => {
        setIsGeneratingPDF(true);
        buttonRef.current.style.display = 'none'; // 隐藏按钮

        //打印到文件上的重要元素，用以下的element，input位置都會是空的
        const element = document.getElementById('form-container');
        console.log("Generating PDF with HTML:", element.innerHTML); // 打印 HTML 内容

        // const element = formRef.current;
        // if (!element) {
        //     console.error("Form element not found");
        //     setIsGeneratingPDF(false);
        //     return;
        // }

        const opt = {
            margin: 0.4,
            filename: `${formId || 'form'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        };

        await html2pdf().from(element).set(opt).save();
        setIsGeneratingPDF(false);
        buttonRef.current.style.display = 'block'; // 显示按钮
    };

    //引入系統日期
    const { year, month, date ,handleYearChange, handleMonthChange ,handleDateChange,year1, month1 ,handleYear1Change, handleMonth1Change } = SystemDate();

    const [revenue, setRevenue] = useState(0);
    const [cost, setCost] = useState(0);
    const [expense, setExpense] = useState(0);
    const [profit, setProfit] = useState(0);
    const [nonrevenue, setNonrevenue] = useState(0);
    const [noncost, setNoncost] = useState(0);
    //引入本期損益
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
        return new Intl.NumberFormat().format(number);
    };

    const [companyId, setCompanyId] = useState('');
    const [currentCart, setCurrentCart] = useState([]);
    const formRef = useRef();

    const handleChange = (e) => {
        setCompanyId(e.target.value);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (companyId) {
          try {
            // 發送請求到後端
            const response = await fetch(`http://localhost:5000/api/getCompanyName?companyId=${companyId}`);
            const data = await response.json();

            if (response.ok && data.companyName) {
                setCompanyName(data.companyName); // 成功返回公司名稱

              // 獲取當前日期（YYYYMMDD）
                const today = new Date();
                const year = today.getFullYear();
                const month = (today.getMonth() + 1).toString().padStart(2, '0'); // 月份從0開始，因此+1
                const day = today.getDate().toString().padStart(2, '0');
                const dateStr = `${year}${month}${day}`; // 格式化为 YYYYMMDD

                // 获取当前序号
                const sequenceResponse = await fetch(`http://localhost:5000/api/getSequence?companyId=${companyId}`);
                const sequenceData = await sequenceResponse.json();

                if (sequenceData.success) {
                    // 序号递增
                    //const newSequence = (sequenceData.formId + 1).toString().padStart(3, '0'); // 生成新的序号，确保三位数
                    const formId = `${companyId}_A_${dateStr}_${sequenceData.formId}`;
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

    useEffect(() => {
        const fetchStaffData = async () => {
            try {
                // Sending request to backend to get staff information
                const response = await fetch('http://localhost:5000/api/getStaffInfo');
                const data = await response.json();

                if (response.ok && Array.isArray(data) && data.length > 0) {
                    setStaffList(data);  // Populate staff list if data is valid
                    setErrorMessage('');  // Clear error message
                } else {
                    setStaffList([]);  // Clear staff list if no staff found
                    setErrorMessage('没有找到工作人员');
                }
            } catch (err) {
                setStaffList([]);
                setErrorMessage('查詢失敗，請稍後重試');
            }
        };

        fetchStaffData();  // Call the fetch function
    }, []);

    const handleStaffChange = (e) => {
        setSelectedStaff(e.target.value);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("handleSubmit 被調用"); // 檢查是否多次調用

        // 在這裡檢查 formId 是否為 "無"
        if (formId === '無' || !formId) {
            alert('無效的表單編號！請檢查表單編號');
            return; // 阻止表單提交
        }


        const html = formRef.current.innerHTML;

        // 獲取 CSS
        const stylesheets = [...document.styleSheets];
        let css = '';

        for (const sheet of stylesheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                for (const rule of rules) {
                    css += rule.cssText + '\n';
                }
            } catch (e) {
                console.warn('無法訪問樣式表:', sheet.href);
            }
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
            //html,
            //css
        };
        console.log('CSS:', css); // 確認 CSS 被正確設置
        console.log('提交的表單數據:', formData); // 確認提交的數據

        try {
            const response = await fetch('http://localhost:5000/api/submitForm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            //const result = await response.json();

            if (response.ok) {
                // 判断响应的类型是否为 PDF
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/pdf')) {
                    // 如果是 PDF，获取 PDF 文件的 blob 数据
                    const blob = await response.blob();
                    // 创建一个临时链接来触发文件下载
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob); // 创建 blob 对象 URL
                    link.download = '憑證統計表.pdf'; // 设置下载文件的名称
                    link.click(); // 自动触发下载
                } else {
                    // 如果不是 PDF，尝试读取 JSON 错误信息
                    const result = await response.json();
                    console.error('Error submitting form:', result.message);
                }
            } else {
                // 如果返回的 HTTP 状态码不是 2xx，读取错误信息
                const error = await response.json();
                console.error('Error submitting form:', error.message);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }

        setFormId('');

        // 檢查新表單的 formId 是否已經存在於購物車中
        const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
        const exists = currentCart.some(item => item.formId === formData.formId);
        if (!exists) {
            // 如果不存在，則新增表單到購物車
            const updatedCart = [...currentCart, formData];
            localStorage.setItem('cart', JSON.stringify(updatedCart));
            alert('表單已儲存！');
        } else {
            alert('這個表單已經存在於購物車中！ 請更換編碼');
        }
    };

    return (
		<form onSubmit={handleSubmit}>
            <div ref={formRef} className="FormA">
                <div id="form-container" className={isGeneratingPDF ? 'pdf-view' : 'web-view'}>
                      <div style={{textAlign: 'left'}}>憑證統計表</div>
                      <div style={{textAlign: 'left'}}>編號:{formId}</div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        className="input-large"
                        value={companyId}
                        onChange={handleChange}
                        placeholder="輸入公司編碼"
                        required
                      />
                      <button onClick={handleSearch} className="search_button">查詢公司名稱</button>
                      </div>
                    <div className="class1">
                      {companyName && <p>{companyName}</p>}
                      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                    </div>
                    <div className="class1">
                        <div htmlFor="line1" style={{ display: 'flex', alignItems: 'center' }}>
                            憑證統計表- <input
                                type="text"
                                id="year1"
                                className="input-medium"
                                value={year1}
                                onChange={handleYear1Change}
                            /> 年
                            <input
                                type="text"
                                id="month1"
                                className="input-small"
                                value={month1}
                                onChange={handleMonth1Change}
                            /> 月
                        </div>
                    </div>
                    <div className="class3">
                        <div htmlFor="line1" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            ● 截至 <input
                                type="text"
                                id="year1"
                                className="input-medium"
                                value={year1}
                                onChange={handleYear1Change}
                            /> 年
                            <input
                                type="text"
                                id="month1"
                                className="input-small"
                                value={month1}
                                onChange={handleMonth1Change}
                            /> 月
                            貴公司損益資料下(詳如後附損益表)(薪資部分已照去年同期估計):
                        </div>
                    </div>

                    <div className="class4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
                        <FinancialForm onRevenueChange={handleRevenueChange}
                                       onCostChange={handleCostChange}
                                       onExpenseChange={handleExpenseChange}
                                       onProfitChange={handleProfitChange}
                                       onNonrevenueChange={handleNonrevenueChange}
                                       onNoncostChange={handleNoncostChange}
                                       onIncomeChange={handleIncomeChange}  />

                    </div><br />

                    <div className="class5">
                        <label className="mainpage-label" style={{ display: 'flex', alignItems: 'center' , flexWrap: 'wrap'}}>
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={handleCheckboxChange}
                                style={{ width: '20px', height: '20px', marginRight: '10px' }}
                            />如需填寫請勾選
                        </label>

                    {isChecked ? (
                            <div className="class5">
                                <div style={{ display: 'flex', alignItems: 'center' , flexWrap: 'wrap'}}>
                                <label className="mainpage-label">● 若年底結算申報採書審/所得額/查帳 淨利%申報淨利為(B)：&nbsp;</label>
                                <NumberFormat onValueChange={setNetIncome} isGeneratingPDF={isGeneratingPDF}/>。</div>

                                <div className="class10">
                                    <div style={{ display: 'flex', alignItems: 'center' , flexWrap: 'wrap'}}>
        {/*                                 <FinancialForm onIncomeChange={handleIncomeChange} /> */}
                                    <label className="mainpage-label">綜上所述，尚缺憑證金額(A-B)：&nbsp;{VoucherNumber}</label>
        {/*                             <label>綜上所述，尚缺憑證金額(A-B)：&nbsp;{formatNumber(VoucherNumber)}</label> */}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center' , flexWrap: 'wrap'}}>
                                    <label className="mainpage-label">建議補成本 &nbsp;</label>
                                        <div style={{ display: 'inline-block', marginRight: '10px' }}>
                                            <NumberFormat onValueChange={setExtraCost} />
                                            <div style={{ borderBottom: '1px solid black', marginTop: '-2px' }} />
                                        </div>元及費用 &nbsp;
                                        <div style={{ display: 'inline-block', marginRight: '10px' }}>
                                            <NumberFormat onValueChange={setExtraExpense} />
                                            <div style={{ borderBottom: '1px solid black', marginTop: '-2px' }} />
                                        </div>元。
                                    </div>


                                    <div style={{ color: 'red' }}>
                                        ※成本、費用如有不足情形請儘量補足，避免造成日後國稅局調閱時無法提示帳證，以同業利潤標準遭國稅局逕決！
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'gray' }}>
                                <span>如需填寫申報採書審/所得額/查帳，請勾選上行方框。</span>
                            </div>
                        )}
                    </div>

                    <br />
                    <div className="class6">
                        <div>● 其他：(當前字數:{note.length}/{maxLength} 當前行數:{note.split('\n').length}/{maxLines}) </div>
                        <div>
                            <textarea
                                rows="4"
                                id="textarea-input"
                                className="textarea-box"
                                placeholder="請在此輸入您的內容..."
                                value={note}  // 綁定textarea的值到state
                                onChange={handleInputChange}  // 設定事件處理函數
                            />
                        </div>
                    </div><br />

                    <div className="class8" >
                        敬祝 商棋 力達稅務記帳士事務所
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap'  }}>
                            <label htmlFor="staff" style={{ color: 'white' }}>服務人員：</label>
                                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                                {staffList.length > 0 && (
                                    <div>
                                        <select
                                            id="staff"
                                            value={selectedStaff}
                                            onChange={handleStaffChange}
                                            className="custom-select"
                                        >
                                            <option value="">選擇服務人員</option>
                                            {staffList.map((staff) => (
                                                <option key={staff.staffId} value={staff.staffMenu}>
                                                    {staff.staffMenu}  {/* Display staffName and staffMenu */}
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
                                    onChange={handleYearChange}
                                /> 年
                                <input
                                    type="text"
                                    id="month"
                                    className="input-small"
                                    value={month}
                                    onChange={handleMonthChange}

                                /> 月
                                <input
                                    type="text"
                                    id="date"
                                    className="input-small"
                                    value={date}
                                    onChange={handleDateChange}

                                /> 日
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '100%', // 或设定具体宽度，例如 '300px'
                        height: '2px',
                        backgroundColor: 'black',
                        marginTop: '5px' // 控制文本和线之间的间距
                    }} />
                    </div>
                    <div className="class9" style={{ display: 'flex', alignItems: 'center' , flexWrap: 'wrap' }}>
                        茲收到貴所提供<input
                                type="text"
                                id="year1"
                                className="input-medium"
                                value={year1}
                                onChange={handleYear1Change}
                            /> 年<input
                                type="text"
                                id="month1"
                                className="input-small"
                                value={month1}
                                onChange={handleMonth1Change}
                            /> 月憑證通知書，並以瞭解本公司目前帳務情況，</div><br/><br/>
                    <div className="class9">簽收：＿＿＿＿＿＿＿＿＿＿＿＿（可撕下簽回聯或PDF電子簽章回傳事務所)</div>
                </div><br />
            </div>
            {/* <button id="generatePdfButton" onClick={handleGeneratePDF}>生成 PDF</button> */}

            <button ref={buttonRef} type="submit" className="submit_button">暫存檔案</button>

            {/* <button type="submit">保存</button> */}

        </form>
    );
};

export default FormA;