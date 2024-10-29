import React, { useState } from 'react';

const NumberFormat = ({onValueChange,isGeneratingPDF  }) => {
    const [formattedNumber, setFormattedNumber] = useState('');

    const formatNumber = (num) => {
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handleInputChange = (event) => {
        let inputValue = event.target.value.replace(/,/g, ''); // 去除已存在的逗號

        // 如果輸入是以 0 開頭且長度大於 1，則去除前面的 0
        if (inputValue.length > 1 && inputValue.startsWith('0')) {
            inputValue = inputValue.replace(/^0+/, '');
        }

        if (!isNaN(inputValue) && inputValue !== '') {
            setFormattedNumber(formatNumber(inputValue));
            onValueChange(inputValue); // 傳遞數值給父組件
        } else {
            setFormattedNumber('');
            onValueChange(''); // 傳遞空值給父組件
        }
    };

    return (
        <div>
            <input
                type="text"
                //id={id}
                value={formattedNumber}
                onChange={handleInputChange}
                placeholder="輸入數字"
                //className="input-large"
                className={isGeneratingPDF ? 'pdf-view input-large' : 'web-view input-large'} // 根據 isGeneratingPDF 設定 className
                //style={{ width: '200px', height: '35px', marginRight: '5px', fontSize: '25px' }}
            />
        </div>
    );
};

export default NumberFormat;
