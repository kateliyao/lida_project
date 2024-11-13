from flask import Flask, request, jsonify
from flask_mysqldb import MySQL
from flask_cors import CORS
import os
import pdfkit
from flask import send_file
from flask import Flask, render_template
from datetime import datetime
from PyPDF2 import PdfMerger

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# 配置 MySQL 数据库连接
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'  # 修改为您的数据库用户名
app.config['MYSQL_PASSWORD'] = '1qaz@WSX'  # 修改为您的数据库密码
app.config['MYSQL_DB'] = 'dw'  # 修改为您的数据库名

mysql = MySQL(app)

# 獲取系統日期
now = datetime.now()
# 格式化日期為 YYYYMMDD 格式
date_str = now.strftime("%Y%m%d")

# 封装数据库连接函数
def get_db_connection():
    """创建并返回数据库连接"""
    return mysql.connection.cursor()


#登入驗證
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': '帳號或密碼為空'}), 400

    cursor = get_db_connection()
    cursor.execute("SELECT * FROM users_info WHERE username = %s", (username,))
    user = cursor.fetchone()

    if user and user[2] == password:  # 假设 'users' 表格包含 'username', 'email', 'password'
        return jsonify({'success': True, 'message': '登入成功'})
    else:
        return jsonify({'success': False, 'message': '錯誤的帳號或密碼'}), 401


# 獲取公司名稱
@app.route('/api/getCompanyName', methods=['GET'])
def get_company_name():
    companyId = request.args.get('companyId')  # 獲取前端傳遞來的公司編碼
    if companyId:
        try:
            cursor = get_db_connection()
            cursor.execute("SELECT company_name FROM company_info WHERE company_id = %s", (companyId,))
            result = cursor.fetchone()  # 獲取查詢結果

            if result:
                companyname = result[0]  # 公司名稱在結果中，是第一個字段
                return jsonify({'companyName': companyname})  # 回傳公司名稱
            else:
                return jsonify({'message': '找不到對應的公司名稱'}), 404
        except Exception as e:
            return jsonify({'message': str(e)}), 500
        finally:
            cursor.close()
    else:
        return jsonify({'message': '公司編號不能为空'}), 400

@app.route('/api/getSequence', methods=['GET'])
def get_sequence():
    company_id = request.args.get('companyId')
    if not company_id:
        return jsonify({'success': False, 'message': '公司編號不能為空'}), 400

    # 查询当前序号
    cursor = get_db_connection()
    cursor.execute('SELECT form_id FROM formA WHERE company_id = %s ORDER BY updated_time DESC LIMIT 1;', (company_id,))
    result = cursor.fetchone()

    if result:
        # 如果找到了最近的form_id，提取序號部分並加1
        form_id = result[0]
        try:
            # 提取 form_id 中的序號部分
            current_sequence = int(form_id.split('_')[-1])  # 假設 form_id 格式是 "公司編碼_A_日期_序號"
            new_sequence = current_sequence + 1
        except ValueError:
            # 如果解析序號出錯，從 001 開始
            new_sequence = 1

        # 確保序號是 3 位數
        new_sequence_str = str(new_sequence).zfill(3)  # 例如 1 變成 "001", 2 變成 "002"
        return jsonify({'success': True, 'formId': new_sequence_str})
    else:
        # 如果找不到该公司編號，從001開始
        return jsonify({'success': True, 'formId': '001'})

