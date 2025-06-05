import React, { useState, useEffect,useRef } from 'react';
import SystemDate from './SystemDate';
import NumberFormat from './NumberFormat';
import FinancialForm from './FinancialForm';
import increaseQuantity from './assets/increase_quantity.png';
import './Quotation.css';

const QuotationLd = ({ user }) => {
	console.log("QuotationLd 收到的 user:", user);  // 打印傳遞來的 user

	const formRef = useRef();
	const [formId, setFormId] = useState('無');  // 表單編號，默認為無
	const [email, setEmail] = useState('lida7239718@gmail.com');
	const [phone, setPhone] = useState('04-7239718 #103');
	const [fax, setFax] = useState('04-7232863');
	const [contactPerson, setContactPerson] = useState('楊小姐');
	const [companyId, setCompanyId] = useState('');
	const [companyName, setCompanyName] = useState('');
	const [otherContactPerson, setOtherContactPerson] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [serviceItems, setServiceItems] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);  // 控制是否正在提交
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
                //const response = await fetch(`${apiUrl}/api/getCompanyName?companyId=${companyId}`);
                const response = await fetch(`/api/getCompanyName?companyId=${companyId}`);
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
        { item: '', fee: '', note: '', isEditing: false }
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



    useEffect(() => {
        const fetchServiceItems = async () => {
            try {
                //const response = await fetch(`${apiUrl}/api/getServiceItemsDetailsLd`);
                const response = await fetch(`/api/getServiceItemsDetailsLd`);
                const data = await response.json();
                if (data.success && data.service_items) {
                    setServiceItems(data.service_items);
                }
            } catch (error) {
                console.error('載入 service_items 失敗:', error);
            }
        };
        fetchServiceItems();
    }, []);

    const isNumericFee = (fee) => {
        return fee === "客製化" || /^-?\$?[\d,]+$/.test(fee);
    };


    const calculateTotals = () => {
        let subtotal = 0;

        rows.forEach(row => {
            if (row.fee === "客製化") return; // 跳過客製化項目

            if (isNumericFee(row.fee)) {
                const isNegative = row.fee.trim().startsWith('-');
                const numValue = row.fee.replace(/[^\d]/g, '');
                const amount = parseInt(numValue, 10);

                if (!isNaN(amount)) {
                    subtotal += isNegative ? -amount : amount;
                }
            }
        });
        const tax = Math.round(subtotal * 0.05);
        const total = subtotal + tax;

        return { subtotal, tax, total };
    };

    const { subtotal, tax, total } = calculateTotals();

    const formatCurrency = (amount) => {
        return `$${amount.toLocaleString()}`;
    };

    const formatCurrencyForDisplay = (value) => {
        if (!value) return '';
        if (value === "客製化") return value; // 直接返回客製化文字

        const isNegative = value.startsWith('-');
        const numValue = value.replace(/[^\d]/g, '');
        const formatted = `$${parseInt(numValue, 10).toLocaleString()}`;
        return isNegative ? `(${formatted})` : formatted;
    };

    const generateQuotationNumber = async (componentName = 'Unknown') => {
        try {
            //const response = await fetch(`${apiUrl}/api/generateQuotationNumber`, {
            const response = await fetch(`/api/generateQuotationNumber`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ componentName }),
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
        generateQuotationNumber('QuotationLd');
    }, []);


    const handleSubmit = async (e, componentName) => {
        setErrorMessage('');
        e.preventDefault();

        // 防止多次提交
        if (isSubmitting) return;  // 如果正在提交，則直接返回
        setIsSubmitting(true);  // 設置為正在提交

        // 檢查是否有任何行的 item 或 fee 是空白
        const hasEmptyFields = rows.some(row => {
            return row.item === '' || row.fee === '';
        });

        if (hasEmptyFields) {
            alert('請輸入數字');
            setIsSubmitting(false);
            return;
        }

        // 檢查是否有任何行的 fee 是非數字
        const hasInvalidFee = rows.some(row => {
            // 去掉 $ 和逗號
            const cleanFee = row.fee.replace(/[$,]/g, '');
            // 檢查去除後的 fee 是否為有效數字
            return isNaN(cleanFee) || cleanFee === '';
        });

        if (hasInvalidFee) {
            alert('請輸入數字');
            setIsSubmitting(false);  // 重置為 false，讓用戶可以重新提交
            return;
        }

        const hasInvalidDiscount = rows.some(row => {
            const isDiscountItem = row.item.includes("折扣");
            if (isDiscountItem) {
                const isNegative = row.fee.includes('(') || row.fee.startsWith('-');
                return !isNegative; // 如果是折扣項目但不是負數，返回 true
            }
            return false;
        });

        if (hasInvalidDiscount) {
            alert('請確認折扣或優惠項目，金額必須是負數');
            setIsSubmitting(false);
            return;
        }

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
                // 處理正數和負數
                const isNegative = row.fee.includes('(') || row.fee.startsWith('-');

                // 移除所有非數字字符（保留負號）
                let numValue = row.fee.replace(/[^\d-]/g, '');

                // 確保負數格式正確
                if (isNegative && !numValue.startsWith('-')) {
                    numValue = '-' + numValue;
                }

                return {
                    quotation_id: formId,
                    subtitle_no: index + 1,
                    subtitle: row.item,
                    fee: numValue, // 直接存數字格式 (如 3000 或 -3000)
                    note: row.note,
                    user_name: user
                };
            });

            //const response = await fetch(`${apiUrl}/api/saveQuotation`, {
            const response = await fetch(`/api/saveQuotation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quotation: quotationData,
                    items: itemsData,
                    componentName: componentName,
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
                    await generateQuotationNumber('QuotationLd');
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
        } finally {
            setIsSubmitting(false);  // 無論如何，提交完成後重置狀態
        }
    };

    return (
        <form onSubmit={(e) => handleSubmit(e, 'QuotationLd')}>
            <div ref={formRef} className="Quotation">
                <div style={{ display: 'flex'}}>
                    <div style={{ flex: 1.5, textAlign: 'left',fontSize:'30px' }}>報價單LD</div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <div>報價單編號:{formId}</div>
                        <div>報價日期:{formattedDate}</div>
                    </div>
                </div>

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
                                                    if (/^-?\d+(\.\d+)?$/.test(feeValue)) {
                                                    updatedRows[index].fee = `$${parseInt(feeValue, 10).toLocaleString()}`;
                                                } else {
                                                    updatedRows[index].fee = feeValue;  // 保留 "客製化"
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
                                        {row.isEditing ? (
                                            <input
                                                type="text"
                                                className="table-seamless-input"
                                                value={row.fee}
                                                onChange={(e) => {
                                                    const updatedRows = [...rows];
                                                    updatedRows[index].fee = e.target.value;
                                                    setRows(updatedRows);
                                                }}
                                                onBlur={(e) => {
                                                    let value = e.target.value.trim();
                                                    const isNegative = value.startsWith('-');
                                                    const numValue = value.replace(/[^\d]/g, '');
                                                    if (/^-?\d[\d,]*$/.test(value.replace(/,/g, ''))) {
                                                        value = `${isNegative ? '-' : ''}$${parseInt(numValue, 10).toLocaleString()}`;
                                                    }
                                                    const updatedRows = [...rows];
                                                    updatedRows[index].fee = value;
                                                    updatedRows[index].isEditing = false; // 離開編輯模式
                                                    setRows(updatedRows);
                                                }}
                                                style={{ textAlign: 'right' }}
                                                autoFocus
                                            />
                                        ) : (
                                            <div
                                                className={row.fee.startsWith('-') ? 'red-text' : ''}
                                                style={{ textAlign: 'right', cursor: 'pointer' }}
                                                onClick={() => {
                                                    const updatedRows = [...rows];
                                                    updatedRows[index].isEditing = true;
                                                    setRows(updatedRows);
                                                }}
                                            >
                                            {formatCurrencyForDisplay(row.fee)}
                                            </div>
                                        )}
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
                    <span style={{ display: 'inline-block', borderBottom: '1px solid white', width: '600px', verticalAlign: 'bottom', marginLeft: '8px' }}> </span>
                </div>

                <div style={{ textAlign: 'center', marginTop: '80px' }}>敬祝 商祺☺</div>
            </div>
            <button ref={buttonRef} type="submit" disabled={isSubmitting} className="submit_button">
                {isSubmitting ? '提交中...' : '提交'}
            </button>
            {errorMessage && <p style={{ color: 'red', marginLeft: '10px' }}>{errorMessage}</p>}
        </form>
    );
};

export default QuotationLd;
