import React, { useState, useEffect } from 'react';
import FinancialNumberFormat from './FinancialNumberFormat';
import './FinancialForm.css';

const FinancialForm = ({onRevenueChange,onCostChange,onExpenseChange,onProfitChange,onNonrevenueChange,onNoncostChange,onIncomeChange}) => {
    const [revenue, setRevenue] = useState('');
    const [cost, setCost] = useState('');
    const [expense, setExpense] = useState('');
    const [nonrevenue, setNonrevenue] = useState('');
    const [noncost, setNoncost] = useState('');

    // 營業淨利
    const profit = (Number(revenue) || 0) - (Number(cost) || 0) - (Number(expense) || 0);

    // 本期損益
    const income = (Number(revenue) || 0) - (Number(cost) || 0) - (Number(expense) || 0) + (Number(nonrevenue) || 0) - (Number(noncost) || 0);

    useEffect(() => {
        onRevenueChange(revenue);
        onCostChange(cost);
        onExpenseChange(expense);
        onProfitChange(profit);
        onNonrevenueChange(nonrevenue);
        onNoncostChange(noncost);
        onIncomeChange(income); // 傳遞收入變更
    }, [revenue,cost,expense,profit,nonrevenue,noncost,income
        ,onRevenueChange,onCostChange,onExpenseChange,onProfitChange,onNonrevenueChange,onNoncostChange,onIncomeChange]);


    const formatNumber = (number) => {
        const isNegative = number < 0;
        const formattedNumber = new Intl.NumberFormat().format(Math.abs(number)); // 先取得絕對值後進行千分位格式化
        if (isNegative) {
            return `(${formattedNumber})`; // 負數顯示為括號形式
        }
        return formattedNumber;
    };

    // 設置數字顯示的樣式
    const getNumberStyle = (number) => {
        return number < 0 ? { color: 'red' } : {}; // 負數時設置為紅色字體
    };

    const TransPercent = (revenue, value) => {
        if ((Number(revenue) || 0) === 0) {
            return 0; // 如果分母revenue為0，回傳0
        }
        return (Number(value) || 0) / (Number(revenue) || 0) * 100;
    };

    return (
        <div style={{ padding: '20px', width: '700px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '28px' }}>
                <thead>
                    <tr>
                        <th className="td1"></th>
                        <th className="td2" style={{ backgroundColor: '#192F42' }}>金額</th>
                        <th className="td2" style={{ backgroundColor: '#192F42' }}>%</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="td1">銷貨收入</td>
                        <td className="td3"><FinancialNumberFormat onValueChange={setRevenue} /></td>
                        <td className="td2">100%</td>
                    </tr>
                    <tr>
                        <td className="td1">銷貨成本</td>
                        <td className="td3"><FinancialNumberFormat onValueChange={setCost} /></td>
                        <td className="td2">{TransPercent(revenue, cost).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td className="td1">營業費用</td>
                        <td className="td3"><FinancialNumberFormat onValueChange={setExpense} /></td>
                        <td className="td2">{TransPercent(revenue, expense).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td colSpan="3" style={{ textAlign: 'right', padding: '0' }}>
                            <div style={{ borderTop: '1px solid white', width: '70%', marginLeft: 'auto' }}></div>
                        </td>
                    </tr>
                    <tr>
                        <td className="td1">營業淨利</td>
                        <td className="td3" style={getNumberStyle(profit)}>{formatNumber(profit)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                        <td className="td2">{TransPercent(revenue, profit).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td className="td1">非營業收入</td>
                        <td className="td3"><FinancialNumberFormat onValueChange={setNonrevenue} /></td>
                        <td className="td2">{TransPercent(revenue, nonrevenue).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td className="td1">非營業支出</td>
                        <td className="td3"><FinancialNumberFormat onValueChange={setNoncost} /></td>
                        <td className="td2">{TransPercent(revenue, noncost).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td colSpan="3" style={{ textAlign: 'right', padding: '0' }}>
                            <div style={{ borderTop: '1px solid white', width: '70%', marginLeft: 'auto' }}></div>
                        </td>
                    </tr>
                    <tr>
                        <td className="td1">本期損益(A)</td>
                        <td className="td3" style={getNumberStyle(profit)}>{formatNumber(income)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                        <td className="td2">{TransPercent(revenue, income).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td colSpan="3" style={{ textAlign: 'right', padding: '0' }}>
                            <div style={{ borderTop: '1px solid white', width: '70%', marginLeft: 'auto' }}></div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default FinancialForm;