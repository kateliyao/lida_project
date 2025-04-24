import React, { useState, useEffect,useRef } from 'react';
import SystemDate from './SystemDate';
import NumberFormat from './NumberFormat';
import FinancialForm from './FinancialForm';
import increaseQuantity from './assets/increase_quantity.png';
import './Quotation.css';

const Quotation = ({ user }) => {
	console.log("Quotation 收到的 user:", user);  // 打印傳遞來的 user

	const formRef = useRef();
	const [formId, setFormId] = useState('無');  // 表單編號，默認為無
	const [email, setEmail] = useState('andy770320@gmail.com');
	const [phone, setPhone] = useState('04-7239718 #109');
	const [fax, setFax] = useState('04-7232863');
	const [contactPerson, setContactPerson] = useState('賴先生');
	const [companyId, setCompanyId] = useState('');
	const [companyName, setCompanyName] = useState('');
	const [otherContactPerson, setOtherContactPerson] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
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

    const handleCompanyIdChange = (e) => {
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
                    setCompanyName(data.companyName);
                    setErrorMessage('');
                } else {
                    setCompanyName('');
                    setErrorMessage('找不到對應的公司名稱');
                }
            } catch (err) {
                setErrorMessage('查詢失敗，請稍後重試');
            }
        } else {
            setErrorMessage('請輸入公司編碼');
        }
    };

    const buttonRef = useRef();

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0].replace(/-/g, '/'); // 轉換成 YYYY/MM/DD 格式


    const [rows, setRows] = useState([
    { item: '', fee: '', note: '' }
        ]);

    const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
    };

    const addRow = () => {
    setRows([...rows, { item: '', fee: '', note: '' }]);
    };

    // 新增刪除行的函數
    const deleteRow = (index) => {
    if (rows.length > 1) { // 至少保留一行
    const updatedRows = [...rows];
    updatedRows.splice(index, 1);
    setRows(updatedRows);
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

    const calculateTotals = () => {
  let subtotal = 0;

  rows.forEach(row => {
    if (row.fee) {
      // 從格式化值中提取數字（移除$和逗號）
      const numValue = row.fee.replace(/[^\d]/g, '');
      subtotal += parseInt(numValue) || 0;
    }
  });

  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  return { subtotal, tax, total };
};

  const { subtotal, tax, total } = calculateTotals();

  // Format currency with commas
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };



  const generateQuotationNumber = async () => {
    try {
        const response = await fetch(`${apiUrl}/api/generateQuotationNumber`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();

        if (data.success) {
            setFormId(data.quotationNumber);
        } else {
            setFormId('無');
            setErrorMessage('生成報價單編號失敗');
        }
    } catch (err) {
        setFormId('無');
        setErrorMessage('生成報價單編號時發生錯誤');
    }
};

// 在組件掛載時或適當的時候調用此函數
useEffect(() => {
    generateQuotationNumber();
}, []);

    // 在 Quotation 組件中添加提交處理函數
    const handleSubmit = async (e) => {
        setErrorMessage('');
        e.preventDefault();

        // 檢查是否有任何行的 item 或 fee 是空白
        const hasEmptyFields = rows.some(row => {
            return row.item === '' || row.fee === '';
        });

        if (hasEmptyFields) {
            alert('請正確選擇項目並確認單價(未稅)包含金額後再提交');
            return;
        }


        // 檢查是否有任何行的 fee 是 "客製化"
        const hasCustomizedFee = rows.some(row =>
            typeof row.fee === 'string' && row.fee.includes('客製化')
        );

        if (hasCustomizedFee) {
            alert('請將所有「單價(未稅)」欄位中的「客製化」更改為具體數字後再提交');
            return;
        }

        // 驗證必填欄位
    //     if (!companyId || !companyName) {
    //         setErrorMessage('公司編碼和公司名稱為必填欄位');
    //         return;
    //     }

        try {
            // 準備主表數據
            const quotationData = {
                quotation_id: formId,
                quotation_date: formattedDate,
                contact_email: email,
                contact_phone: phone,
                contact_fax: fax,
                contact_person: contactPerson,
                company_name: companyName,
                company_contact_person: otherContactPerson,
                subtotal_amount: subtotal,
                tax_amount: tax,
                total_amount: total,
                user_name: user
            };

            // 準備細項數據
            const itemsData = rows.map((row, index) => {
      const rawFee = row.fee;

      // 將 $ 和 , 移除，保留非數字原樣
      const cleanFee = /^[\d\$,]+$/.test(rawFee)
        ? rawFee.replace(/[,\$]/g, '')
        : rawFee;

      return {
        quotation_id: formId,
        subtitle_no: index + 1,
        subtitle: row.item,
        fee: cleanFee,
        note: row.note,
        user_name: user
      };
    });


        // 發送請求到後端
        const response = await fetch(`${apiUrl}/api/saveQuotation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                quotation: quotationData,
                items: itemsData
            }),
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
                    link.download = '報價單.pdf'; // 設定下載檔案的名稱
                    //link.click(); // 自動觸發下載
                    alert('表單提交成功！');

                    // 重置表單狀態
                    setRows([{ item: '', fee: '', note: '' }]);
                    setCompanyId('');
                    setCompanyName('');
                    setOtherContactPerson('');
                    setErrorMessage('');

                    // 生成新的報價單編號
                    await generateQuotationNumber();
                } else {
                    // 如果不是 PDF，嘗試讀取 JSON 錯誤訊息
                    const result = await response.json();
                    console.error('提交表單失敗:', result.message);
                    alert('提交表單失敗: ' + result.message);
                }
        } else {
            const result = await response.json();
            setErrorMessage(result.message || '暫存失敗');
        }
    } catch (error) {
        console.error('暫存報價單時發生錯誤:', error);
        setErrorMessage('暫存報價單時發生錯誤');
    }
};

    return (
        <form onSubmit={handleSubmit}>
            <div ref={formRef} className="Quotation">
                <div style={{ display: 'flex'}}>
                    <div style={{ flex: 1.5, textAlign: 'left',fontSize:'30px' }}>報價單</div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <div>報價單編號:{formId}</div>

                        <div>報價日期:{formattedDate}</div>
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

                <div style={{ display: 'flex', alignItems: 'center',marginTop:'30px' }}>
                    <input
                    className="input-large"
                    value={companyId}
                    onChange={handleCompanyIdChange}
                    placeholder="輸入公司編碼"
                    />
                    <button type="button" onClick={handleSearch} className="search_button">查詢公司名稱</button>
                </div>

                <div className="title">
                    <div className="input-title-group" style={{ flex: 1.5}}>
                        <label style={{ marginRight: '8px' }}>TO</label>
                        <input
                        type="text"
                        className="input-title1"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="請輸入公司名稱"
                        required />
                    </div>

                    <div className="input-title-group" style={{ flex: 1}}>
                        <label style={{ marginRight: '8px' }}>聯絡人:</label>
                        <input
                        type="text"
                        className="input-title2"
                        value={otherContactPerson}
                        onChange={(e) => setOtherContactPerson(e.target.value)}
                        placeholder="請輸入聯絡人名稱"
                        required />
                    </div>
                </div>

                <div>
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
                                <tr key={index}>
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
                <div className="divider-line" />

                <div className="Quotation-table-totalprice">
                    <div className="Quotation-row">
                    <div className="Quotation-cell-left">小計</div>
                    <div className="Quotation-cell-right">{formatCurrency(subtotal)}</div>
                    </div>
                    <div className="Quotation-row">
                    <div className="Quotation-cell-left">營業稅</div>
                    <div className="Quotation-cell-right">{formatCurrency(tax)}</div>
                    </div>
                    <div className="Quotation-row">
                    <div className="Quotation-cell-left">合計</div>
                    <div className="Quotation-cell-right">{formatCurrency(total)}</div>
                    </div>
                </div>


<div style={{ textAlign: 'left' }}>◎申請案件草稿經出具後取消申請者，仍需酌收工本作業費。</div>
<div style={{ textAlign: 'left' }}>
  ◎以上報價
  <span style={{ fontWeight: 'bold', borderBottom: '1px solid white' }}>
    不含政府規費
  </span>
  及
  <span style={{ fontWeight: 'bold', borderBottom: '1px solid white' }}>
    其他實際支出費用
  </span>。
</div>

<div style={{ textAlign: 'left', marginTop: '80px'}}>
    若要接受此報價，請在此簽名後回傳：
    <span style={{ display: 'inline-block', borderBottom: '1px solid white', width: '600px', verticalAlign: 'bottom', marginLeft: '8px' }}></span>
</div>

<div style={{ textAlign: 'center', marginTop: '80px' }}>敬祝 商祺☺</div>


            </div>
                    <button ref={buttonRef} type="submit" className="submit_button">提交</button>
                    {errorMessage && <p style={{ color: 'red', marginLeft: '10px' }}>{errorMessage}</p>}
        </form>
    );
};

export default Quotation;