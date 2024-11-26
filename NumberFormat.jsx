import React, { useState } from 'react';

const NumberFormat = ({ onValueChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [isNegative, setIsNegative] = useState(false); // 追蹤是否為負數

    const formatNumber = (num) => {
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handleInputChange = (event) => {
        const value = event.target.value.replace(/,/g, ''); // 去除已存在的逗號
        setInputValue(value);

        // 判斷數字是否為負數
        if (value.startsWith('-')) {
            setIsNegative(true);
        } else {
            setIsNegative(false);
        }
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
    // 設置數字顯示的樣式
    const getNumberStyle = (number) => {
        // 判断是负数则使用红色字体
        if (isNegative) {
            return { color: 'red' };
        }
        return {}; // 正常情况下無特殊樣式
    };

    return (
        <div>
            <input
                type="text"
                value={formatNumber(inputValue)}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="輸入數字"
                style={{ width:'230px',height: '40px',...getNumberStyle(inputValue),}}

            />
        </div>
    );
};

export default NumberFormat;