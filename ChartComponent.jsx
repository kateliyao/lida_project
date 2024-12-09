import React, { useState, useEffect } from 'react';

const ChartComponent = ({ user }) => {
    const [chartDataToday, setChartDataToday] = useState('');
    const [chartDataMonth, setChartDataMonth] = useState('');
    const [chartDataPieToday, setChartDataPieToday] = useState('');
    const [chartDataPieMonth, setChartDataPieMonth] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const currentMonth = new Date().getMonth() + 1; // getMonth() 返回 0-11 之間的值，所以需要加 1
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const chartResponse = await fetch(`${apiUrl}/api/getChart`);
                const chartData = await chartResponse.json();

                if (chartResponse.ok) {
                    console.log(chartData);  // 打印返回的图表数据
                    setChartDataToday(chartData.chart_today);  // 當日圖表的 base64 編碼
                    setChartDataMonth(chartData.chart_month);  // 當年當月圖表的 base64 編碼
                    setChartDataPieToday(chartData.chart_pie_today);
                    setChartDataPieMonth(chartData.chart_pie_month);
                } else {
                    setErrorMessage('無法獲取圖表數據');
                }
            } catch (error) {
                setErrorMessage(`請求失敗: ${error.message}`);
            }
        };
        fetchChartData();  // 调用 fetchChartData 函数
    }, []);

    return (
        <div>
            {errorMessage && <p>{errorMessage}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                {/* 當日圖表 */}
                {chartDataToday && (
                    <div style={{ marginRight: '20px' }}>
                        <h4>當日服務人員成功寄信數量</h4>
                        <img
                            src={`data:image/png;base64,${chartDataToday}`}
                            alt="當日服務人員成功寄信數量"
                            style={{ width: '100%', height: 'auto' }}
                        />
                    </div>
                )}

                {/* 圓餅圖 - 每個員工數量占總數的百分比 */}
                {chartDataPieToday && (
                    <div>
                        <h4>當日服務人員成功寄信數量占比</h4>
                        <img
                            src={`data:image/png;base64,${chartDataPieToday}`}
                            alt="當日服務人員成功寄信數量占比"
                            style={{ width: '100%', height: 'auto'}}
                        />
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between'}}>
                {/* 當年當月圖表 */}
                {chartDataMonth && (
                    <div style={{ marginRight: '20px' }}>
                        <h4>{currentMonth}月服務人員成功寄信數量</h4>
                        <img
                            src={`data:image/png;base64,${chartDataMonth}`}
                            alt={`${currentMonth}月服務人員成功寄信數量`}
                            style={{ width: '100%', height: 'auto'}}
                        />
                    </div>
                )}

                {/* 圓餅圖 - 每個員工數量占總數的百分比 */}
                {chartDataPieMonth && (
                    <div>
                        <h4>{currentMonth}月服務人員成功寄信數量占比</h4>
                        <img
                            src={`data:image/png;base64,${chartDataPieMonth}`}
                            alt={`${currentMonth}月服務人員成功寄信數量占比`}
                            style={{ width: '100%', height: 'auto'}}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartComponent;
