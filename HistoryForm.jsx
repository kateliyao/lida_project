import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const HistoryForm = ({ user }) => {
    const [forms, setForms] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeForm, setActiveForm] = useState('STAGE');
    const apiUrl = import.meta.env.VITE_API_URL;
    const [formTypeFilter, setFormTypeFilter] = useState('全部'); // 當前選中的分類
    const [availableFormTypes, setAvailableFormTypes] = useState([]); // 可用的分類選項

    //獲取表單資料
    const fetchForms = async () => {
        if (activeForm === 'STAGE') {
            setIsLoading(true);  // 開始加載數據
            try {
                const response = await fetch(`${apiUrl}/api/historyData?user=${user}`);
                if (!response.ok) {
                    throw new Error('網路回應失敗');
                }
                const data = await response.json();
                if (data.success) {
                    setForms(data.forms);  // 更新表單數據

                    // 提取所有 form_type 並去重，加上「全部」選項
                    const preferredOrder = ['憑證統計表', '報價單', '請款單'];
                    const allTypes = data.forms.map(f => f.form_type);
                    const uniqueTypes = [...new Set(allTypes)];
                    // 按照 preferredOrder 進行排序
                    const sortedTypes = preferredOrder.filter(type => uniqueTypes.includes(type));
                    setAvailableFormTypes(['全部', ...sortedTypes]);
                }
                else {
                    console.error('獲取表單資料失敗', data.message);
                }

            } catch (error) {
                console.error('請求失敗', error);
            }
            finally {
                setIsLoading(false);  // 數據加載完成或失敗後，停止加載狀態
            }
        }
    };
    useEffect(() => {
        fetchForms();
    }, [user, activeForm]);  // 當user或activeForm變化時，重新獲取表單數據

    // 新增：預覽函數
    const handlePreview = async (pdfName) => {
        const pdfUrl = `${apiUrl}/pdfs/${pdfName}`;

        try {
            // 檢查文件是否存在
            const response = await fetch(pdfUrl, { method: 'HEAD' });

            if (response.ok) {
                window.open(pdfUrl, '_blank');
            } else {
                alert(`該檔案已不存在，請至pdfs資料夾檢查`);
            }
        } catch (error) {
            console.error('檢查 PDF 時發生錯誤:', error);
            alert('無法檢查檔案狀態，請稍後再試');
        }
    };

    return (
        <div>
            <h2 style={{ textAlign: 'left' }}>歷史資料</h2>
            {/* 分類按鈕區 */}
            {forms.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    {availableFormTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => setFormTypeFilter(type)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: formTypeFilter === type ? '#EBC857' : '#71777F',
                                color: formTypeFilter === type ? '#122331' : 'white',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '20px'
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            )}

            <ul>
                {isLoading ? (
                    <li>正在加載資料...</li>
                    ) : forms.length > 0 ? (
                    forms
                        .filter(form => formTypeFilter === '全部' || form.form_type === formTypeFilter)
                        .map((form, formIndex) => (
                    <li
                        key={form.form_id}
                        className={formIndex % 2 === 0 ? "dark-bg" : "light-bg"} // 根據索引值設定背景顏色
                        style={{
                        display: 'flex',
                        justifyContent: 'space-between', // 讓內容分布到兩邊，按鈕右對齊
                        alignItems: 'center',
                        padding: '10px',
                    }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' ,wordBreak: 'break-word', maxWidth: '700px', whiteSpace: 'normal',textAlign:'left' }}>
                            <span>{form.pdf_name}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            {/*     限定帳號開頭是lda，才能看到每一份表單的建立者屬於哪一個帳號，其餘ld帳號僅能看到自己成功寄出的資料 */}
                            {user.startsWith('lda') && (
                                <span>{form.user_name}</span>
                            )}

                            {/* 預覽按鈕 */}
                            <button
                                onClick={() => handlePreview(form.pdf_name)}
                                style={{
                                    padding: '8px 15px',
                                    backgroundColor: '#71777F',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '20px'
                                }}
                            >
                                預覽
                            </button>
                        </div>
                    </li>
                ))
                ) : (
                    <li>無表單資料</li>
                )}
            </ul>
        </div>
    );
};

export default HistoryForm;