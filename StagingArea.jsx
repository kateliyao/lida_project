import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import VoucherWhiteIcon from './assets/voucherStatisticsTable_white_icon.png';
import VoucherBlueIcon from './assets/voucherStatisticsTable_blue_icon.png';
import RequestWhiteIcon from './assets/requestForm_white_icon.png';
import RequestBlueIcon from './assets/requestForm_blue_icon.png';
import QuotationWhiteIcon from './assets/quotation_white_icon.png';
import QuotationBlueIcon from './assets/quotation_blue_icon.png';
import HistoryWhiteIcon from './assets/history_white_icon.png';
import HistoryBlueIcon from './assets/history_blue_icon.png';
import StagingAreaIcon from './assets/stagingArea_icon.png';
import UploadIcon from './assets/upload_icon.png';
import CancelIcon from './assets/cancel_icon.png';
import TickWhite from './assets/tick_white.png';
import TickYellow from './assets/tick_yellow.png';
import ChartWhiteIcon from './assets/chart_white_icon.png';
import ChartBlueIcon from './assets/chart_blue_icon.png';
import AccountButton from './AccountButton';
import FormA from './FormA';
import HistoryForm from './HistoryForm';
import ChartComponent from './ChartComponent';
import './MainPage.css';

const StagingArea = ({ onLogout, user }) => {
    console.log("StagingArea 收到的 user:", user);  // 打印傳遞來的 user
    const [activeForm, setActiveForm] = useState(null);
    const [forms, setForms] = useState([]);
    const [isLoading, setIsLoading] = useState(false);  // 用來控制是否顯示 "正在加載資料..."
    const navigate = useNavigate();
    const [selectedForms, setSelectedForms] = useState([]); // 儲存已將選中的表單
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);  // 儲存已上傳的文件名
    const [isPreviewing, setIsPreviewing] = useState(false);  // 判斷是否在預覽中，防止重複點擊
    const [pdfInfo, setPdfInfo] = useState([]);  // 用來儲存 PDF 名稱和路徑的狀態
    const [recipient, setRecipient] = useState('');  // 儲存收件者
    const [suggestions, setSuggestions] = useState([]);
    const [isSuggestionSelected, setIsSuggestionSelected] = useState(false); // 新增的狀態
    const [mailContent, setMailContent] = useState('');  // 儲存收件者
    const apiUrl = import.meta.env.VITE_API_URL;

    // 確保登入後，如果 activeForm 為 null 或 undefined，則設置為 'STAGE'
    useEffect(() => {
        if (user && !activeForm) {
          setActiveForm('STAGE');  // 登陸後確保設置微為 'STAGE'
        }
    }, [user]);  // 監聽 user 的變化，確保在登錄時設置 activeForm

    const handleFormClick = (form) => {
        console.log(`選擇了 ${form} 表單`);
        // 如果是 "STAGE"，首先更新 activeForm，然後開始加載數據
        if (form === 'STAGE') {
          setActiveForm('STAGE');
        } else {
          setActiveForm(form);  // 其他表單直接設置 activeForm
        }
    };

    // 登出功能
    const handleLogout = () => {
    console.log('登出被觸發'); // 這裡可以確認是否進入此函數
    window.location.href = '/'; // 強制導航到 Login 頁面
    };

    //獲取表單資料
    const fetchForms = async () => {
        if (activeForm === 'STAGE') {
            setIsLoading(true);  // 開始加載數據
            try {
                const response = await fetch(`${apiUrl}/api/stagingArea?user=${user}`);
                if (!response.ok) {
                throw new Error('網路回應失敗');
            }

                const data = await response.json();
                if (data.success) {
                    setForms(data.forms);  // 更新表單數據
                } else {
                    console.error('獲取表單失敗', data.message);
                }
            } catch (error) {
                console.error('請求失敗', error);
            } finally {
                setIsLoading(false);  // 數據加載完成或失敗後，停止加載狀態
            }
        }
    };

    // 預覽單一PDF
    const handlePreview = (pdfName) => {
        const pdfUrl = `${apiUrl}/pdfs/${pdfName}`;  // 使用絕對路徑
        window.open(pdfUrl, '_blank');
    };

    // 預覽合併PDF
    const handlePreviewMerge = (pdfName) => {
        const pdfUrl = `${apiUrl}/pdfs/merge/${pdfName}`;  // 使用絕對路徑
        window.open(pdfUrl, '_blank');
    };

    // 删除表單
    const handleDelete = (formId,pdfName) => {
        fetch(`${apiUrl}/api/deleteForm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ formId }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setForms(prevForms => prevForms.filter(form => form.form_id !== formId));
                // 同時更新 selectedForms 狀態，移除已删除的表單的 pdf_name
                setSelectedForms(prevSelected => prevSelected.filter(form => form !== pdfName));
            } else {
                console.error('删除失败');
            }
            })
        .catch(error => {
            console.error('請求失敗', error);
        });
    };

    const handleCheckboxChange = (event, pdf_name) => {
        if (event.target.checked) {
            // 選中時，加入數組
            setSelectedForms((prevSelected) => {
                const newSelected = [...prevSelected, pdf_name];
                console.log("Selected forms after adding:", newSelected);
                return newSelected;
            });
        } else {
            // 取消時，從數組中移除
            setSelectedForms((prevSelected) => {
                const newSelected = prevSelected.filter((id) => id !== pdf_name);
                console.log("Selected forms after removing:", newSelected);
                return newSelected;
            });
        }
    };

    const handleBulkPreview = async () => {
        //當只有選中一個PDF，直接更新後端寄件PDF名稱
        if (selectedForms.length === 1) {
            const sendMailPdfName = selectedForms[0]; // 直接使用 pdf_name

            try {
                //更新資料庫中的 send_mail_pdf_name 欄位
                const response = await fetch(`${apiUrl}/api/updateMailPdfName`, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                    pdfNames: [sendMailPdfName]  // 傳遞 pdf_name
                    }),
                });

                if (response.ok) {
                    console.log('PDF 名稱更新成功');
                } else {
                    console.error('PDF 名稱更新失敗');
                }
            } catch (error) {
                console.error('更新郵件 PDF 名稱時發生錯誤:', error);
            }

            // 預覽單個 PDF
            handlePreview(sendMailPdfName);
            setPdfInfo([{ name: sendMailPdfName, path: `${apiUrl}/pdfs/${sendMailPdfName}` }]);

            // 觸發清空，讓使用者不會重複點擊預覽(序號會追加)
            handleClear();

        //當選中超過一個PDF，必須先合併，才能更新後端寄件PDF名稱
        } else if (selectedForms.length > 1) {
            try {
                const response = await fetch(`${apiUrl}/api/mergePdf`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ pdfNames: selectedForms }),
                });

                if (!response.ok) {
                    throw new Error(`API 請求失敗: ${response.statusText}`);
                }

                const data = await response.json();

                // 處理返回的數據
                if (data.success) {
                    // 後端回傳合併後的PDF名稱
                    const mergedPdf = data.mergedPdf;

                    // 更新資料庫中的 send_mail_pdf_name 欄位
                    const updateResponse = await fetch(`${apiUrl}/api/updateMailPdfName`, {
                        method: 'POST',
                        headers: {
                        'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            pdfNames: selectedForms,  // 所有選中的 pdf_name
                            mergedPdf: mergedPdf,     // 合併後的 PDF 名稱
                        }),
                    });

                    if (updateResponse.ok) {
                        console.log('合併 PDF 名稱更新成功');
                    } else {
                        console.error('合併 PDF 名稱更新失敗');
                    }

                    // 合併後的預覽
                    handlePreviewMerge(mergedPdf);
                    setPdfInfo([{ name: mergedPdf, path: `${apiUrl}/pdfs/merge/${mergedPdf}` }]);

                    // 觸發清空，讓使用者不會重複點擊預覽(序號會追加)
                    handleClear();

                } else {
                alert('合併失敗');
                }
            } catch (error) {
                console.error('合併 PDF 時發生錯誤:', error);
            }
        }
    };

    // 外部文件選擇
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);  // 獲取選中的文件
        setSelectedFiles((prevFiles) => [...prevFiles, ...files]);  // 更新文件列表
    };

    // 外部文件拖拽
    const handleDrop = (event) => {
        event.preventDefault();  // 防止瀏覽器默認行為，阻止文件打開
        const files = Array.from(event.dataTransfer.files);  // 獲取拖拽的文件
        setSelectedFiles((prevFiles) => [...prevFiles, ...files]);  // 更新文件列表
    };

    const handleDragOver = (event) => {
        event.preventDefault();  // 防止瀏覽器默認行為
    };

    // 外部文件删除
    const handleFileDelete = (fileIndex) => {
        setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== fileIndex));  // 根據索引删除文件
    };

    // 外部文件上傳
    const handleConfirmUpload = async () => {
        // 1. 檢查文件是否都是 PDF
        const isAllPdf = selectedFiles.every(file => file.type === 'application/pdf');
        if (!isAllPdf) {
            alert('請確認所有文件都是 PDF 格式');
            return;
        }

        // 2. 呼叫後端上傳文件
        try {
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);  // 將文件添加到 FormData 清單
            });

            const response = await fetch(`${apiUrl}/api/uploadPdf`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('文件上傳失敗');
            }

            const data = await response.json();

            if (data.success) {
                alert('文件上傳成功！');

                // 在文件上傳成功後，打印文件名稱到頁面
                console.log('Uploaded files:', selectedFiles.map(file => file.name));
                // 更新頁面上的文件列表
                setUploadedFiles(prevFiles => [...prevFiles, ...selectedFiles.map(file => file.name)]);

                // 3. 更新 select form，保存上傳的文件名
                setSelectedForms((prevForms) => [
                ...prevForms,
                ...selectedFiles.map(file => file.name),
                ]);
                setSelectedFiles([]);  // 清空選擇的文件
            } else {
                alert('文件上傳失敗');
            }
        } catch (error) {
            console.error('文件上傳失敗:', error);
            alert('文件上傳失敗');
        }
    };

    // 清空所有文件
    const handleClear = () => {
        setSelectedFiles([]);   // 清空選擇的文件
        setUploadedFiles([]);   // 清空已上傳的文件列表
        setSelectedForms([]);   // 清空checkbox
    };

    // 提交表單的處理函數
    const handleSubmit = async () => {
        // 檢查是否包含 "@" 符號
        if (!recipient || !recipient.includes('@')) {
            alert('請輸入有效的電子郵件地址');
            return;
        }

        if (pdfInfo.length === 0) {
            alert('請選擇要寄出的PDF清單');
            return;
        }

        try {
            // 發送郵件請求
            const response = await fetch(`${apiUrl}/api/sendEmail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipient,
                    pdfInfo,  // 傳遞 PDF 名稱和路徑
                    mailContent,
                }),
            });

            if (response.ok) {
                //await  checkInsertEmail(recipient);   // 成功發送郵件後，檢查電子郵件是否存在資料庫中
                // 成功發送郵件後，直接發送檢查電子郵件是否存在資料庫中的請求
                const checkInsertResponse = await fetch(`${apiUrl}/api/checkInsert`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ recipient }),
                });
                console.log('checkInsert request body:', JSON.stringify({ recipient }));

                if (checkInsertResponse.ok) {
                    const data = await checkInsertResponse.json();
                    console.log('checkInsert response data:', data);
                    if (!data.exists) {
                        console.log('新郵件地址已插入');
                    }
                } else {
                    console.error('檢查郵件是否已存在時發生錯誤');
                }
                alert('郵件發送成功');
                console.log(recipient)

                setRecipient('');   // 清空收件者
                setPdfInfo([]);     // 清空 PDF 資料
                setMailContent(''); // 清空郵件內容
                fetchForms();
            } else {
                alert('郵件發送失敗');
            }
        } catch (error) {
            console.error('發送郵件時發生錯誤:', error);
        }
    };

    useEffect(() => {
        if (activeForm === 'STAGE') {
            fetchForms();  // 在 activeForm 為 'STAGE' 時加載數據
        }
    }, [activeForm]);  // activeForm 變化時，觸發數據加載

    const handleChange = (e) => {
        setRecipient(e.target.value);  // 更新 recipient 狀態
        setIsSuggestionSelected(false); // 用戶輸入時，設置為未選擇建議
    };

    useEffect(() => {
        // 如果正在選擇建議，就不發送請求
        if (isSuggestionSelected) {
            return; // 如果是選擇了建議，就不會再發送請求
            }
            const timer = setTimeout(() => {
            if (recipient && recipient.trim().length > 0) { // 確保輸入非空
                const fetchSuggestions = async () => {
                    try {
                        const response = await fetch(`${apiUrl}/api/recipientSuggest?recipient=${recipient}`);
                        if (!response.ok) {
                        throw new Error('網路回應失敗');
                        }
                        const data = await response.json(); // 解析 JSON 資料
                        setSuggestions(data); // 更新建議列表
                    } catch (error) {
                        console.error('發生錯誤: ', error);
                    }
                };
                fetchSuggestions(); // 發送請求
            } else {
                setSuggestions([]); // 清空建議
            }
        }, 300); // 防抖動延遲
        return () => clearTimeout(timer); // 清理防抖動計時器
    }, [recipient, isSuggestionSelected]); // 監聽 recipient 和 isSuggestionSelected

    // 點擊建議後更新 recipient 並清空建議框
    const handleSuggestionClick = (email) => {
        setRecipient(email); // 更新 recipient 值
        setSuggestions([]);   // 清空建議框
        setIsSuggestionSelected(true); // 標記為已選擇建議，避免發送請求
    };

    // 檢查用戶是否有權限查看 "統計圖表" 項目
    const canViewChart = user && user.startsWith('lda');

    return (
        <div className="mainpage">
            <div className="top">
                <div className="logo-mainpage">
                    <img src={logo} alt="Logo" />
                </div>
                <div className="stagingarea-icon">
                    <button
                    onClick={() => handleFormClick('STAGE')}  // 先更新 activeForm，觸發數據加載
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                    <img src={StagingAreaIcon} alt="StagingAreaIcon" />
                    </button>
                </div>
                <AccountButton onLogout={handleLogout} username={user} />
            </div>

            <div className="side-container">
                <nav className="sidebar">
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        <li
                            onClick={() => handleFormClick('A')}
                            onMouseEnter={(e) => e.target.firstChild.src = VoucherBlueIcon}
                            onMouseLeave={(e) => e.target.firstChild.src = VoucherWhiteIcon} >
                            <img src={VoucherWhiteIcon} alt="Voucher" style={{ width: '25px', marginRight: '10px' }} />
                            憑證統計表
                        </li>
                        <li
                            onClick={() => handleFormClick('B')}
                            onMouseEnter={(e) => e.target.firstChild.src = RequestBlueIcon}
                            onMouseLeave={(e) => e.target.firstChild.src = RequestWhiteIcon} >
                            <img src={RequestWhiteIcon} alt="Request" style={{ width: '25px', marginRight: '10px' }} />
                            請款單
                        </li>
                        <li
                            onClick={() => handleFormClick('C')}
                            onMouseEnter={(e) => e.target.firstChild.src = QuotationBlueIcon}
                            onMouseLeave={(e) => e.target.firstChild.src = QuotationWhiteIcon} >
                            <img src={QuotationWhiteIcon} alt="Quotation" style={{ width: '25px', marginRight: '10px' }} />
                            報價單
                        </li>
                        <li
                            onClick={() => handleFormClick('HISTORY')}
                            onMouseEnter={(e) => e.target.firstChild.src = HistoryBlueIcon}
                            onMouseLeave={(e) => e.target.firstChild.src = HistoryWhiteIcon} >
                            <img src={HistoryWhiteIcon} alt="pngC" style={{ width: '25px', marginRight: '10px' }} />
                            歷史資料
                        </li>
                        {/* 只有 user.startsWith('lda') 的使用者才能看到統計圖表選項 */}
                        {canViewChart && (
                            <li
                                onClick={() => handleFormClick('CHART')}
                                onMouseEnter={(e) => e.target.firstChild.src = ChartBlueIcon}
                                onMouseLeave={(e) => e.target.firstChild.src = ChartWhiteIcon} >
                                <img src={ChartWhiteIcon} alt="pngC" style={{ width: '25px', marginRight: '10px' }} />
                                統計圖表
                            </li>
                        )}
                    </ul>
                </nav>


                <div className="form-area">
                    {activeForm === 'A' && <FormA user={user} />}
                    {activeForm === 'HISTORY' && <HistoryForm user={user}/>}
                    {activeForm === 'CHART' && <ChartComponent user={user}/>}
                    {activeForm === 'STAGE' && (
                        //確保整個內容不會壓到邊線
                        <div style={{marginLeft: '30px',marginRight: '30px'}}>
                            <div className="title">檔案暫存區</div>
                            <ul style={{
                                maxHeight: '420px',
                                overflowY: 'auto', //超出最大高度，產生滾動條
                            }}>
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
                                    {/* 複選框和PDF名稱靠左對齊 */}
                                    <div style={{ display: 'flex', alignItems: 'center' , whiteSpace: 'nowrap' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedForms.includes(form.pdf_name)} // 根據選中的 pdf_name 來判斷是否勾選
                                            onChange={(event) => handleCheckboxChange(event, form.pdf_name)} // 處理複選框選中狀態
                                            style={{ width: '20px',
                                                    height: '20px',
                                                    marginRight: '10px',
                                                    appearance: 'none',  // 取消原生的勾選框外觀
                                                    backgroundImage: `url(${selectedForms.includes(form.pdf_name) ? TickYellow : ''})`, // 使用匯入的圖片
                                                    backgroundSize: 'cover', // 讓圖片填滿 checkbox
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundColor:'transparent',
                                                    border: `1px solid ${selectedForms.includes(form.pdf_name) ? '#EBC857' : '#ccc'}`,
                                                    cursor: 'pointer', // 改變鼠標指標樣式,
                                                    padding:'15px'
                                            }}
                                        />
                                        <span style={{ color: selectedForms.includes(form.pdf_name) ? '#EBC857' : 'inherit' }}>{form.pdf_name}</span>
                                    </div>

                                    {/* 按钮部分靠右對齊 */}
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {/*  限定帳號開頭是lda，才能看到每一份表單的建立者屬於哪一個帳號，其餘ld帳號僅能看到自己的資料 */}
                                        {user.startsWith('lda') && (
                                        <span>{form.user_name}</span>
                                        )}
                                        <button
                                            onClick={() => handlePreview(form.pdf_name)}
                                            className={`previewdelete-button ${selectedForms.includes(form.pdf_name) ? 'selected' : 'default'}`}
                                        >
                                        預覽
                                        </button>
                                        <button
                                            onClick={() => handleDelete(form.form_id,form.pdf_name)}
                                            className={`previewdelete-button ${selectedForms.includes(form.pdf_name) ? 'selected' : 'default'}`}
                                        >
                                        刪除
                                        </button>
                                    </div>
                                </li>
                                ))
                                ) : (
                                <div>暫無資料</div>
                                )}
                            </ul>

                            <div className="upload-section"
                            //若沒有勾選checkbox，不能上傳文件
                            style={{
                                pointerEvents: selectedForms.length === 0 ? 'none' : 'auto', // 禁用拖放區域
                                opacity: selectedForms.length === 0 ? 0.5 : 1, // 禁用時，設置透明度
                            }}
                            >
                                <div
                                style={{
                                    display: 'flex',  // 使用flex布局
                                    justifyContent: 'space-between',  // 子元素（div 和 ul）分開
                                    height: '350px',  // 保證容器佔據全頁高度
                                    }}
                                >
                                    <div
                                    className="file-input-container"
                                    onDrop={handleDrop}  // 處理拖放
                                    onDragOver={handleDragOver}  // 允许拖拽
                                    style={{
                                        border: '2px dashed #ddd',
                                        borderRadius: '10px',
                                        padding: '50px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        width: '50%',
                                    }}
                                    >
                                        <input
                                        type="file"
                                        id="fileInput"
                                        accept=".pdf"
                                        multiple  // 允許批量選擇
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}  // 隐藏原生的文件選擇框
                                        />
                                        <img src={UploadIcon} alt="Upload" style={{width: '100px',height: 'auto',display: 'block',margin: '0 auto 20px'}} />
                                        <div>點擊新增或拖曳檔案到此區塊</div>
                                        <button
                                        onClick={() => document.getElementById('fileInput').click()}
                                        style={{
                                            padding: '10px 30px',
                                            borderRadius: '20px',
                                            fontSize: '28px',
                                            backgroundColor: '#71777F',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                        >
                                        選擇要上傳的PDF文件
                                        </button>
                                    </div>

                                    <div style={{ width: '70%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        {/* 顯示欲上傳的文件列表 */}
                                        <ul style={{
                                            flex: '1',
                                            padding: '20px',
                                            margin: 0,
                                            listStyleType: 'none',  // 去除預設的列表樣式
                                            overflowY: 'auto',  // 若文件過多，可以滾動
                                            backgroundColor: '#455664',  // 灰色背景色
                                            position: 'relative',  // 使子元素按钮可以相對定位
                                            display: 'flex',  // 使用 flexbox 布局
                                            flexDirection: 'column',  // 按列排列子元素
                                            justifyContent: selectedFiles.length === 0 && uploadedFiles.length === 0 ? 'center' : 'flex-start', // 如果没有文件，居中
                                            alignItems: 'center',  // 横向居中
                                            height: '270px',
                                        }}>

                                        {/* 如果有上傳成功的文件，則顯示已上傳的文件列表 */}
                                        {uploadedFiles.length > 0 ? (
                                            <>
                                            {uploadedFiles.map((fileName, index) => (
                                                <li key={index} style={{ padding: '5px 0', borderBottom: '1px solid white', textAlign: 'left' }}>
                                                <img src={TickYellow} alt="tickyellow" style={{ width: '25px', marginRight: '10px' }} />
                                                <span>{fileName}</span>
                                                </li>
                                            ))}
                                            </>
                                        ) : (
                                            // 否則，顯示待上傳的列表
                                            <>
                                            {selectedFiles.length > 0 ? (
                                                selectedFiles.map((file, index) => (
                                                    <li key={index} style={{ display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '5px 0',
                                                        borderBottom: '1px solid white',
                                                        textAlign: 'left',}}>
                                                    <span>{file.name}</span>
                                                    {/* 叉叉按钮，用於刪除選錯的外部文件 */}
                                                    <button
                                                    onClick={() => handleFileDelete(index)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'red',
                                                        fontSize: '18px',
                                                        fontWeight: 'bold',
                                                    }}
                                                    >
                                                    <img src={CancelIcon} alt="Cancel" style={{width: '30px',height: 'auto'}} />
                                                    </button>
                                                    </li>
                                                ))
                                            ) : (
                                            <li style={{
                                                display: 'flex',
                                                justifyContent: 'center', // 居中显示
                                                alignItems: 'center',
                                                textAlign: 'center',
                                                flex: '1', // 确保这一项占据父容器剩余空间
                                            }}>
                                                <img src={CancelIcon} alt="Cancel" style={{width: '40px',height: 'auto',padding: '10px'}} />
                                                無文件上傳
                                            </li>
                                            )
                                            }
                                            </>
                                        )}
                                        </ul>
                                        <div style={{
                                            height: '80px',
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            alignItems: 'center',
                                            backgroundColor: '#455664',
                                            paddingRight: '20px'
                                        }}>

                                            {/* 根據狀態同位置，顯示不同按鈕 */}
                                            {uploadedFiles.length > 0 ? (
                                                <button
                                                onClick={handleClear}
                                                style={{
                                                    padding: '10px 40px',
                                                    borderRadius: '20px',
                                                    fontSize: '24px',
                                                    backgroundColor: 'transparent',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    border: '2px solid #ddd',  // 邊框樣式
                                                }}
                                                >
                                                清空
                                                </button>
                                            ) : (
                                                <button
                                                onClick={handleConfirmUpload}
                                                disabled={selectedFiles.length === 0}
                                                style={{
                                                    padding: '10px 40px',
                                                    borderRadius: '20px',
                                                    fontSize: '24px',
                                                    cursor: selectedFiles.length > 0 ? 'pointer' : 'not-allowed',
                                                    backgroundColor: selectedFiles.length > 0 ? 'transparent' : '#e0e0e0',
                                                    color: '#fff',
                                                    border: '2px solid #ddd',  // 邊框樣式
                                                }}
                                                >
                                                上傳
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* 預覽按鈕區域 */}
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <button
                                onClick={handleBulkPreview}
                                disabled={selectedForms.length === 0 || isPreviewing}  // 若未選擇任何文件，按鈕禁用
                                style={{
                                    padding: '10px 240px',
                                    borderRadius: '20px',
                                    fontSize: '24px',
                                    cursor: selectedForms.length > 0 ? 'pointer' : 'not-allowed',
                                    backgroundColor: selectedForms.length > 0 ? '#71777F' : '#e0e0e0',
                                    color: '#fff',
                                    marginBottom:'20px'
                                }}
                                >
                                預覽
                                </button>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#2C3D4B',
                                padding: '10px',
                                marginBottom: '20px'
                            }}>
                                <div className="title" style={{padding:'10px'}}>待寄郵件檔</div>
                                <div style={{ display: 'flex', justifyContent: 'center', flexGrow: 1 }}>
                                    {pdfInfo.map((pdf, index) => (
                                        <div key={index} style={{ textAlign: 'center', color: 'white' }}>
                                            <a href={pdf.path} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
                                                {pdf.name}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="title">撰寫郵件</div>
                            <div style={{ position: 'relative',marginRight: '30px'}}>
                                <input
                                type="email"
                                className="mailaccount"
                                value={recipient}
                                onChange={handleChange}
                                placeholder="請輸入收件者信箱"
                                />
                                {suggestions.length > 0 && (
                                    <ul className="suggestion-list">
                                        {suggestions.map((suggestion) => (
                                            <li key={`${suggestion.id}`}
                                                onClick={() => handleSuggestionClick(suggestion.email)} // 點擊後填充 recipient
                                                className="suggestion-item"
                                            >
                                                {suggestion.email}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div style={{marginRight: '30px'}}>
                                <textarea
                                className="mailcontent"
                                value={mailContent}
                                onChange={(e) => setMailContent(e.target.value)}
                                placeholder="請輸入內容"
                                />
                            </div>

                            {/* 發送郵件按鈕區域 */}
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <button
                                onClick={handleSubmit}
                                disabled={!recipient || !recipient.includes('@') || pdfInfo.length === 0}  // 如果收件者或 PDF 信息不存在，禁用按鈕
                                style={{
                                    padding: '10px 240px',
                                    borderRadius: '20px',
                                    fontSize: '24px',
                                    cursor: recipient && recipient.includes('@') && pdfInfo.length > 0 ? 'pointer' : 'not-allowed',
                                    backgroundColor: recipient && recipient.includes('@') && pdfInfo.length > 0 ? '#71777F' : '#e0e0e0', // 兩者都存在時為綠色，否則為灰色

                                }}
                                >
                                發送郵件
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StagingArea;