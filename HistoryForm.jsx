import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const HistoryForm = ({ user }) => {
    const [forms, setForms] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeForm, setActiveForm] = useState('STAGE');
    const apiUrl = import.meta.env.VITE_API_URL;

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

    return (
    <div>
        <h2 style={{ textAlign: 'left' }}>歷史資料</h2>
        <ul>
            {isLoading ? (
                <li>正在加載資料...</li>
                ) : forms.length > 0 ? (
                forms.map((form,formIndex) => (
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
        <div style={{ display: 'flex', alignItems: 'center' , whiteSpace: 'nowrap' }}>
            <span>{form.pdf_name}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
{/*                     限定帳號開頭是lda，才能看到每一份表單的建立者屬於哪一個帳號，其餘ld帳號僅能看到自己成功寄出的資料 */}
                        {user.startsWith('lda') && (
                            <span>{form.user_name}</span>
                        )}
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