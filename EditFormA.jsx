import React, { useState, useEffect } from 'react';
import './FormA.css';

const EditFormA = ({ user, formId }) => {
    const [formData, setFormData] = useState(null);
    const [error, setError] = useState(null);
    const [year1, setYear1] = useState('');
    const [month1, setMonth1] = useState('');
    const apiUrl = import.meta.env.VITE_API_URL;

    // Use useEffect to fetch data when the formId changes
    useEffect(() => {
        const fetchFormHistoryData = async () => {
            try {
                // 先檢查formId是否有效
                if (!formId) {
                    setError('表單編號無效');
                    return;
                }

                // 向後端發送請求獲取表單資料
                const response = await fetch(`${apiUrl}/api/getFormHistoryData?formId=${formId}`);
                const data = await response.json();

                if (response.ok) {
                    // 成功返回資料，設置formData
                    setFormData({
                        formId: data.formId,
                        companyName: data.companyName,
                        formTitleYear: data.formTitleYear,
                        formTitleMonth: data.formTitleMonth
                    });
                    // 初始化year1為資料庫中的年份
                    setYear1(data.formTitleYear);
                    setMonth1(data.formTitleMonth);
                    setError(null);  // 清空錯誤訊息
                } else {
                    // 如果回應不是200，設置錯誤訊息
                    setError(data.message || '查詢失敗');
                }
            } catch (err) {
                setError('無法獲取表單資料');
                console.error('Error fetching form data:', err);
            }
        };
        fetchFormHistoryData();
    }, [formId]);  // 依賴formId，每次formId變動時都會重新發送請求

    const handleYear1Change = (e) => {
        setYear1(e.target.value);
    };

    const handleMonth1Change = (e) => {
        setMonth1(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("handleSubmit 被調用"); // 檢查是否多次調用

        const formData = {
                formId,
                year1
        };
        console.log('提交的表單數據:', formData); // 確認提交的數據

        try {
            const response = await fetch(`${apiUrl}/api/renewForm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

//             if (response.ok) {
//                 const result = await response.json();
//                 // 如果沒有錯誤訊息，顯示成功提示
//                 if (result.message !== '年份更新成功') {
//                     console.error('提交表單失敗:', result.message);
//                     alert('提交表單失敗: ' + result.message);
//                 } else {
//                     alert('表單提交成功！');
//                 }
//             } else {
//                 // 如果回傳的 HTTP 狀態碼不是 2xx，讀取錯誤訊息
//                 const error = await response.json();
//                 console.error('提交表單失敗:', error.message);
//                 alert('提交表單失敗: ' + error.message);
//             }
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
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="FormA">
                <div className="form-container">
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {formData ? (
                        <div>
                            <div style={{ textAlign: 'left' }}>憑證統計表</div>
                            <div style={{ textAlign: 'left' }}>編號: {formData.formId}</div>
                            <div className="title">
                                {formData.companyName}
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
                        </div>
                    ) : (
                        <p>載入中...</p>
                    )}
                </div>
            </div>
            <button type="submit" className="renew_button">更新檔案</button>
        </form>
    );
};

export default EditFormA;
