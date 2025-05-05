import React, { useState, useEffect } from 'react';
import increaseQuantity from './assets/increase_quantity.png';
import './ServiceItem.css';

const ServiceItem = ({ user }) => {
    console.log("ServiceItem 收到的 user:", user);
    const apiUrl = import.meta.env.VITE_API_URL;
    const [rows, setRows] = useState([{ title: '', subtitle: '', fee: '', note: '' }]);
    const [isEditing, setIsEditing] = useState(false); //確認是否編輯中

    const fetchServiceItems = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/getServiceItems`);
            // 先確認回應狀態
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('後端返回資料:', data); // 除錯用

            if (data.success && data.service_items) {
                const formatted = data.service_items.map(item => ({
                    title: item.title || '',
                    subtitle: item.subtitle || '',
                    fee: item.fee !== undefined ? item.fee.toString() : '0',
                    note: item.note || ''
                }));
                console.log('格式化後資料:', formatted); // 除錯用
                setRows(formatted.length > 0 ? formatted : [{ title: '', subtitle: '', fee: '', note: '' }]);
            } else {
                console.warn('後端返回成功但無資料');
                setRows([{ title: '', subtitle: '', fee: '', note: '' }]);
            }
        } catch (error) {
            console.error('載入資料失敗:', error);
            setRows([{ title: '', subtitle: '', fee: '', note: '' }]);
        }
    };

    useEffect(() => {
        fetchServiceItems();
    }, [apiUrl]);

    const handleChange = (index, field, value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        setRows(updatedRows);
    };

    const addRow = () => {
        setRows([...rows, { title: '', subtitle: '', fee: '', note: '' }]);
    };

    const deleteRow = (index) => {
        if (rows.length > 1) {
            const updatedRows = [...rows];
            updatedRows.splice(index, 1);
            setRows(updatedRows);
            } else {
            alert("至少需要保留一行");
        }
    };

    const submitServiceItems = async () => {
        // 過濾掉完全為空的列（可選）
        const nonEmptyRows = rows.filter(row =>
            row.title.trim() || row.subtitle.trim() || row.fee.trim() || row.note.trim()
        );

        const payload = (nonEmptyRows.length > 0 ? nonEmptyRows : rows).map(row => ({
            title: row.title,
            subtitle: row.subtitle,
            fee: row.fee.replace(/[$,]/g, ''),
            note: row.note,
            user_name: user
        }));

        try {
            const response = await fetch(`${apiUrl}/api/submitServiceItem`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items: payload })
            });

            const result = await response.json();
            if (result.success) {
                alert('資料儲存成功！');
                setIsEditing(false); //還原編輯狀態
            } else {
                alert('儲存失敗：' + result.message);
            }
        } catch (error) {
            console.error('提交錯誤:', error);
            alert('發生錯誤，請稍後再試');
        }
    };

    // 檢查是否為數字或貨幣格式
    const isNumeric = (value) => {
        return /^[\d,]+$/.test(value.replace(/\$/g, ''));
    };

    // 格式化貨幣顯示
    const formatCurrency = (value) => {
        if (value === '' || value === null || value === undefined) return '';
        if (isNumeric(value)) {
            const numValue = value.replace(/[^\d]/g, '');
            return numValue ? `$${parseInt(numValue, 10).toLocaleString()}` : '';
        }
        return value; // 非數字保持原樣
    };

    return (
        <div className="ServiceItem">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '50px' }}>
                <span>若需要調整工商項目的內容，請點擊右側&lt;更改設定&gt;的按鈕</span>
                <button
                    className="ServiceItem-modify-btn"
                    onClick={() => {
                        if (isEditing) {
                            // 取消編輯時重新取得資料
                            fetchServiceItems();
                        }
                        setIsEditing(prev => !prev);
                    }}
                >
                    {isEditing ? '更改中,取消更改' : '更改設定'}
                </button>
            </div>

            <table className="ServiceItem-table-wrapper" border="1">
                <thead>
                    <tr>
                    <th></th>
                    <th>項次</th>
                    <th>主項目</th>
                    <th>明細項</th>
                    <th>價格</th>
                    <th>備註</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, index) => (
                    <tr key={index}>
                        <td>
                            {isEditing && (
                            <button
                                type="button"
                                className="ServiceItem-table-delete-btn"
                                onClick={() => deleteRow(index)}
                            >
                            X
                            </button>
                            )}
                        </td>
                        <td>{index + 1}</td>
                        <td>
                            <input
                                type="text"
                                className="serviceitem-input"
                                value={row.title}
                                onChange={(e) => handleChange(index, 'title', e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                className="serviceitem-input"
                                value={row.subtitle}
                                onChange={(e) => handleChange(index, 'subtitle', e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                                    type="text"
                                    className="serviceitem-input"
                                    value={formatCurrency(row.fee)}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        // 如果是數字或貨幣格式，則處理格式化
                                        if (isNumeric(value)) {
                                            const numValue = value.replace(/[^\d]/g, '');
                                            if (numValue) {
                                                value = `$${parseInt(numValue, 10).toLocaleString()}`;
                                            } else {
                                                value = '';
                                            }
                                        }
                                        handleChange(index, 'fee', value);
                                    }}
                                    onBlur={(e) => {
                                        const value = e.target.value;
                                        if (isNumeric(value)) {
                                            const numValue = value.replace(/[^\d]/g, '');
                                            const updatedRows = [...rows];
                                            updatedRows[index].fee = numValue ? `$${parseInt(numValue, 10).toLocaleString()}` : '';
                                            setRows(updatedRows);
                                        }
                                    }}
                                    style={{ textAlign: 'right' }}
                                    disabled={!isEditing}
                                />
                        </td>
                        <td>
                            <input
                                type="text"
                                className="serviceitem-input"
                                value={row.note}
                                onChange={(e) => handleChange(index, 'note', e.target.value)}
                            />
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>

            {isEditing && (
                <button onClick={addRow} style={{ marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <img src={increaseQuantity} alt="新增列" style={{ width: '40px', height: '40px' }} />
                </button>
            )}

            {isEditing && (
                <div style={{ position: 'fixed', bottom: '20px', left: '60%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                    <button className="submit-button-fixed" onClick={submitServiceItems}>
                        提交
                    </button>
                </div>
            )}
        </div>
    );
};

export default ServiceItem;