# 獲取員工資訊
@app.route('/api/getStaffInfo', methods=['GET'])
def get_staff_info():
    try:
        cursor = get_db_connection()
        cursor.execute("SELECT staff_id, staff_name,staff_menu FROM staff_info")
        result = cursor.fetchall()  # 獲取所有工作人員訊息

        if result:
            staff_list = [{"staffId": staff[0], "staffName": staff[1],"staffMenu": staff[2]} for staff in result]  # 建構列表
            return jsonify(staff_list)  # 返回工作人員列表
        else:
            return jsonify({'message': '沒有找到工作人員訊息'}), 404
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# 表單資料提交
@app.route('/api/submitForm', methods=['POST'])
def submit_form():
    data = request.get_json()

    # 從前端獲取的數據
    formId = data.get('formId')
    companyId = data.get('companyId')
    companyName = data.get('companyName')
    year1 = data.get('year1')
    month1 = data.get('month1')
    revenue = data.get('revenue')
    cost = data.get('cost')
    expense = data.get('expense')
    profit = data.get('profit')
    nonrevenue = data.get('nonrevenue')
    noncost = data.get('noncost')
    income = data.get('income')
    costPercent = data.get('costPercent')
    expensePercent = data.get('expensePercent')
    profitPercent = data.get('profitPercent')
    nonrevenuePercent = data.get('nonrevenuePercent')
    noncostPercent = data.get('noncostPercent')
    incomePercent = data.get('incomePercent')
    isChecked = data.get('isChecked')
    netincome = data.get('netincome')
    extracost = data.get('extracost')
    extraexpense = data.get('extraexpense')
    note = data.get('note')
    selectedStaff = data.get('selectedStaff')
    year = data.get('year')
    month = data.get('month')
    date = data.get('date')
    user = data.get('user')

    # 检查是否有必填项为空
    # if not formId or not companyId or not year1 or not month1 or not revenue or not income:
    #     return jsonify({'success': False, 'message': '所有字段都是必填的'}), 400

    # 將數據寫入到 MySQL
    try:
        cursor = get_db_connection()

        query = """
            INSERT INTO formA(form_id,company_id,company_name,form_titleyear,form_titlemonth,revenue,cost
            ,expense,profit,nonrevenue,noncost,income,cost_percent,expense_percent,profit_percent
            ,nonrevenue_percent,noncost_percent,income_percent,ischecked,netincome,extracost,extraexpense
            ,note,staff,form_submityear,form_submitmonth,form_submitdate,user_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (formId,companyId,companyName,year1,month1,revenue,cost,expense,profit
                               ,nonrevenue,noncost,income,costPercent,expensePercent,profitPercent
                               ,nonrevenuePercent,noncostPercent,incomePercent,isChecked,netincome
                               ,extracost,extraexpense,note,selectedStaff,year,month,date,user))

        # 提交事务
        mysql.connection.commit()

        #千分位、負數紅字
        revenue = float(revenue)
        cost = float(cost)
        expense = float(expense)
        profit = float(profit)
        nonrevenue = float(nonrevenue)
        noncost = float(noncost)
        income = float(income)
        netincome = float(netincome)
        voucherNumber = income - netincome
        extracost = float(extracost)
        extraexpense = float(extraexpense)


        formatted_revenue = f"({abs(revenue):,.0f})" if revenue < 0 else f"{revenue:,.0f}"
        formatted_cost = f"({abs(cost):,.0f})" if cost < 0 else f"{cost:,.0f}"
        formatted_expense = f"({abs(expense):,.0f})" if expense < 0 else f"{expense:,.0f}"
        formatted_profit = f"({abs(profit):,.0f})" if profit < 0 else f"{profit:,.0f}"
        formatted_nonrevenue = f"({abs(nonrevenue):,.0f})" if nonrevenue < 0 else f"{nonrevenue:,.0f}"
        formatted_noncost = f"({abs(noncost):,.0f})" if noncost < 0 else f"{noncost:,.0f}"
        formatted_income = f"({abs(income):,.0f})" if income < 0 else f"{income:,.0f}"
        formatted_netincome = f"({abs(netincome):,.0f})" if netincome < 0 else f"{netincome:,.0f}"
        formatted_voucherNumber = f"({abs(voucherNumber):,.0f})" if voucherNumber < 0 else f"{voucherNumber:,.0f}"
        formatted_extracost = f"({abs(extracost):,.0f})" if extracost < 0 else f"{extracost:,.0f}"
        formatted_extraexpense = f"({abs(extraexpense):,.0f})" if extraexpense < 0 else f"{extraexpense:,.0f}"

        # 格式化比例只顯示小數點後兩位
        costPercent=round(costPercent, 2)
        expensePercent=round(expensePercent, 2)
        profitPercent=round(profitPercent, 2)
        nonrevenuePercent=round(nonrevenuePercent, 2)
        noncostPercent=round(noncostPercent, 2)
        incomePercent=round(incomePercent, 2)




        # 根據isChecked選擇不同的模板
        # template_name = 'pdf_template1.html' if isChecked == 'Y' else 'pdf_template2.html'
        html_content = render_template('pdf_template.html', formId=formId,companyName=companyName,year1=year1,month1=month1
        ,revenue=revenue,formatted_revenue=formatted_revenue,cost=cost,formatted_cost=formatted_cost,expense=expense,formatted_expense=formatted_expense
        ,profit=profit,formatted_profit=formatted_profit,nonrevenue=nonrevenue,formatted_nonrevenue=formatted_nonrevenue,noncost=noncost
        ,formatted_noncost=formatted_noncost,income=income,formatted_income=formatted_income,costPercent=costPercent,expensePercent=expensePercent
        ,profitPercent=profitPercent,nonrevenuePercent=nonrevenuePercent,noncostPercent=noncostPercent,incomePercent=incomePercent,netincome=netincome
        ,formatted_netincome=formatted_netincome,voucherNumber=voucherNumber,formatted_voucherNumber=formatted_voucherNumber,extracost=extracost
        ,formatted_extracost=formatted_extracost,extraexpense=extraexpense,formatted_extraexpense=formatted_extraexpense,note=note,selectedStaff=selectedStaff
        ,year=year,month=month,date=date)

        # 生成 PDF 文件名
        last_12_chars = formId[-12:]
        pdf_filename = f"{companyName}_憑證統計表_{last_12_chars}.pdf"

        # 確保 'pdfs' 目錄存在，若不存在則創建
        pdf_folder = os.path.join(os.getcwd(), 'pdfs')  # 當前目錄下的 pdfs 資料夾
        os.makedirs(pdf_folder, exist_ok=True)  # 如果資料夾不存在則創建

        # 使用 pdfkit 生成 PDF
        pdf_path = os.path.join(pdf_folder, pdf_filename)

        options = {
            'encoding': 'UTF-8', #可以解決中文亂碼問題
            'no-outline': None,  # 禁用文檔輪廓
            'quiet': None         # 禁用日志
        }
        # 將 HTML 文件轉換為 PDF
        pdfkit.from_string(html_content, pdf_path, options=options)

        # 更新資料庫中的pdf_name欄位
        update_query = """
                    UPDATE formA
                    SET pdf_name = %s
                    WHERE form_id = %s
                """
        cursor.execute(update_query, (pdf_filename, formId))
        mysql.connection.commit()

        # 返回 PDF 文件
        return send_file(pdf_path, as_attachment=True, download_name=pdf_filename, mimetype='application/pdf')


        return jsonify({'success': True, 'message': '表單資料提交成功'}), 201

    except Exception as e:
        return jsonify({'success': False, 'message': f'提交失敗: {str(e)}'}), 500

@app.route('/api/stagingArea', methods=['GET'])
def staging_area():
    try:
        cursor = get_db_connection()

        # 查询所有的表单
        query = "SELECT form_id, pdf_name, form_status FROM formA WHERE form_status = 0"  # 可以根据需求调整 form_status 的条件
        cursor.execute(query)
        forms = cursor.fetchall()

        # 构建返回的 JSON 数据
        form_list = []
        for form in forms:
            form_data = {
                "form_id": form[0],
                "pdf_name": form[1],
                "form_status": form[2]
            }
            form_list.append(form_data)

        return jsonify({'success': True, 'forms': form_list}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/pdfs/<pdf_name>')
def serve_pdf(pdf_name):
    pdf_folder = os.path.join(os.getcwd(), 'pdfs')
    pdf_path = os.path.join(pdf_folder, pdf_name)

    if os.path.exists(pdf_path):
        return send_file(pdf_path, mimetype='application/pdf')
    else:
        return jsonify({'success': False, 'message': 'PDF 文件未找到'}), 404

@app.route('/api/deleteForm', methods=['POST'])
def delete_form():
    try:
        data = request.get_json()
        form_id = data.get('formId')

        if not form_id:
            return jsonify({'success': False, 'message': 'formId 是必填的'}), 400

        # 获取数据库连接
        cursor = get_db_connection()

        # 更新表单状态为 2 (已删除)
        update_query = "UPDATE formA SET form_status = 2 WHERE form_id = %s"
        cursor.execute(update_query, (form_id,))

        # 提交事务
        mysql.connection.commit()

        return jsonify({'success': True, 'message': '表单删除成功'}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# 存储 PDF 文件的目录
PDF_DIRECTORY = './pdfs/'


@app.route('/api/mergePdf', methods=['POST'])
def merge_pdf():
    try:
        # 获取前端传来的 pdfNames
        data = request.get_json()
        pdf_names = data.get('pdfNames', [])

        # 确保至少传入一个 PDF 名称
        if not pdf_names:
            return jsonify({"success": False, "message": "没有提供有效的文件名"}), 400

        # 创建 PdfMerger 对象
        merger = PdfMerger()

        # 循环合并所有 PDF
        for pdf_name in pdf_names:
            pdf_path = os.path.join(PDF_DIRECTORY, pdf_name)
            if os.path.exists(pdf_path):
                merger.append(pdf_path)
            else:
                return jsonify({"success": False, "message": f"文件 {pdf_name} 不存在"}), 400

        # 输出合并后的文件
        merged_pdf_path = os.path.join(PDF_DIRECTORY, 'merged_output.pdf')
        merger.write(merged_pdf_path)
        merger.close()

        # 返回合并后的 PDF URL
        merged_pdf = f'merged_output.pdf'
        return jsonify({"success": True, "mergedPdf": merged_pdf})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)