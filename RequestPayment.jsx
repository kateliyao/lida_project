import React, { useState, useEffect,useRef } from 'react';
import SystemDate from './SystemDate';
import NumberFormat from './NumberFormat';
import FinancialForm from './FinancialForm';
import increaseQuantity from './assets/increase_quantity.png';
import './RequestPayment.css';

const RequestPayment = ({ user }) => {
	console.log("RequestPayment 收到的 user:", user);  // 打印傳遞來的 user

	const formRef = useRef();
	const [formId, setFormId] = useState('無');  // 表單編號，默認為無
	const [email, setEmail] = useState('andy770320@gmail.com');
	const [phone, setPhone] = useState('04-7239718 #109');
	const [fax, setFax] = useState('04-7232863');
	const [contactPerson, setContactPerson] = useState('賴先生');
	const [companyName, setCompanyName] = useState('');
	const [otherContactPerson, setOtherContactPerson] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [quotationId, setQuotationId] = useState('');
	const [quotationDate, setQuotationDate] = useState('');
	const [hasQuotationData, setHasQuotationData] = useState(false); // 新增狀態標記是否有報價單數據
    const apiUrl = import.meta.env.VITE_API_URL;

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePhoneChange = (e) => {
        setPhone(e.target.value);
    };

    const handleFaxChange = (e) => {
        setFax(e.target.value);
    };

    const handleContactPersonChange = (e) => {
        setContactPerson(e.target.value);
    };

    const handleQuotationIdChange = (e) => {
        setQuotationId(e.target.value);
    };

    // 透過報價單ID帶出相關資訊
    // 修改 handleSearch 函數
const handleSearch = async (e) => {
    e.preventDefault();
    if (quotationId) {
        try {
            const response = await fetch(`${apiUrl}/api/getQuotation?quotationId=${quotationId}`);
            const data = await response.json();

            if (response.ok && data.quotation) {
                const quotation = data.quotation;
                setCompanyName(quotation.company_name || '');
                setOtherContactPerson(quotation.company_contact_person || '');
                setEmail(quotation.contact_email || '');
                setPhone(quotation.contact_phone || '');
                setFax(quotation.contact_fax || '');
                setContactPerson(quotation.contact_person || '');
                setQuotationDate(quotation.quotation_date || '');

                // 設置項目明細
                if (data.items && data.items.length > 0) {
                    const formattedItems = data.items.map(item => ({
                        item: item.subtitle || '',
                        fee: item.fee ? `$${parseInt(item.fee).toLocaleString()}` : '',
                        note: item.note || ''
                    }));
                    setRows(formattedItems);
                }

                // 只有在成功取得報價單資料後，才產生請款單編號
                try {
                    const paymentResponse = await fetch(`${apiUrl}/api/generateRequestPaymentNumber`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const paymentData = await paymentResponse.json();

                    if (paymentData.success) {
                        setFormId(paymentData.requestPaymentNumber);
                        setHasQuotationData(true);
                        setErrorMessage('');
                    } else {
                        setHasQuotationData(false);
                        setFormId('無');
                        setErrorMessage('生成請款單編號失敗');
                    }
                } catch (err) {
                    setHasQuotationData(false);
                    setFormId('無');
                    setErrorMessage('生成請款單編號時發生錯誤');
                }
            } else {
                setHasQuotationData(false);
                setErrorMessage(data.message || '找不到對應的報價單');
            }
        } catch (err) {
            setHasQuotationData(false);
            setErrorMessage('查詢失敗，請稍後重試');
            console.error('查詢報價單失敗:', err);
        }
    } else {
        setErrorMessage('請輸入報價單編號');
    }
};

// 可以移除原本的 generateRequestPaymentNumber 函數，因為我們已經將它整合到 handleSearch 中

    const buttonRef = useRef();

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0].replace(/-/g, '/'); // 轉換成 YYYY/MM/DD 格式


    // 第一個表格的狀態和處理函數 (代辦明細)
    const [rows, setRows] = useState([{ item: '', fee: '', note: '' }]);

    // 第二個表格的狀態和處理函數 (代墊規費)
    const [rows2, setRows2] = useState([{ item: '', fee: '', note: '' }]);

    // 處理第一個表格的變化
    const handleChange = (index, field, value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        setRows(updatedRows);
    };

    // 處理第二個表格的變化
    const handleChange2 = (index, field, value) => {
        const updatedRows = [...rows2];
        updatedRows[index][field] = value;
        setRows2(updatedRows);
    };

    // 新增第一個表格的行
    const addRow = () => {
        setRows([...rows, { item: '', fee: '', note: '' }]);
    };

    // 新增第二個表格的行
    const addRow2 = () => {
        setRows2([...rows2, { item: '', fee: '', note: '' }]);
    };

    // 刪除第一個表格的行
    const deleteRow = (index) => {
        if (rows.length > 1) {
            const updatedRows = [...rows];
            updatedRows.splice(index, 1);
            setRows(updatedRows);
        } else {
            alert("至少需要保留一行");
        }
    };

    // 刪除第二個表格的行
    const deleteRow2 = (index) => {
        if (rows2.length > 1) {
            const updatedRows = [...rows2];
            updatedRows.splice(index, 1);
            setRows2(updatedRows);
        } else {
            alert("至少需要保留一行");
        }
    };

    const [serviceItems, setServiceItems] = useState([]);

    useEffect(() => {
        const fetchServiceItems = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/getServiceItems`);
                const data = await response.json();
                if (data.success && data.service_items) {
                setServiceItems(data.service_items);
                }
            } catch (error) {
                console.error('載入 service_items 失敗:', error);
            }
        };
        fetchServiceItems();
    }, [apiUrl]);

    // 計算總額（包含兩個表格的數據）
    const calculateTotals = () => {
        let subtotal1 = 0;
        let subtotal2 = 0;

        // 計算第一個表格的小計
        rows.forEach(row => {
            if (row.fee) {
                const numValue = row.fee.replace(/[^\d]/g, '');
                subtotal1 += parseInt(numValue) || 0;
            }
        });

        // 計算第二個表格的小計
        rows2.forEach(row => {
            if (row.fee) {
                const numValue = row.fee.replace(/[^\d]/g, '');
                subtotal2 += parseInt(numValue) || 0;
            }
        });

        const tax = Math.round(subtotal1 * 0.05);
        const total = subtotal1 + tax;
        const finaltotal = total + subtotal2;

        return { subtotal1, subtotal2, tax, total, finaltotal };
    };

    const { subtotal1, subtotal2, tax, total, finaltotal } = calculateTotals();

    // Format currency with commas
    const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
    };


    // 在 Quotation 組件中添加提交處理函數
const handleSubmit = async (e) => {
    e.preventDefault();

    // 驗證必填欄位
//     if (!companyId || !companyName) {
//         setErrorMessage('公司編碼和公司名稱為必填欄位');
//         return;
//     }

    try {
        // 準備主表數據
        const requestPaymentData = {
            request_payment_id: formId,
            request_payment_date: formattedDate,
            quotation_id: quotationId,
            contact_email: email,
            contact_phone: phone,
            contact_fax: fax,
            contact_person: contactPerson,
            company_name: companyName,
            company_contact_person: otherContactPerson,
            details_subtotal_amount: subtotal1,
            details_tax_amount: tax,
            details_total_amount: total,
            fees_total_amount: subtotal2,
            final_total_amount: finaltotal,
            user_name: user
        };

        // 準備第一個表格的細項數據 (request_payment_item1)
        const items1Data  = rows.map((row, index) => {
  const rawFee = row.fee;

  // 將 $ 和 , 移除，保留非數字原樣
  const cleanFee = /^[\d\$,]+$/.test(rawFee)
    ? rawFee.replace(/[,\$]/g, '')
    : rawFee;

  return {
    request_payment_id: formId,
    subtitle_no: index + 1,
    subtitle: row.item,
    fee: cleanFee,
    note: row.note,
    user_name: user
  };
});

// 準備第二個表格的細項數據 (request_payment_item2)
        const items2Data = rows2.map((row, index) => {
            const rawFee = row.fee;
            // 將 $ 和 , 移除，保留非數字原樣
            const cleanFee = /^[\d\$,]+$/.test(rawFee)
                ? rawFee.replace(/[,\$]/g, '')
                : rawFee;

            return {
                request_payment_id: formId,
                subtitle_no: index + 1,
                subtitle: row.item,
                fee: cleanFee,
                note: row.note,
                user_name: user
            };
        });


        // 發送請求到後端
        const response = await fetch(`${apiUrl}/api/saveRequestPayment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requestPayment: requestPaymentData,
                items1: items1Data,
                items2: items2Data
            }),
        });

        const result = await response.json();

        if (response.ok) {
            if (result.success) {
                alert('請款單提交成功！');
            } else {
                setErrorMessage(result.message || '提交失敗');
                alert('提交失敗: ' + result.message);
            }
                // 判斷回應的類型是否為 PDF
//                 const contentType = response.headers.get('Content-Type');
//                 if (contentType && contentType.includes('application/pdf')) {
//                     // 如果是 PDF，獲取 PDF 文件的 blob 資料
//                     const blob = await response.blob();
//                     // 創建一個臨時連結來觸發文件下載
//                     const link = document.createElement('a');
//                     link.href = URL.createObjectURL(blob); // 創建 blob 物件 URL
//                     link.download = '憑證統計表.pdf'; // 設定下載檔案的名稱
//                     //link.click(); // 自動觸發下載
//                     alert('表單提交成功！');
//                 } else {
//                     // 如果不是 PDF，嘗試讀取 JSON 錯誤訊息
//                     const result = await response.json();
//                     console.error('提交表單失敗:', result.message);
//                     alert('提交表單失敗: ' + result.message);
//                 }
        } else {
            setErrorMessage(result.message || '暫存失敗');
        }
    } catch (error) {
        console.error('暫存報價單時發生錯誤:', error);
        setErrorMessage('暫存報價單時發生錯誤');
    }
};

