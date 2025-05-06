import React, { useState, useEffect,useRef } from 'react';
import SystemDate from './SystemDate';
import NumberFormat from './NumberFormat';
import FinancialForm from './FinancialForm';
import increaseQuantity from './assets/increase_quantity.png';
import CopyIcon from './assets/copy_icon.png';
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
	const [isSubmitting, setIsSubmitting] = useState(false);  // 控制是否正在提交
	const [quotationList, setQuotationList] = useState([]); //儲存報價單資料
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [copiedId, setCopiedId] = useState(null);
	const [showCopyToast, setShowCopyToast] = useState(false);
	const [serviceItems, setServiceItems] = useState([]);           //代辦明細的下拉式選單
    const [serviceItemsFees, setServiceItemsFees] = useState([]);   //代墊規費的下拉式選單
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
                        const formattedItems = data.items.map(item => {
                            let feeValue = '';
                            if (item.fee) {
                                const numValue = parseInt(item.fee, 10);
                                if (!isNaN(numValue)) {
                                    // 保留原始數值的正負號
                                    feeValue = numValue < 0
                                        ? `-$${Math.abs(numValue).toLocaleString()}`
                                        : `$${numValue.toLocaleString()}`;
                                } else {
                                    feeValue = item.fee; // 非數字值（如"客製化"）
                                }
                            }
                            return {
                                item: item.subtitle || '',
                                fee: feeValue,
                                note: item.note || '',
                                isEditing: false // 添加編輯狀態
                            };
                        });
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
                            setIsModalVisible(false);
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
    const [rows, setRows] = useState([{ item: '', fee: '', note: '', isEditing: false }]);

    // 第二個表格的狀態和處理函數 (代墊規費)
    const [rows2, setRows2] = useState([{ item: '', fee: '', note: '', isEditing: false }]);

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
        setRows([...rows, { item: '', fee: '', note: '', isEditing: false }]);
    };

    // 新增第二個表格的行
    const addRow2 = () => {
        setRows2([...rows2, { item: '', fee: '', note: '', isEditing: false }]);
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


    useEffect(() => {
        const fetchServiceItems = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/getServiceItemsDetails`);
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

    useEffect(() => {
        const fetchServiceItemsFees = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/getServiceItemsFees`);
                const data = await response.json();
                if (data.success && data.service_items) {
                setServiceItemsFees(data.service_items);
                }
            } catch (error) {
                console.error('載入 service_items 失敗:', error);
            }
        };
        fetchServiceItemsFees();
    }, [apiUrl]);

    const isNumericFee = (fee) => {
        return fee === "客製化" || /^-?\$?[\d,]+$/.test(fee);
    };

    const formatCurrencyForDisplay = (value) => {
    if (!value) return '';
    if (value === "客製化") return value; // 直接返回客製化文字

    const isNegative = value.startsWith('-');
    const numValue = value.replace(/[^\d]/g, '');
    const formatted = `$${parseInt(numValue, 10).toLocaleString()}`;
    return isNegative ? `(${formatted})` : formatted;
    };

    // 計算總額（包含兩個表格的數據）
    const calculateTotals = () => {
        let subtotal1 = 0;
        let subtotal2 = 0;

        // 計算第一個表格的小計
  rows.forEach(row => {
    if (row.fee === "客製化") return;

    if (isNumericFee(row.fee)) {
      const isNegative = row.fee.trim().startsWith('-');
      const numValue = row.fee.replace(/[^\d]/g, '');
      const amount = parseInt(numValue, 10);

      if (!isNaN(amount)) {
        subtotal1 += isNegative ? -amount : amount;
      }
    }
  });

        // 計算第二個表格的小計
        rows2.forEach(row => {
    if (row.fee === "客製化") return;

    if (isNumericFee(row.fee)) {
      const isNegative = row.fee.trim().startsWith('-');
      const numValue = row.fee.replace(/[^\d]/g, '');
      const amount = parseInt(numValue, 10);

      if (!isNaN(amount)) {
        subtotal2 += isNegative ? -amount : amount;
      }
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

        // 防止多次提交
        if (isSubmitting) return;  // 如果正在提交，則直接返回

        setIsSubmitting(true);  // 設置為正在提交

        // 檢查是否有任何行的 fee 是非數字
        const hasInvalidFeeInTable1 = rows.some(row => {
            // 去掉 $ 和逗號
            const cleanFee = row.fee.replace(/[$,]/g, '');
            // 檢查去除後的 fee 是否為有效數字
            return isNaN(cleanFee) || cleanFee === '';
        });

        if (hasInvalidFeeInTable1) {
            alert('請輸入數字');
            setIsSubmitting(false);  // 重置為 false，讓用戶可以重新提交
            return;
        }

        const hasInvalidFeeInTable2 = rows2.some(row => {
            // 只有當有選擇項目時才檢查金額
            if (row.item) {
                // 去掉 $ 和逗號
                const cleanFee = row.fee.replace(/[$,]/g, '');
                // 檢查去除後的 fee 是否為有效數字
                return isNaN(cleanFee) || cleanFee === '';
            }
        });

        if (hasInvalidFeeInTable2) {
            alert('請輸入數字');
            setIsSubmitting(false);  // 重置為 false，讓用戶可以重新提交
            return;
        }

    const hasInvalidDiscountTable1 = rows.some(row => {
            const isDiscountItem = row.item.includes("折扣");
            if (isDiscountItem) {
                const isNegative = row.fee.includes('(') || row.fee.startsWith('-');
                return !isNegative; // 如果是折扣項目但不是負數，返回 true
            }
            return false;
        });

        if (hasInvalidDiscountTable1) {
            alert('請確認折扣或優惠項目，金額必須是負數');
            setIsSubmitting(false);
            return;
        }

    const hasInvalidDiscountTable2 = rows2.some(row => {
            const isDiscountItem = row.item.includes("折扣");
            if (isDiscountItem) {
                const isNegative = row.fee.includes('(') || row.fee.startsWith('-');
                return !isNegative; // 如果是折扣項目但不是負數，返回 true
            }
            return false;
        });

        if (hasInvalidDiscountTable2) {
            alert('請確認折扣或優惠項目，金額必須是負數');
            setIsSubmitting(false);
            return;
        }

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
            const items1Data = rows.map((row, index) => {
              // 處理正數和負數
              const isNegative = row.fee.includes('(') || row.fee.startsWith('-');

              // 移除所有非數字字符（保留負號）
              let numValue = row.fee.replace(/[^\d-]/g, '');

              // 確保負數格式正確
              if (isNegative && !numValue.startsWith('-')) {
                numValue = '-' + numValue;
              }

              return {
                request_payment_id: formId,
                subtitle_no: index + 1,
                subtitle: row.item,
                fee: numValue, // 直接存數字格式 (如 3000 或 -3000)
                note: row.note,
                user_name: user
              };
            });

            // 準備第二個表格的細項數據 (request_payment_item2)
            const items2Data = rows2.map((row, index) => {
  const isNegative = row.fee.includes('(') || row.fee.startsWith('-');
  let numValue = row.fee.replace(/[^\d-]/g, '');

  if (isNegative && !numValue.startsWith('-')) {
    numValue = '-' + numValue;
  }

  return {
    request_payment_id: formId,
    subtitle_no: index + 1,
    subtitle: row.item,
    fee: numValue,
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
                    items2: items2Data,
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
                        link.download = '請款單.pdf'; // 設定下載檔案的名稱
                        //link.click(); // 自動觸發下載
                        alert('表單提交成功！');
                        setHasQuotationData(false);
                        setCompanyName('');
                        setOtherContactPerson('');
                        setQuotationId('');
                        setRows([{ item: '', fee: '', note: '' }]);
                        setRows2([{ item: '', fee: '', note: '' }]);
                        setErrorMessage('');

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
            console.error('暫存請款單時發生錯誤:', error);
            setErrorMessage('暫存請款單時發生錯誤');
        } finally {
            setIsSubmitting(false);  // 無論如何，提交完成後重置狀態
        }
    };

// 阻止點擊Enter提交表單
const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            console.log('Prevented Enter key submit');
        }
    };

    const handleShowAllQuotations = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/getAllQuotations?user=${user}`);
            const data = await response.json();

            if (response.ok && data.quotations) {
                setQuotationList(data.quotations);
                setErrorMessage('');
                setIsModalVisible(true);
            } else {
                setQuotationList([]);
                setErrorMessage(data.message || '無法獲取報價單資料');
                setIsModalVisible(false);
            }
        } catch (err) {
            setErrorMessage('查詢失敗，請稍後重試');
            console.error('查詢報價單失敗:', err);
            setIsModalVisible(false);
        }
    };

    const handleToggleQuotationModal = () => {
        if (!isModalVisible) {
            handleShowAllQuotations(); // 每次開啟時都查詢資料
        }
        setIsModalVisible(prev => !prev); // 開關模擬框
    };

    // 複製函式
    const handleCopy = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    setCopiedId(text); // 記錄當前被複製的ID
                    setShowCopyToast(true); // 顯示提示框
                    setTimeout(() => {
                        setCopiedId(null);
                        setShowCopyToast(false); // 2秒後隱藏提示框
                    }, 2000);
                });
        } else {
            // 舊瀏覽器兼容方案
            const tempInput = document.createElement('input');
            tempInput.value = text;
            document.body.appendChild(tempInput);
            tempInput.select();
            try {
                document.execCommand('copy');
                setCopiedId(text);
                setShowCopyToast(true);
                setTimeout(() => {
                    setCopiedId(null);
                    setShowCopyToast(false);
                }, 2000);
            } catch (err) {
                console.error('複製失敗');
            }
            document.body.removeChild(tempInput);
        }
    };


    return (
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <div ref={formRef} className="RequestPayment">

                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                    className="input-large"
                    value={quotationId}
                    onChange={handleQuotationIdChange}
                    placeholder="輸入報價單編號"
                    required />
                    <button type="button" onClick={handleSearch} className="search_button">產生請款單</button>

                    {/* 查詢報價單按鈕 */}
                    <div style={{ flex: 1 }}></div> {/* 元素占用剩餘空間 */}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                            type="button"
                            onClick={handleToggleQuotationModal}
                            className="search_button"
                            style={{ marginLeft: 'auto' }}
                        >
                            {isModalVisible ? '關閉報價單列表' : '查詢所有報價單'}
                        </button>


                        {isModalVisible && (
                            <div className="quotation-modal" >
                                {/* 添加提示框 */}
                                {showCopyToast && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        color: 'white',
                                        padding: '10px 20px',
                                        borderRadius: '5px',
                                        zIndex: 1000,
                                        animation: 'fadeInOut 2s ease-in-out'
                                    }}>
                                        已複製
                                    </div>
                                )}

                                <table className="quotation-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>複製</th>
                                            <th>報價單編號</th>
                                            <th>報價日期</th>
                                            <th>公司名稱</th>
                                            <th>聯絡人</th>
                                            {user.startsWith('lda') && (
                                                <th>建立者</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotationList.length > 0 ? (
                                            quotationList.map((quotation, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                                    <td>
                                                        <img
                                                            src={CopyIcon}
                                                            alt="Copy"
                                                            style={{  cursor: 'pointer' }}
                                                            onClick={() => handleCopy(quotation.quotation_id)}
                                                            title="複製報價單編號"
                                                            />
                                                    </td>
                                                    <td>{quotation.quotation_id}</td>
                                                    <td>{quotation.quotation_date}</td>
                                                    <td style={{ wordBreak: 'break-all', maxWidth: '200px', whiteSpace: 'normal' }}>{quotation.company_name}</td>
                                                    <td>{quotation.company_contact_person}</td>
                                                    {user.startsWith('lda') && (
                                                         <td>{quotation.user_name}</td>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4">{errorMessage || '無報價單資料'}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>


                            </div>
                        )}
                    </div>
                </div>

                {hasQuotationData ? (
                    <>
                <div style={{ display: 'flex'}}>
                    <div style={{ flex: 1.5, textAlign: 'left',fontSize:'30px' }}>請款單</div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <div>請款單編號:{formId}</div>

                        <div>請款日期:{formattedDate}</div>
                    </div>
                </div>

                {!quotationId.includes('L') && (
                    <div style={{ textAlign: 'left' }}>資越管理顧問有限公司</div>
                )}

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
                        className="input-title1"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="請輸入公司名稱"
                        />
                    </div>

                    <div className="input-title-group" style={{ flex: 1}}>
                        <label style={{ marginRight: '8px' }}>聯絡人:</label>
                        <input
                        type="text"
                        className="input-title2"
                        value={otherContactPerson}
                        onChange={(e) => setOtherContactPerson(e.target.value)}
                        placeholder="請輸入聯絡人名稱"
                        />
                    </div>
                </div>

                <div>
                    <h3 style={{textAlign: 'left'}}>一、代辦明細</h3>
                    <table className="RequestPayment-table-wrapper" border="1">
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
                                        className="RequestPayment-table-delete-btn"
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

        // 特別處理空值情況
        if (value === '') {
          const updatedRows = [...rows];
          updatedRows[index].fee = '$非數值';  // 設為默認值 $非數值
          updatedRows[index].isEditing = false;
          setRows(updatedRows);
          return;
        }

        const isNegative = value.startsWith('-');
        const numValue = value.replace(/[^\d]/g, '');
        if (/^-?\d[\d,]*$/.test(value.replace(/,/g, ''))) {
          value = `${isNegative ? '-' : ''}$${parseInt(numValue, 10).toLocaleString()}`;
        }

        const updatedRows = [...rows];
        updatedRows[index].fee = value;
        updatedRows[index].isEditing = false;
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
{/*                 <div className="divider-line" /> */}

                <div className="RequestPayment-table-totalprice">
                    <div className="RequestPayment-row">
                        <div className="RequestPayment-cell-left">小計</div>
                        <div className="RequestPayment-cell-right">{formatCurrency(subtotal1)}</div>
                    </div>
                    <div className="RequestPayment-row">
                        <div className="RequestPayment-cell-left">營業稅</div>
                        <div className="RequestPayment-cell-right">{formatCurrency(tax)}</div>
                    </div>
                    <div className="RequestPayment-row">
                        <div className="RequestPayment-cell-left">合計</div>
                        <div className="RequestPayment-cell-right">{formatCurrency(total)}</div>
                    </div>
                </div>

                <div>
                    <h3 style={{textAlign: 'left'}}>二、代墊規費</h3>
                    <table className="RequestPayment-table-wrapper" border="1">
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
                                        className="RequestPayment-table-delete-btn"
                                        onClick={() => deleteRow2(index)}
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
                const matchedItem = serviceItemsFees.find(item => item.subtitle === selectedSubtitle);
                const updatedRows = [...rows2];
                updatedRows[index].item = selectedSubtitle;
                if (matchedItem) {
                  const feeValue = matchedItem.fee;
                  if (!isNaN(feeValue)) {
                    updatedRows[index].fee = `$${parseInt(feeValue).toLocaleString()}`;
                  } else {
                    updatedRows[index].fee = feeValue;
                  }
                } else {
                  updatedRows[index].fee = '';
                }
                setRows2(updatedRows);
              }}
            >
              <option value="">-- 請選擇項目 --</option>
              {serviceItemsFees.map((item, i) => (
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
        const updatedRows = [...rows2];
        updatedRows[index].fee = e.target.value;
        setRows2(updatedRows);
      }}
      onBlur={(e) => {
        let value = e.target.value.trim();

        if (value === '') {
  const updatedRows = [...rows2];
  updatedRows[index].fee = '$非數值';  // 設為默認值
  updatedRows[index].isEditing = false;
  setRows2(updatedRows);
  return;
}

        const isNegative = value.startsWith('-');
        const numValue = value.replace(/[^\d]/g, '');
        if (/^-?\d[\d,]*$/.test(value.replace(/,/g, ''))) {
          value = `${isNegative ? '-' : ''}$${parseInt(numValue, 10).toLocaleString()}`;
        }

        const updatedRows = [...rows2];
        updatedRows[index].fee = value;
        updatedRows[index].isEditing = false;
        setRows2(updatedRows);
      }}
      style={{ textAlign: 'right' }}
      autoFocus
    />
  ) : (
    <div
      className={row.fee.startsWith('-') ? 'red-text' : ''}
      style={{ textAlign: 'right', cursor: 'pointer' }}
      onClick={() => {
        const updatedRows = [...rows2];
        updatedRows[index].isEditing = true;
        setRows2(updatedRows);
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

                <div className="RequestPayment-table-totalprice">
                    <div className="RequestPayment-row">
                        <div className="RequestPayment-cell-left">合計</div>
                        <div className="RequestPayment-cell-right">{formatCurrency(subtotal2)}</div>
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

                {quotationId.includes('L') ? (
                    <>
                        <div style={{ textAlign: 'left' }}>
                            ◎開立支票：力達稅務記帳士事務所
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ textAlign: 'left' }}>
                            ◎開立支票：資越管理顧問有限公司
                        </div>
                    </>
                )}

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
                <button ref={buttonRef} type="submit" disabled={isSubmitting} className="submit_button">
                    {isSubmitting ? '提交中...' : '提交'}
                </button>



            )}

            {errorMessage && <p style={{ color: 'red', marginLeft: '10px' }}>{errorMessage}</p>}



        </form>
    );
};

export default RequestPayment;