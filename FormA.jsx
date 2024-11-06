import React, { useState, useEffect,useRef } from 'react';
import './FormA.css';
import { useForm } from 'react-hook-form';
import html2pdf from 'html2pdf.js';
import SystemDate from './SystemDate';
//import NumberFormat from 'react-number-format';
import NumberFormat from './NumberFormat';
import FinancialForm from './FinancialForm';

const FormA = ({ onSave }) => {
	//是否套用pdf版面設定
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    //勾選確認鍵
	const [isChecked, setIsChecked] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [newId, setNewId] = useState('無');  // 存储生成的编号，默认为 '無'

    const handleCheckboxChange = (event) => {
        setIsChecked(event.target.checked);
    };
    const buttonRef = useRef();

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

    //引入本期損益
    const [income, setIncome] = useState(0);
    const [netincome, setNetIncome] = useState('');

    const handleIncomeChange = (newIncome) => {
        setIncome(newIncome);
        console.log('Updated Income:', newIncome);
    };
    const VoucherNumber = (Number(income) || 0) - (Number(netincome) || 0)

    const formatNumber = (number) => {
        return new Intl.NumberFormat().format(number);
    };

    const [formId, setFormId] = useState('');
    const [currentCart, setCurrentCart] = useState([]);
    const formRef = useRef();

    const handleChange = (e) => {
        setFormId(e.target.value);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (formId) {
          try {
            // 發送請求到後端
            const response = await fetch(`http://localhost:5000/api/getCompanyName?formId=${formId}`);
            const data = await response.json();

            if (response.ok && data.companyName) {
              setCompanyName(data.companyName); // 成功返回公司名稱
              setNewId(formId + '_A');  // 生成新的編號，格式：公司編碼 + '_A'
              setErrorMessage(''); // 清空錯誤訊息
            } else {
              setCompanyName('');
              setErrorMessage('找不到對應的公司名稱');
              setNewId('無');
            }
          } catch (err) {
            setErrorMessage('查詢失敗，請稍後重試');
            setNewId('無');
          }
        } else {
          setErrorMessage('請輸入公司編碼');
          setNewId('無');
        }
        setFormId('');
      };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("handleSubmit 被調用"); // 檢查是否多次調用

        // 新增延遲，匯出成pdf
        //await new Promise(resolve => setTimeout(resolve, 100)); // 100 毫秒延迟
        //await handleGeneratePDF();


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

        const formData = {
            formId,
            year1,
            month1,
            html,
            css
        };
        console.log('CSS:', css); // 確認 CSS 被正確設置
        console.log('提交的表單數據:', formData); // 確認提交的數據
        onSave(formData); // 傳遞到 MainPage 的 onSave 函數
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
                      <div style={{textAlign: 'left'}}>憑證統計表 編號:{newId}</div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        className="input-large"
                        value={formId}
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
                        <FinancialForm onNetIncomeChange={handleIncomeChange} />
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
                                            <NumberFormat />
                                            <div style={{ borderBottom: '1px solid black', marginTop: '-2px' }} />
                                        </div>元及費用 &nbsp;
                                        <div style={{ display: 'inline-block', marginRight: '10px' }}>
                                            <NumberFormat />
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
                        <div>● 其他：</div>
                        <div>
                            <textarea
                                rows="4"
                                id="textarea-input"
                                className="textarea-box"
                                placeholder="請在此輸入您的內容..."
                            />
                        </div>
                    </div><br />

                    <div className="class8" >
                        敬祝 商棋 力達稅務記帳士事務所&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <div style={{ display: 'flex', alignItems: 'center' , flexWrap: 'wrap' }}>
                            服務人員:<input className="input-large"/>&nbsp;&nbsp;
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