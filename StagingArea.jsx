import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StagingArea = () => {
  const [forms, setForms] = useState([]);

  // 获取数据
  useEffect(() => {
    axios.get('/api/get_forms')
      .then(response => {
        if (response.data.success) {
          setForms(response.data.forms);
        } else {
          console.error('获取表单失败');
        }
      })
      .catch(error => {
        console.error('请求失败', error);
      });
  }, []);

  // 预览PDF
  const handlePreview = (pdfName) => {
    window.open(`/pdfs/${pdfName}`, '_blank');
  };

  // 删除表单
  const handleDelete = (formId) => {
    axios.post('/api/delete_form', { formId })
      .then(response => {
        if (response.data.success) {
          setForms(forms.filter(form => form.form_id !== formId)); // 从前端删除该表单
        } else {
          console.error('删除失败');
        }
      })
      .catch(error => {
        console.error('请求失败', error);
      });
  };

  return (
    <div>
      <h2>表单列表</h2>
      <ul>
        {forms.map((form) => (
          <li key={form.form_id}>
            <span>{form.pdf_name}</span>
            <button onClick={() => handlePreview(form.pdf_name)}>预览</button>
            <button onClick={() => handleDelete(form.form_id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StagingArea;