import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import VoucherWhiteIcon from './assets/voucherStatisticsTable_white_icon.png';
import VoucherBlueIcon from './assets/voucherStatisticsTable_blue_icon.png';
import RequestWhiteIcon from './assets/requestForm_white_icon.png';
import RequestBlueIcon from './assets/requestForm_blue_icon.png';
import QuotationWhiteIcon from './assets/quotation_white_icon.png';
import QuotationBlueIcon from './assets/quotation_blue_icon.png';
import StagingAreaIcon from './assets/stagingArea_icon.png';
import AccountButton from './AccountButton';
import FormA from './FormA';
import './MainPage.css';

const StagingArea = ({ onLogout, user }) => {
  console.log("MainPage 收到的 user:", user);  // 打印傳遞來的 user
  const [activeForm, setActiveForm] = useState(null);
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);  // 用来控制是否显示 "正在加載資料..."
  const navigate = useNavigate();
  const [selectedForms, setSelectedForms] = useState([]); // 存储已选中的表单ID

  // 确保在登录后，如果 activeForm 为 null 或 undefined，则设置为 'STAGE'
  useEffect(() => {
    if (user && !activeForm) {
      setActiveForm('STAGE');  // 登录后确保设置为 'STAGE'
    }
  }, [user]);  // 监听 user 的变化，确保在登录时设置 activeForm

  const handleFormClick = (form) => {
    console.log(`選擇了 ${form} 表單`);
    // 如果是 "STAGE"，首先更新 activeForm，然后开始加载数据
    if (form === 'STAGE') {
      setActiveForm('STAGE');
    } else {
      setActiveForm(form);  // 其他表单直接设置 activeForm
    }
  };

  // 登出功能
  const handleLogout = () => {
    console.log('登出被觸發'); // 這裡可以確認是否進入此函數
    window.location.href = '/'; // 强制导航到 Login 页面
  };

  // 获取数据
  useEffect(() => {
    const fetchForms = async () => {
      if (activeForm === 'STAGE') {
        setIsLoading(true);  // 开始加载数据
        try {
          const response = await fetch('http://localhost:5000/api/stagingArea');  // 更新为您的API路径
          if (!response.ok) {
            throw new Error('网络响应失败');
          }

          const data = await response.json();
          if (data.success) {
            setForms(data.forms);  // 更新表单数据
          } else {
            console.error('获取表单失败', data.message);
          }
        } catch (error) {
          console.error('请求失败', error);
        } finally {
          setIsLoading(false);  // 数据加载完成或失败后，停止加载状态
        }
      }
    };

    if (activeForm === 'STAGE') {
      fetchForms();  // 在 activeForm 为 'STAGE' 时加载数据
    }
  }, [activeForm]);  // activeForm 变化时触发数据加载

  // 预览PDF
  const handlePreview = (pdfName) => {
      const pdfUrl = `http://localhost:5000/pdfs/${pdfName}`;  // 使用绝对路径
      window.open(pdfUrl, '_blank');  // 预览PDF
    };

  // 删除表单
  const handleDelete = (formId) => {
    fetch('http://localhost:5000/api/deleteForm', {  // 后端删除请求的URL
      method: 'POST',  // 使用 POST 请求删除表单
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ formId }),  // 发送表单ID作为请求体
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setForms(prevForms => prevForms.filter(form => form.form_id !== formId));  // 更新表单列表
        } else {
          console.error('删除失败');
        }
      })
      .catch(error => {
        console.error('请求失败', error);
      });
  };

//   const handleCheckboxChange = (event, pdf_name) => {
//       if (event.target.checked) {
//         // 选中时，加入数组
//         setSelectedForms((prevSelected) => [...prevSelected, pdf_name]);
//       } else {
//         // 取消选中时，从数组中移除
//         setSelectedForms((prevSelected) => prevSelected.filter((id) => id !== pdf_name));
//       }
//     };

