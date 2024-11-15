from flask import Flask, request, jsonify,send_from_directory
from flask_mysqldb import MySQL
from flask_cors import CORS
import os
import pdfkit
from flask import send_file
from flask import Flask, render_template
from datetime import datetime
from PyPDF2 import PdfMerger
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

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

PDF_DIRECTORY = './pdfs/'
# 確保 'pdfs' 目錄存在，若不存在則創建
merged_pdf_folder = os.path.join(PDF_DIRECTORY, 'merge')  # 當前pdfs目錄下的 merge 資料夾
upload_pdf_folder = os.path.join(PDF_DIRECTORY, 'upload')  # 當前pdfs目錄下的 merge 資料夾
# 如果 目錄不存在，則創建它
os.makedirs(merged_pdf_folder, exist_ok=True)
os.makedirs(upload_pdf_folder, exist_ok=True)

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
        template_name = 'formA_template_checked.html' if isChecked == 'Y' else 'formA_template_unchecked.html'
        html_content = render_template(template_name, formId=formId,companyName=companyName,year1=year1,month1=month1
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


# 配置静态文件夹，让 Flask 能处理 /pdfs/merge/ 下的请求，不設定這個的話，儘管網址對，pdf預覽會跳出404
@app.route('/pdfs/merge/<filename>')
def download_pdf(filename):
    return send_from_directory(merged_pdf_folder, filename)

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

        # 使用第一个 PDF 名称来提取文件信息
        first_pdf_name = pdf_names[0]
        # 拆解文件名
        parts = first_pdf_name.split('_')

        company_name = parts[0]  # 公司名称
        system_date = parts[2]  # 系统日期

        cursor = get_db_connection()

        # 查询该公司和日期的合并文件，获取最大的序号
        cursor.execute("""
                    SELECT merge_pdf_name FROM pdf_merge_history 
                    WHERE company_name = %s AND system_date = %s 
                    ORDER BY merge_pdf_name DESC LIMIT 1
                """, (company_name, system_date))

        result = cursor.fetchone()

        # 如果存在合併檔案，提取最大的序號并加1
        if result:
            last_merge_pdf_name = result[0]
            print(f"Last merge PDF name: {last_merge_pdf_name}")
            try:
                # 提取檔案名稱中的序號部分，例如 "_001", "_002" 等
                sequence_number = int(
                    last_merge_pdf_name.split('_')[-1].replace('.pdf', ''))  # 假设格式是 "{company_name}_合併檔案_{system_date}_001"
                new_sequence = sequence_number + 1
            except ValueError:
                # 如果解析序号出错，从 001 开始
                new_sequence = 1
        else:
            # 如果没有记录，序号从 001 开始
            new_sequence = 1

        # 确保序号是 3 位数
        new_sequence_str = str(new_sequence).zfill(3)  # 例如 1 变成 "001", 2 变成 "002"

        # 循环合并所有 PDF
        for pdf_name in pdf_names:
            pdf_path = os.path.join(PDF_DIRECTORY, pdf_name)
            if os.path.exists(pdf_path):
                merger.append(pdf_path)
            else:
                return jsonify({"success": False, "message": f"文件 {pdf_name} 不存在"}), 400


        # 输出合并后的文件
        merged_pdf = f'{company_name}_合併檔案_{system_date}_{new_sequence_str}.pdf'
        merged_pdf_path = os.path.join(merged_pdf_folder, merged_pdf)
        merger.write(merged_pdf_path)
        merger.close()
        merged_pdf_url = f'http://localhost:5000/pdfs/merge/{merged_pdf}'

        # 存储合并记录到数据库
        cursor.execute("""
                    INSERT INTO pdf_merge_history (company_name, system_date, merge_pdf_name)
                    VALUES (%s, %s, %s)
                """, (company_name, system_date, merged_pdf))
        cursor.connection.commit()

        # 返回合并后的 PDF檔名
        return jsonify({"success": True, "mergedPdf": merged_pdf,"mergedPdfUrl": merged_pdf_url})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500



app.config['upload_pdf_folder'] = upload_pdf_folder
# 用於處理文件上傳的 API
@app.route('/api/uploadPdf', methods=['POST'])
def upload_pdf():
    if 'files' not in request.files:
        return jsonify({"success": False, "message": "No files part"}), 400

    files = request.files.getlist('files')
    if not files:
        return jsonify({"success": False, "message": "No file selected"}), 400

    for file in files:
        if file and file.filename.endswith('.pdf'):
            filename = os.path.join(app.config['upload_pdf_folder'], file.filename)
            file.save(filename)
        else:
            return jsonify({"success": False, "message": "Only PDF files are allowed"}), 400

    return jsonify({"success": True, "message": "Files uploaded successfully"}), 200

@app.route('/api/updateMailPdfName', methods=['POST'])
def update_mail_pdf_name():
    # 从请求中获取数据
    data = request.get_json()
    pdf_names = data.get('pdfNames')  # 所有的 PDF 文件名稱

    # if not pdf_names or not form_ids:
    #     return jsonify({'success': False, 'message': 'pdfNames 和 formIds 必須提供'}), 400

    # if len(pdf_names) != len(form_ids):
    #     return jsonify({'success': False, 'message': 'pdfNames 和 formIds 長度不匹配'}), 400

    try:
        cursor = get_db_connection()

        # 如果只有一個pdf，更新對應表單的send_mail_pdf_name
        if len(pdf_names) == 1:
            cursor.execute(
                "UPDATE formA SET send_mail_pdf_name = %s WHERE pdf_name = %s",
                (pdf_names[0], pdf_names[0])  # 對應的pdf_name和form_id
            )
        else:
            # 如果有多個pdf，處理為合併pdf
            merged_pdf_name = data.get('mergedPdf')  # 合併後的文件名稱
            placeholders = ', '.join(['%s'] * len(pdf_names))  # 生成占位符
            cursor.execute(
                f"UPDATE formA SET send_mail_pdf_name = %s WHERE pdf_name IN ({placeholders})",
                [merged_pdf_name] + pdf_names  # 合併數據，將 merged_pdf_name 和 pdf_names 傳遞進去
            )
            # cursor.execute(
            #     "UPDATE formA SET send_mail_pdf_name = %s WHERE pdf_name IN (%s)", 
            #     (merged_pdf_name, ','.join([str(pdf_name) for pdf_name in pdf_names]))
            # )

        mysql.connection.commit()
        cursor.close()

        return jsonify({'success': True, 'message': '更新成功'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# 发送邮件的函数
def send_email(file_path, recipient_email):
    sender_email = "kate1sync@gmail.com"  # 发件人电子邮件地址
    sender_password = "nyprqzhhdvjtmcyl"  # 发件人应用密码

    try:
        # 设置邮件内容
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = "PDF 文件"

        body = "请查看附件中的 PDF 文件。"
        msg.attach(MIMEText(body, 'plain'))

        # 附加 PDF 文件
        with open(file_path, 'rb') as file:
            part = MIMEApplication(file.read(), Name=os.path.basename(file_path))
        part['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        msg.attach(part)

        # 发送邮件
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)

        print(f"邮件成功发送至: {recipient_email}")

    except smtplib.SMTPException as e:
            print(f"SMTP 错误: {e}")
            raise  # 重新抛出异常，让调用者处理

    except Exception as e:
        print(f"发送邮件时发生错误: {e}")
        raise  # 重新抛出异常，让调用者处理

def update_form_status(file_name):
    try:
        # 获取数据库连接
        cursor = get_db_connection()

        # 根据pdf_name更新form_status
        update_query = "UPDATE formA SET form_status = 1 WHERE send_mail_pdf_name = %s"
        cursor.execute(update_query, (file_name,))

        # 提交事务
        mysql.connection.commit()
        cursor.close()

    except Exception as e:
        print(f"更新数据库时发生错误: {e}")

# 后端 API 接口
@app.route('/api/sendEmail', methods=['POST'])
def send_email_request():
    try:
        # 获取前端传来的 JSON 数据
        data = request.get_json()

        # 获取收件人邮箱地址和 PDF 信息
        recipient_email = data.get('recipient')
        pdf_info = data.get('pdfInfo')

        # 确保有有效的收件人邮箱和 PDF 信息
        if not recipient_email or not pdf_info:
            return jsonify({"error": "缺少收件人或PDF文件信息"}), 400

        # 对每个 PDF 文件执行邮件发送操作
        for pdf in pdf_info:
            file_name = pdf['name']

            if "合併檔案" in file_name:
                file_path = "C:/Users/Kate/PycharmProjects/lida_project/python/pdfs/merge"
            else:
                file_path = "C:/Users/Kate/PycharmProjects/lida_project/python/pdfs"

            file_path_name = rf'{file_path}/{file_name}'
            # 发送邮件
            #email_sent = send_email(file_path, recipient_email)
            #if not email_sent:
            #    return jsonify({"error": "邮件发送失败"}), 500
            send_email(file_path_name, recipient_email)
            print(file_name)

            # 邮件发送成功后，更新数据库
            update_form_status(file_name)

            return jsonify({"message": "邮件发送成功"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "邮件发送失败"}), 500




if __name__ == '__main__':
    app.run(debug=True)