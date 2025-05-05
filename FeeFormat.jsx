import React, { useState } from 'react';
import './FeeFormat.css';

const FeeFormat = ({onValueChange, className}) => {
    const [inputValue, setInputValue] = useState('');
    const [inputStyle, setInputStyle] = useState({ textAlign: 'right' });


    const formatNumber = (num) => {
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handleInputChange = (event) => {
        const value = event.target.value.replace(/,/g, ''); // 去除已存在的逗號
        setInputValue(value);
    };

    const handleInputBlur = () => {
        let valueToDisplay = inputValue;

        // 處理負數，紀錄負號並去掉負號
        const isNegative = valueToDisplay.startsWith('-');
        if (isNegative) {
            valueToDisplay = valueToDisplay.slice(1); // 去掉負號
        }

        // 格式化数字
        if (!isNaN(valueToDisplay) && valueToDisplay !== '') {
            const formatted = formatNumber(valueToDisplay);
            if (isNegative) {
                setInputValue(`(${formatted})`); // 負數顯示為括號形式
                onValueChange(`-${valueToDisplay}`); // 傳遞原始負數值
                setInputStyle({ color: 'red', textAlign: 'right' });
            } else {
                setInputValue(formatted);
                onValueChange(valueToDisplay); // 傳遞格式化後的正數值
                setInputStyle({textAlign: 'right' });
            }
        } else {
            setInputValue('');
            onValueChange(''); // 傳遞空值給父組件
            setInputStyle({textAlign: 'right' });
        }
};

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
                }}>$</span>
            <input
                type="text"
                value={formatNumber(inputValue)}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="輸入數字"
                className={className}
                style={{
                    ...inputStyle,  // 動態樣式
                }}
                inputMode="decimal" // 引導輸入為數字或小數點
            />
        </div>
    );
};


export default FeeFormat;