const handleCheckboxChange = (event, pdf_name) => {
  if (event.target.checked) {
    // 选中时，加入数组
    setSelectedForms((prevSelected) => {
      const newSelected = [...prevSelected, pdf_name];
      console.log("Selected forms after adding:", newSelected); // 打印调试信息
      return newSelected;
    });
  } else {
    // 取消选中时，从数组中移除
    setSelectedForms((prevSelected) => {
      const newSelected = prevSelected.filter((id) => id !== pdf_name);
      console.log("Selected forms after removing:", newSelected); // 打印调试信息
      return newSelected;
    });
  }
};

const handleBulkPreview = async () => {
  if (selectedForms.length === 1) {
    // 直接预览单个文件
    handlePreview(selectedForms[0]);
  } else if (selectedForms.length > 1) {
     console.log("Selected PDFs to merge:", selectedForms);
    // 向后端发送合并请求
    try {
      const response = await fetch('http://localhost:5000/api/mergePdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfNames: selectedForms }),  // 发送选中的 PDF 名称数组给后端
      });

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.statusText}`);
      }

      const data = await response.json();  // 直接解析 JSON 响应

      // 处理返回的数据
      if (data.success) {
        // 后端返回合并后的文件 URL
        handlePreview(data.mergedPdf);  // 显示合并后的预览
      } else {
        alert('合併失敗');
      }
    } catch (error) {
      console.error('合併過程中出現錯誤:', error);
      alert(`合併過程中出現錯誤: ${error.message}`);
    }
  }
};

  return (
    <div className="mainpage">
      <div className="top">
        <div className="logo-mainpage">
          <img src={logo} alt="Logo" />
        </div>
        <div className="stagingarea-icon">
          <button
            onClick={() => handleFormClick('STAGE')}  // 先更新 activeForm，触发数据加载
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <img src={StagingAreaIcon} alt="StagingAreaIcon" style={{ width: '40px', height: '40px' }} />
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
          </ul>
        </nav>

        <div className="form-area">
          {activeForm === 'A' && <FormA user={user} />}  {/* 显示FormA */}
          {activeForm === 'STAGE' && (
            <div>
              <h2 style={{ textAlign: 'left' }}>檔案暫存區</h2>
              <ul>
                {isLoading ? (
                  <li>正在加載資料...</li>  // 显示加载状态
                ) : forms.length > 0 ? (
                  forms.map((form,formIndex) => (
                    <li
                      key={form.form_id}
                      className={formIndex % 2 === 0 ? "dark-bg" : "light-bg"} // 根据索引设置背景色
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between', // 让内容分布到两边，按钮右对齐
                        alignItems: 'center',  // 确保所有项在垂直方向对齐
                        padding: '10px', // 给 li 添加一些内边距
                      }}
                    >
                      {/* 复选框和文件名靠左对齐 */}
                      <div style={{ display: 'flex', alignItems: 'center' , whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={selectedForms.includes(form.pdf_name)} // 根据选中的 pdf_name 来判断是否勾选
                          onChange={(event) => handleCheckboxChange(event, form.pdf_name)} // 处理复选框选中状态
                          style={{ position: 'relative'
                                    }} // 放大复选框
                        />
                        <span>{form.pdf_name}</span>
                      </div>

                      {/* 按钮部分右对齐并且做圆角 */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handlePreview(form.pdf_name)}
                          style={{
                            padding: '5px 30px',
                            borderRadius: '20px',
                            fontSize: '28px',
                            cursor: 'pointer',
                          }}
                        >
                          預覽
                        </button>
                        <button
                          onClick={() => handleDelete(form.form_id)}
                          style={{
                            padding: '5px 30px',
                            borderRadius: '20px',
                            fontSize: '28px',
                            cursor: 'pointer',
                          }}
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
              {/* 預覽按鈕區域 */}
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    onClick={handleBulkPreview}
                    disabled={selectedForms.length === 0}  // 若未選擇任何文件，按鈕禁用
                    style={{
                      padding: '10px 40px',
                      borderRadius: '20px',
                      fontSize: '24px',
                      cursor: selectedForms.length > 0 ? 'pointer' : 'not-allowed',
                      backgroundColor: selectedForms.length > 0 ? '#4CAF50' : '#e0e0e0', // 有選擇時為綠色，無選擇時為灰色
                      color: '#fff',
                    }}
                  >
                    預覽
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