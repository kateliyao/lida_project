import React, { useState, useEffect } from 'react';
import FinancialNumberFormat from './FinancialNumberFormat';
import './FinancialForm.css';

const FinancialForm = ({ onNetIncomeChange  }) => {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // 经营相关的状态
    const [revenue, setRevenue] = useState('');
    const [cost, setCost] = useState('');
    const [expense, setExpense] = useState('');
    const [nonrevenue, setNonrevenue] = useState('');
    const [noncost, setNoncost] = useState('');

    

    // 计算净利
    const profit = (Number(revenue) || 0) - (Number(cost) || 0) - (Number(expense) || 0);

    // 计算本期损益
    const income = (Number(revenue) || 0) - (Number(cost) || 0) - (Number(expense) || 0) + (Number(nonrevenue) || 0) - (Number(noncost) || 0);

    // 每次 income 更新时调用 onIncomeChange
//     useEffect(() => {
//         onIncomeChange(income);
//     }, [income, onIncomeChange]);


    useEffect(() => {
        onNetIncomeChange(income); // 傳遞收入變更
    }, [income, onNetIncomeChange]);


    const formatNumber = (number) => {
        return new Intl.NumberFormat().format(number);
    };

    const TransPercent = (revenue, value) => {
        if ((Number(revenue) || 0) === 0) {
            return 0; // 如果 revenue 为 0，返回 0
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
{/*                         <th className="td2" style={{ backgroundColor: '#D9E2F3' }}>金額</th> */}
                        <th className="td2" style={{ backgroundColor: '#192F42' }}>%</th>
{/*                         <th className="td2" style={{ backgroundColor: '#D9E2F3' }}>%</th> */}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="td1">銷貨收入</td>
                        <td className="td3"><FinancialNumberFormat onValueChange={setRevenue} isGeneratingPDF={isGeneratingPDF} /></td>
                        <td className="td2">100%</td>
                    </tr>
                    <tr>
                        <td className="td1">銷貨成本</td>
                        <td className="td3"><FinancialNumberFormat onValueChange={setCost} isGeneratingPDF={isGeneratingPDF} /></td>
                        <td className="td2">{TransPercent(revenue, cost).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td className="td1">營業費用</td>
                        <td className="td3"><FinancialNumberFormat onValueChange={setExpense} isGeneratingPDF={isGeneratingPDF} /></td>
                        <td className="td2">{TransPercent(revenue, expense).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td colSpan="3" style={{ textAlign: 'right', padding: '0' }}>
                            <div style={{ borderTop: '1px solid white', width: '70%', marginLeft: 'auto' }}></div>
                        </td>
                    </tr>
                    <tr>
                        <td className="td1">營業淨利</td>
                        <td className="td3">{formatNumber(profit)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                        <td className="td2">{TransPercent(revenue, profit).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td className="td1">非營業收入</td>
                        <td className="td3"><FinancialNumberFormat onValueChange={setNonrevenue} isGeneratingPDF={isGeneratingPDF} /></td>
                        <td className="td2">{TransPercent(revenue, nonrevenue).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td className="td1">非營業支出</td>
                        <td className="td3"><FinancialNumberFormat onValueChange={setNoncost} isGeneratingPDF={isGeneratingPDF} /></td>
                        <td className="td2">{TransPercent(revenue, noncost).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td colSpan="3" style={{ textAlign: 'right', padding: '0' }}>
                            <div style={{ borderTop: '1px solid white', width: '70%', marginLeft: 'auto' }}></div>
                        </td>
                    </tr>
                    <tr>
                        <td className="td1">本期損益(A)</td>
                        <td className="td3">{formatNumber(income)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                        <td className="td2">{TransPercent(revenue, income).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td colSpan="3" style={{ textAlign: 'right', padding: '0' }}>
                            <div style={{ borderTop: '1px solid white', width: '70%', marginLeft: 'auto' }}></div>
                        </td>
                    </tr>
                    {/* 其他行 */}
                </tbody>
            </table>
        </div>
    );
};

export default FinancialForm;