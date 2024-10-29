import React, { useState, useEffect,useRef } from 'react';
import './MyForm.css';
import { useForm } from 'react-hook-form';
import html2pdf from 'html2pdf.js';
import SystemDate from './SystemDate';
//import NumberFormat from 'react-number-format';
import NumberFormat from './NumberFormat';

const MyForm = () => {
	//是否套用pdf版面設定
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    //勾選確認鍵
	const [isChecked, setIsChecked] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const handleCheckboxChange = (event) => {
        setIsChecked(event.target.checked);
    };

    //匯出成pdf
    const formRef = useRef();
    const handleGeneratePDF = () => {
		setIsGeneratingPDF(true);
		//const element = formRef.current;
		const button = document.getElementById('generatePdfButton');
        button.style.display = 'none'; // 隐藏按钮

		const element = document.getElementById('form-container');

		const opt = {
			margin:       0.4,
			filename:     'form.pdf',
			image:        { type: 'jpeg', quality: 0.98 },
			html2canvas:  { scale: 2 },
			jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
		};

		html2pdf()
			.from(element)
			.set(opt)
			.save()
			.then(() => {
				setIsGeneratingPDF(false);
				button.style.display = 'block';
			});


    };

    //引入系統日期
    const { year, month, date ,handleYearChange, handleMonthChange ,handleDateChange,year1, month1 ,handleYear1Change, handleMonth1Change } = SystemDate();

    //營業淨利、本期損益
    const [revenue, setRevenue] = useState('');
    const [cost, setCost] = useState('');
    const [expense, setExpense] = useState('');
    const [nonrevenue, setNonrevenue] = useState('');
    const [noncost, setNoncost] = useState('');

    const profit = (parseInt(revenue,10) || 0) - (parseInt(cost,10) || 0) - (parseInt(expense,10) || 0);
    const income = (parseInt(revenue,10) || 0) - (parseInt(cost,10) || 0) - (parseInt(expense,10) || 0) + (parseInt(nonrevenue,10) || 0) - (parseInt(noncost,10) || 0)

    const formatNumber = (number) => {
        return new Intl.NumberFormat().format(number);
      };

    return (
        //<div className="container" id="form-container">
		<div ref={formRef}
          id="form-container"
          className={isGeneratingPDF ? 'pdf-view' : 'web-view'} // 根據狀態設置類
        >

                <div className="class1">公司</div>
                <div className="class1">
                    <label htmlFor="line1">
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
                    </label>
                </div>
                <div className="class3">
                    <label htmlFor="line1">
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
                    </label>
                </div><br />

                <div className="class4">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label htmlFor="revenue">銷貨收入: $&nbsp;</label>
                    <NumberFormat onValueChange={setRevenue} isGeneratingPDF={isGeneratingPDF} /></div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label htmlFor="cost">銷貨成本: $&nbsp;</label>
                    <NumberFormat onValueChange={setCost} isGeneratingPDF={isGeneratingPDF} /></div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label htmlFor="expense">營業費用: $&nbsp;</label>
                    <NumberFormat onValueChange={setExpense} /></div>

                    {/* <div> 營業淨利: ${profit.toFixed()} </div> */}
                    <div> 營業淨利: $&nbsp;{formatNumber(profit)} </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label htmlFor="nonrevenue">非營業收入: $&nbsp;</label>
                    <NumberFormat onValueChange={setNonrevenue} /></div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label htmlFor="noncost">非營業支出: $&nbsp;</label>
                    <NumberFormat onValueChange={setNoncost} /></div>

                    <div>本期損益: $&nbsp;{formatNumber(income)} </div>
                </div><br />

                <div className="class5">
                    <label>
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
                            <label>● 若年底結算申報採書審/所得額/查帳 淨利率申報淨利為：$&nbsp;</label>
                            <NumberFormat isGeneratingPDF={isGeneratingPDF}/>。</div>

                            <div style={{ display: 'flex', alignItems: 'center' , flexWrap: 'wrap'}}>
                            <label>綜上所述，尚缺憑證金額：$&nbsp;</label>
                            <NumberFormat />，</div>

                            <div style={{ display: 'flex', alignItems: 'center' , flexWrap: 'wrap'}}>
                            <label>建議補成本 $&nbsp;</label>
                            <NumberFormat />元及費用 $&nbsp;
                            <NumberFormat />元。
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'lightgray' }}>
                            <span>如需填寫申報採書審/所得額/查帳，請勾選上方框框。</span>
                        </div>
                    )}
                </div>

                <br />
                <div className="class6">
                    <div>● 其他待補憑證：</div>
                    <div>
                        <textarea
                            rows="4"
                            id="textarea-input"
                            className="textarea-box"
                            placeholder="請在此輸入您的內容..."
                        />
                    </div>
                </div><br />

                <div className="class7">
                    ※成本、費用如有不足情形請儘量補足，避免造成日後國稅局調閱時無法提示帳證，以同業利潤標準遭國稅局逕決！
                </div><br />

                <div className="class8">
                    敬祝 商棋 力達稅務記帳士事務所&nbsp;&nbsp;&nbsp;
                    製表日期
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

                <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '100%', // 或设定具体宽度，例如 '300px'
                    height: '2px',
                    backgroundColor: 'black',
                    marginTop: '5px' // 控制文本和线之间的间距
                }} />
                </div>
                <div className="class9">
                    茲收到貴所提供xx年xx月憑證通知書，並以瞭解本公司目前帳務情況，<br/><br/>
                    簽收：＿＿＿＿＿＿＿＿＿＿＿＿（可撕下簽回聯或PDF電子簽章回傳事務所)
                </div>

            <button id="generatePdfButton" onClick={handleGeneratePDF}>生成 PDF</button>
        </div>


    );
};

export default MyForm;