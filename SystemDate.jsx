import { useState, useEffect } from 'react';

const SystemDate = () => {
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [date, setDate] = useState('');
    //因為表單標題年月不與製表日期連動，因此額外撰寫
    const [year1, setYear1] = useState('');
    const [month1, setMonth1] = useState('');

    useEffect(() => {
        const now = new Date();
        //const now = new Date('2023-12-23');
        setYear(now.getFullYear());
        setMonth(now.getMonth() + 1); //月份索引從0開始
        setDate(now.getDate());
        //因為表單標題年月不與製表日期連動，因此額外撰寫
        setYear1(now.getFullYear());
        setMonth1(now.getMonth() + 1);
    }, []);

    const handleYearChange = (event) => {
        setYear(event.target.value);
    };
    const handleMonthChange = (event) => {
        setMonth(event.target.value);
    };
    const handleDateChange = (event) => {
        setDate(event.target.value);
    };
    //因為表單標題年月不與製表日期連動，因此額外撰寫
    const handleYear1Change = (event) => {
        setYear1(event.target.value);
    };
    const handleMonth1Change = (event) => {
        setMonth1(event.target.value);
    };

    return { year, month, date ,handleYearChange, handleMonthChange ,handleDateChange,year1, month1 ,handleYear1Change, handleMonth1Change };
};

export default SystemDate;