// 阻止點擊Enter提交表單
const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            console.log('Prevented Enter key submit');
        }
    };

    return (
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <div ref={formRef} className="Quotation">

                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                    className="input-large"
                    value={quotationId}
                    onChange={handleQuotationIdChange}
                    placeholder="輸入報價單編號"
                    required />
                    <button type="button" onClick={handleSearch} className="search_button">產生請款單</button>
                </div>

                {hasQuotationData ? (
                    <>
                <div style={{ display: 'flex'}}>
                    <div style={{ flex: 1.5, textAlign: 'left',fontSize:'30px' }}>請款單</div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <div>請款單編號:{formId}
                            {errorMessage && <p style={{ color: 'red', marginLeft: '10px' }}>{errorMessage}</p>}
                        </div>

                        <div>請款日期:{formattedDate}</div>
                    </div>
                </div>
                <div style={{ textAlign: 'left' }}>資越管理顧問有限公司</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', textAlign: 'left' }}>
                        <label style={{ marginRight: '8px' }}>Email:</label>
                        <input
                        className="input-email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="輸入信箱"
                        required />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', textAlign: 'left' }}>
                        <label style={{ marginRight: '8px' }}>電話:</label>
                        <input
                        className="input-phone"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="輸入電話號碼"
                        required />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', textAlign: 'left' }}>
                        <label style={{ marginRight: '8px' }}>傳真:</label>
                        <input
                        className="input-fax"
                        value={fax}
                        onChange={handleFaxChange}
                        placeholder="輸入傳真號碼"
                        required />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', textAlign: 'left' }}>
                        <label style={{ marginRight: '8px' }}>聯絡人:</label>
                        <input
                        className="input-contactPerson"
                        value={contactPerson}
                        onChange={handleContactPersonChange}
                        placeholder="輸入聯絡人"
                        required />
                    </div>
                </div>



                <div className="title">
                    <div className="input-title-group" style={{ flex: 1.5}}>
                        <label style={{ marginRight: '8px' }}>TO</label>
                        <input
                        type="text"
                        className="input-title"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="請輸入公司名稱"
                        />
                    </div>

                    <div className="input-title-group" style={{ flex: 1}}>
                        <label style={{ marginRight: '8px' }}>聯絡人:</label>
                        <input
                        type="text"
                        className="input-title"
                        value={otherContactPerson}
                        onChange={(e) => setOtherContactPerson(e.target.value)}
                        placeholder="請輸入聯絡人名稱"
                        />
                    </div>
                </div>

                <div>
                    <h2 style={{textAlign: 'left'}}>一、代辦明細</h2>
                    <table className="Quotation-table-wrapper" border="1">
                        <thead>
                            <tr>
                            <th></th> {/* 新增操作欄位標題 */}
                            <th>項次</th>
                            <th>項目</th>
                            <th>單價（未稅）</th>
                            <th>備註</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={`table1-${index}`}>
                                    <td>
                                        <button
                                        type="button"
                                        className="Quotation-table-delete-btn"
                                        onClick={() => deleteRow(index)}
                                        >
                                        X
                                        </button>
                                    </td>
                                    <td>{index + 1}</td>
                                    <td className="table-seamless-cell">
                                        <select
                                        className="select_items"
                                        value={row.item}
                                        onChange={(e) => {
                                        const selectedSubtitle = e.target.value;
                                        const matchedItem = serviceItems.find(item => item.subtitle === selectedSubtitle);
                                        const updatedRows = [...rows];
                                        updatedRows[index].item = selectedSubtitle;
                                        if (matchedItem) {
                                          const feeValue = matchedItem.fee;
                                          if (!isNaN(feeValue)) {
                                            updatedRows[index].fee = `$${parseInt(feeValue).toLocaleString()}`;
                                          } else {
                                            updatedRows[index].fee = feeValue;  // 非數字，保留原樣
                                          }
                                        } else {
                                          updatedRows[index].fee = '';
                                        }
                                        setRows(updatedRows);
                                        }}
                                        >
                                        <option value="">-- 請選擇項目 --</option>
                                        {serviceItems.map((item, i) => (
                                        <option key={i} value={item.subtitle}>
                                        {item.subtitle}
                                        </option>
                                        ))}
                                        </select>
                                    </td>

                                    <td className="table-seamless-cell">
                                        <input
                                        type="text"
                                        className="table-seamless-input"
                                        value={row.fee}
                                        onChange={(e) => {
                                        let value = e.target.value;

                                        // 如果是數字或貨幣格式，則處理格式化
                                        if (/^[\d,]+$/.test(value.replace(/\$/g, ''))) {
                                        const numValue = value.replace(/[^\d]/g, '');
                                        if (numValue) {
                                        value = `$${parseInt(numValue, 10).toLocaleString()}`;
                                        } else {
                                        value = '';
                                        }
                                        }

                                        const updatedRows = [...rows];
                                        updatedRows[index].fee = value;
                                        setRows(updatedRows);
                                        }}
                                        onBlur={(e) => {
                                        const value = e.target.value;
                                        if (/^\$?[\d,]+$/.test(value)) {
                                        const numValue = value.replace(/[^\d]/g, '');
                                        const updatedRows = [...rows];
                                        updatedRows[index].fee = numValue ? `$${parseInt(numValue, 10).toLocaleString()}` : '';
                                        setRows(updatedRows);
                                        }
                                        }}
                                        style={{ textAlign: 'right' }}
                                        />
                                    </td>

                                    <td className="table-seamless-cell">
                                        <input
                                        type="text"
                                        className="table-seamless-input"
                                        value={row.note}
                                        onChange={(e) => handleChange(index, 'note', e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button type="button" onClick={addRow} style={{ marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <img src={increaseQuantity} alt="新增列" style={{ width: '40px', height: '40px' }} />
                    </button>
                </div>

                {/* 長直線 */}
{/*                 <div className="divider-line" /> */}

                <div className="Quotation-table-totalprice">
                    <div className="Quotation-row">
                        <div className="Quotation-cell left">小計</div>
                        <div className="Quotation-cell right">{formatCurrency(subtotal1)}</div>
                    </div>
                    <div className="Quotation-row">
                        <div className="Quotation-cell left">營業稅</div>
                        <div className="Quotation-cell right">{formatCurrency(tax)}</div>
                    </div>
                    <div className="Quotation-row">
                        <div className="Quotation-cell left">合計</div>
                        <div className="Quotation-cell right">{formatCurrency(total)}</div>
                    </div>
                </div>


                <div>
                    <h2 style={{textAlign: 'left'}}>二、代墊規費</h2>
                    <table className="Quotation-table-wrapper" border="1">
                        <thead>
                            <tr>
                            <th></th> {/* 新增操作欄位標題 */}
                            <th>項次</th>
                            <th>項目</th>
                            <th>金額</th>
                            <th>備註</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows2.map((row, index) => (
                                <tr key={`table2-${index}`}>
                                    <td>
                                        <button
                                        type="button"
                                        className="Quotation-table-delete-btn"
                                        onClick={() => deleteRow2(index)}
                                        >
                                        X
                                        </button>
                                    </td>
                                    <td>{index + 1}</td>
                                    <td className="table-seamless-cell">
                                        <input
                                        type="text"
                                        className="table-seamless-input"
                                        value={row.item}
                                        onChange={(e) => handleChange2(index, 'item', e.target.value)}
                                        />
                                    </td>

                                    <td className="table-seamless-cell">
                                        <input
                                        type="text"
                                        className="table-seamless-input"
                                        value={row.fee}
                                        onChange={(e) => {
                                        let value = e.target.value;

                                        // 如果是數字或貨幣格式，則處理格式化
                                        if (/^[\d,]+$/.test(value.replace(/\$/g, ''))) {
                                        const numValue = value.replace(/[^\d]/g, '');
                                        if (numValue) {
                                        value = `$${parseInt(numValue, 10).toLocaleString()}`;
                                        } else {
                                        value = '';
                                        }
                                        }

                                        const updatedRows = [...rows2];
                                        updatedRows[index].fee = value;
                                        setRows2(updatedRows);
                                        }}
                                        onBlur={(e) => {
                                        const value = e.target.value;
                                        if (/^\$?[\d,]+$/.test(value)) {
                                        const numValue = value.replace(/[^\d]/g, '');
                                        const updatedRows = [...rows2];
                                        updatedRows[index].fee = numValue ? `$${parseInt(numValue, 10).toLocaleString()}` : '';
                                        setRows2(updatedRows);
                                        }
                                        }}
                                        style={{ textAlign: 'right' }}
                                        />
                                    </td>

                                    <td className="table-seamless-cell">
                                        <input
                                        type="text"
                                        className="table-seamless-input"
                                        value={row.note}
                                        onChange={(e) => handleChange2(index, 'note', e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button type="button" onClick={addRow2} style={{ marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <img src={increaseQuantity} alt="新增列" style={{ width: '40px', height: '40px' }} />
                    </button>
                </div>

{/*                 <div className="divider-line" /> */}

                <div className="Quotation-table-totalprice">
                    <div className="Quotation-row">
                        <div className="Quotation-cell left">合計</div>
                        <div className="Quotation-cell right">{formatCurrency(subtotal2)}</div>
                    </div>
                </div>

                <h2 style={{ textAlign: 'right' }}>合計應收:&nbsp;&nbsp;{formatCurrency(finaltotal)}</h2>
                <div className="divider-line" />


                <div style={{ textAlign: 'left' }}>
  ◎匯款帳號：
  <span style={{ color: 'white', fontWeight: 'bold' }}>
    彰化一信(158)　曉陽分社
    <span style={{
      border: '1px solid white',
      padding: '2px 4px',
      marginLeft: '4px',
      display: 'inline-block',
    }}>
      0037-11-17922-8-0
    </span>
  </span>
</div>

                <div style={{ textAlign: 'left' }}>◎開立支票：資越管理顧問有限公司</div>
                <div style={{ textAlign: 'left', marginTop: '50px'}}>**匯款或寄出支票請通知本公司以利及時對帳，萬分感謝☺</div>

             </>
                ) : (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '90vh', // 讓 div 高度為整個視窗高度
                        textAlign: 'center',
                    }}>
                        {errorMessage ? (
                            <p style={{ color: 'red',fontSize:'28px' }}>{errorMessage}</p>
                        ) : (
                            <p style={{fontSize:'28px' }}>請輸入報價單編號並點擊&lt;產生請款單&gt;按鈕</p>
                        )}
                    </div>
                )}
            </div>
            {hasQuotationData && (
                <button ref={buttonRef} type="submit" className="submit_button">提交</button>
            )}
        </form>
    );
};

export default RequestPayment;