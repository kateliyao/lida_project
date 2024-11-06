import React, { useState } from 'react';

const FinancialNumberFormat = ({ onValueChange, isGeneratingPDF }) => {
    const [inputValue, setInputValue] = useState('');

    const formatNumber = (num) => {
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handleInputChange = (event) => {
        const value = event.target.value.replace(/,/g, ''); // 去除已存在的逗號
        setInputValue(value);
    };

    const handleInputBlur = () => {
    let valueToDisplay = inputValue;

    // 处理负数，记录负号并去掉负号
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
        } else {
            setInputValue(formatted);
            onValueChange(valueToDisplay); // 傳遞格式化後的正數值
        }
    } else {
        setInputValue('');
        onValueChange(''); // 傳遞空值給父組件
    }
};

    return (
        <div>
            <input
                type="text"
                value={formatNumber(inputValue)}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="輸入數字"
                className={isGeneratingPDF ? 'pdf-view input-large' : 'web-view input-large'}
                style={{ textAlign: 'right' }}
            />
        </div>
    );
};

export default FinancialNumberFormat;