import logging
import sys
import io
import base64
import urllib.parse
import os
from datetime import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
# 第三方庫導入
import matplotlib
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.ticker import MaxNLocator
from flask import Flask, request, jsonify, send_from_directory, send_file, render_template
from flask_mysqldb import MySQL
from flask_cors import CORS
import pdfkit
from PyPDF2 import PdfMerger
matplotlib.use('Agg')  # 設置Matplotlib使用Agg後端，這樣不會開啟GUI

app = Flask(__name__, static_folder='../react/build')
# 設置一個密鑰來保護 session 資料
app.secret_key = os.urandom(24)  # 或者設定固定的密鑰
# CORS(app, origins=["http://localhost:5173"])
CORS(app, origins=["http://192.168.1.185:3000"])

# 配置 MySQL 資料庫連線
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '1qaz@WSX'
app.config['MYSQL_DB'] = 'dw'

mysql = MySQL(app)

# 獲取系統日期
now = datetime.now()
# 格式化日期為 YYYYMMDD 格式
date_str = now.strftime("%Y%m%d")

PDF_DIRECTORY = './pdfs/'
# 確保 'pdfs' 目錄存在，若不存在則創建
merged_pdf_folder = os.path.join(PDF_DIRECTORY, 'merge')  # 當前pdfs目錄下的 merge 資料夾
# upload_pdf_folder = os.path.join(PDF_DIRECTORY, 'upload')  # 當前pdfs目錄下的 merge 資料夾
upload_pdf_folder = PDF_DIRECTORY
# 如果 目錄不存在，則創建它
os.makedirs(merged_pdf_folder, exist_ok=True)
os.makedirs(upload_pdf_folder, exist_ok=True)

# 獲取當前程式所在目錄
# app_dir = os.path.dirname(os.path.abspath(__file__))
# 根據是否在 PyInstaller 打包後運行來調整路徑
if getattr(sys, 'frozen', False):
    # 如果是打包後的應用程式，使用 sys._MEIPASS 來獲取臨時解壓目錄
    app_dir = os.path.dirname(sys.executable)
else:
    # 如果是未打包的開發環境，使用當前腳本的絕對路徑
    app_dir = os.path.dirname(os.path.abspath(__file__))

# log資訊
log_directory = "logs"
os.makedirs(log_directory, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,  # 設置日誌等級
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(f"logs/app.log", encoding="utf-8")  # 輸出成log檔
        # logging.StreamHandler()  # 同時輸出到控制台
    ]
)

# 設定使用 Windows 內建的 msjh.ttc 字體
font_path = 'C:\\Windows\\Fonts\\msjh.ttc'  # 字體文件路徑
font_prop = font_manager.FontProperties(fname=font_path)

# 設置全局默認字體
plt.rcParams['font.family'] = font_prop.get_name()
# 取得當前月份
current_month = datetime.now().strftime("%m")  # 以數字格式獲取月份，結果會是 '12'

# 特別設定 'werkzeug' 的日誌等級為 ERROR，避免它輸出 INFO 和 WARNING 訊息
# logging.getLogger('werkzeug').setLevel(logging.ERROR)


# MySQL連線
def get_db_connection():
    """创建并返回数据库连接"""
    return mysql.connection.cursor()


# 登入驗證
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        logging.warning("Login attempt failed: Missing username or password")
        return jsonify({'success': False, 'message': '帳號或密碼為空'}), 400

    cursor = None
    try:
        cursor = get_db_connection()
        cursor.execute("SELECT * FROM users_info WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user and user[2] == password:  # 假设 'users' 表格包含 'username', 'email', 'password'
            logging.info(f"User:{username} logged in successfully")
            return jsonify({'success': True, 'message': '登入成功'})
        else:
            logging.warning(f"Incorrect user:{username} or password:{password}")
            return jsonify({'success': False, 'message': '錯誤的帳號或密碼'}), 401
    finally:
        if cursor:
            cursor.close()


# 獲取公司名稱
@app.route('/api/getCompanyName', methods=['GET'])
def get_company_name():
    companyId = request.args.get('companyId')  # 獲取前端傳遞來的公司編碼
    if companyId:
        logging.info(f"Received request to get company name for companyId: {companyId}")

        cursor = None
        try:
            cursor = get_db_connection()
            cursor.execute("SELECT company_name FROM company_info WHERE company_id = %s", (companyId,))
            result = cursor.fetchone()  # 獲取查詢結果

            if result:
                companyname = result[0]  # 公司名稱在結果中，是第一個字段
                logging.info(f"Found company name: {companyname} for companyId: {companyId}")  # 記錄成功查詢的結果
                return jsonify({'companyName': companyname})  # 回傳公司名稱
            else:
                logging.warning(f"CompanyId {companyId} not found in the database")
                return jsonify({'message': '找不到對應的公司名稱'}), 404
        except Exception as e:
            logging.error(f"Error while fetching company name for companyId {companyId}: {e}")
            return jsonify({'message': str(e)}), 500
        finally:
            if cursor:
                cursor.close()
    else:
        return jsonify({'message': '公司編號不能為空'}), 400


# 取得表單編號
@app.route('/api/getSequence', methods=['GET'])
def get_sequence():
    company_id = request.args.get('companyId')
    if not company_id:
        logging.warning("Company ID is missing in the request.")
        return jsonify({'success': False, 'message': '公司編號不能為空'}), 400

    # 獲取系統日期，格式化為 YYYYMMDD
    system_date = datetime.today().strftime('%Y%m%d')

    cursor = None
    try:
        cursor = get_db_connection()
        # 查詢該公司今日已經生成的最大序號
        cursor.execute('''
                SELECT form_id 
                FROM formA 
                WHERE company_id = %s AND form_id LIKE %s
                ORDER BY updated_time DESC LIMIT 1;
            ''', (company_id, f"{company_id}_A_{system_date}_%"))
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
            new_form_id = f"{company_id}_A_{system_date}_{new_sequence_str}"
            logging.info(f"Generated new form_id: {new_form_id} for company_id: {company_id}")
            return jsonify({'success': True, 'formId': new_form_id})
        else:
            # 如果找不到該公司編號，從001開始
            new_form_id = f"{company_id}_A_{system_date}_001"
            logging.info(f"Generated new form_id: {new_form_id} for company_id: {company_id}")
            return jsonify({'success': True, 'formId': new_form_id})
    except Exception as e:
        logging.error(f"Error occurred while generating form_id for company_id {company_id}: {e}")
        return jsonify({'success': False, 'message': '服務器錯誤'}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/getStaffInfo', methods=['GET'])
def get_staff_info():
    user = request.args.get('user')  # 獲取前端傳來的帳號資訊
    if not user:
        logging.warning("User parameter is missing.")
        return jsonify({'message': '帳號信息不能為空'}), 400

    cursor = None
    try:
        cursor = get_db_connection()

        # 查詢當前用戶對應的服務人員菜單
        staff_menu_query = "SELECT staff_menu FROM users_info WHERE username = %s"
        cursor.execute(staff_menu_query, (user,))

        staff_menu_result = cursor.fetchall()

        # 查詢所有員工對應的服務人員菜單
        all_staff_query = "SELECT staff_menu FROM users_info WHERE staff_menu is not null"
        cursor.execute(all_staff_query)

        all_staff_menus = [staff[0] for staff in cursor.fetchall()]

        if staff_menu_result:
            # 獲取第一個菜單項目，而非整個數組
            staff_menu = staff_menu_result[0][0] if staff_menu_result else None

            # 回傳當前用戶以及所有員工對應的服務人員菜單
            response_data = {
                'staff_menu': staff_menu,
                'allStaffMenus': all_staff_menus
            }
            logging.info(f"Successfully fetched staff menu for user: {user}")
            return jsonify(response_data)
        else:
            logging.warning(f"No staff information found for user: {user}")
            return jsonify({'message': '沒有查到服務人員'}), 404
    except Exception as e:
        logging.error(f"Error occurred while fetching staff info for user {user}: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


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
    selectedOption = data.get('selectedOption')
    netincomepercent = data.get('netincomepercent')
    netincome = data.get('netincome')
    extracost = data.get('extracost')
    extraexpense = data.get('extraexpense')
    note = data.get('note')
    selectedStaff = data.get('selectedStaff')
    year = data.get('year')
    month = data.get('month')
    date = data.get('date')
    user = data.get('user')
    department = '力達'

    # 檢查所有字段是否必填
    # if not formId or not companyId or not year1 or not month1 or not revenue or not income:
    #     return jsonify({'success': False, 'message': '所有字段都是必填的'}), 400

    # 將數據寫入到 MySQL
    cursor = None
    try:
        cursor = get_db_connection()

        query = """
            INSERT INTO formA(form_id, company_id, company_name, form_titleyear, form_titlemonth, revenue, cost
            ,expense, profit, nonrevenue, noncost, income, cost_percent, expense_percent, profit_percent
            ,nonrevenue_percent, noncost_percent, income_percent, ischecked, selectedoption, netincome_percent
            ,netincome, extracost, extraexpense, note, staff, form_submityear, form_submitmonth, form_submitdate
            ,user_name, department)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (formId, companyId, companyName, year1, month1, revenue, cost, expense, profit,
                               nonrevenue, noncost, income, costPercent, expensePercent, profitPercent,
                               nonrevenuePercent, noncostPercent, incomePercent, isChecked, selectedOption,
                               netincomepercent, netincome, extracost, extraexpense, note, selectedStaff,
                               year, month, date, user, department))

        # 提交
        mysql.connection.commit()
        logging.info(f"Form data for formId: {formId} successfully inserted into the database.")

        # PDF格式化:千分位、負數紅字
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

        # PDF格式化:比例只顯示小數點後兩位
        costPercent = round(costPercent, 2)
        expensePercent = round(expensePercent, 2)
        profitPercent = round(profitPercent, 2)
        nonrevenuePercent = round(nonrevenuePercent, 2)
        noncostPercent = round(noncostPercent, 2)
        incomePercent = round(incomePercent, 2)

        # 根據isChecked套用不同的HTML模板
        template_name = 'formA_template_checked.html' if isChecked == 'Y' else 'formA_template_unchecked.html'
        html_content = render_template(template_name, app_dir=app_dir, formId=formId, companyName=companyName,
                                       year1=year1, month1=month1, revenue=revenue, formatted_revenue=formatted_revenue,
                                       cost=cost, formatted_cost=formatted_cost, expense=expense,
                                       formatted_expense=formatted_expense, profit=profit,
                                       formatted_profit=formatted_profit, nonrevenue=nonrevenue,
                                       formatted_nonrevenue=formatted_nonrevenue, noncost=noncost,
                                       formatted_noncost=formatted_noncost, income=income,
                                       formatted_income=formatted_income, costPercent=costPercent,
                                       expensePercent=expensePercent, profitPercent=profitPercent,
                                       nonrevenuePercent=nonrevenuePercent, noncostPercent=noncostPercent,
                                       incomePercent=incomePercent, selectedOption=selectedOption,
                                       netincomepercent=netincomepercent, netincome=netincome,
                                       formatted_netincome=formatted_netincome, voucherNumber=voucherNumber,
                                       formatted_voucherNumber=formatted_voucherNumber, extracost=extracost,
                                       formatted_extracost=formatted_extracost, extraexpense=extraexpense,
                                       formatted_extraexpense=formatted_extraexpense, note=note,
                                       selectedStaff=selectedStaff, year=year, month=month, date=date)

        # 生成 PDF 文件名
        last_12_chars = formId[-12:]
        pdf_filename = f"{companyName}_憑證統計表_{last_12_chars}.pdf"

        # encoded_pdf_filename = urllib.parse.quote(pdf_filename)
        # 如果文件名包含 "啓勝美術社" 或 "慶峯榮金屬企業社" 或 "一块田創意工作室" 才進行 URL 編碼，否則保持原文件名
        if any(keyword in pdf_filename for keyword in ["啓勝美術社", "慶峯榮金屬企業社", "一块田創意工作室"]):
            encoded_pdf_filename = urllib.parse.quote(pdf_filename)
        else:
            encoded_pdf_filename = pdf_filename

        # 確保 'pdfs' 目錄存在，若不存在則創建
        pdf_folder = os.path.join(os.getcwd(), 'pdfs')  # 當前目錄下的 pdfs 資料夾
        os.makedirs(pdf_folder, exist_ok=True)  # 如果資料夾不存在則創建

        # 使用 pdfkit 生成 PDF
        pdf_path = os.path.join(pdf_folder, encoded_pdf_filename)

        options = {
            'encoding': 'UTF-8',  # 可以解決中文亂碼問題
            'no-outline': None,  # 禁用文檔輪廓
            'quiet': None,  # 禁用日志
            'margin-top': '5mm',  # 可調整pdf邊界問題
            # 'margin-right': '0mm',
            # 'margin-bottom': '0mm',
            # 'margin-left': '0mm',
        }
        # 將 HTML 文件轉換為 PDF
        pdfkit.from_string(html_content, pdf_path, options=options)

        rename_rules = {
            "%E6%86%91%E8%AD%89%E7%B5%B1%E8%A8%88%E8%A1%A8": "憑證統計表",
            "%E5%95%93%E5%8B%9D%E7%BE%8E%E8%A1%93%E7%A4%BE": "啓勝美術社",
            "%E6%85%B6%E5%B3%AF%E6%A6%AE%E9%87%91%E5%B1%AC%E4%BC%81%E6%A5%AD%E7%A4%BE": "慶峯榮金屬企業社",
            "%E4%B8%80%E5%9D%97%E7%94%B0%E5%89%B5%E6%84%8F%E5%B7%A5%E4%BD%9C%E5%AE%A4": "一块田創意工作室",
        }
        # 檢查文件名是否需要更改
        new_filename = encoded_pdf_filename
        for old_str, new_str in rename_rules.items():
            if old_str in new_filename:
                new_filename = new_filename.replace(old_str, new_str)

        # 如果文件名有變化，則進行重新命名
        if new_filename != encoded_pdf_filename:
            old_filepath = os.path.join(pdf_folder, encoded_pdf_filename)
            new_filepath = os.path.join(pdf_folder, new_filename)

            # 執行重新命名
            os.rename(old_filepath, new_filepath)

        # 更新資料庫中的pdf_name欄位
        update_query = """
                    UPDATE formA
                    SET pdf_name = %s
                    WHERE form_id = %s
                """
        cursor.execute(update_query, (pdf_filename, formId))
        mysql.connection.commit()
        logging.info(f"PDF generated successfully for formId: {formId}. PDF path: {pdf_path}")

        # 返回 PDF 文件
        new_filepath = os.path.join(pdf_folder, new_filename)
        return send_file(new_filepath, as_attachment=True, download_name=new_filename, mimetype='application/pdf')
        # return jsonify({'success': True, 'message': '表單資料提交成功'}), 201

    except Exception as e:
        logging.error(f"Error while processing formId: {formId} - {str(e)}")
        return jsonify({'success': False, 'message': f'提交失敗: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/stagingArea', methods=['GET'])
def staging_area():
    user = request.args.get('user')  # 獲取前端傳遞來的帳戶資訊
    logging.info(f"Received request for user: {user}")

    cursor = None
    try:
        cursor = get_db_connection()

        # 查詢用户的角色
        role_query = "SELECT role FROM users_info WHERE username = %s"
        cursor.execute(role_query, (user,))
        user_role = cursor.fetchone()

        # 使用 UNION ALL 查詢 formA 和 quotation 資料
        if user_role[0] == 'admin':
            query = """
                        SELECT form_id, pdf_name, form_status, user_name, '憑證統計表' AS form_type, department
                        FROM formA
                        WHERE form_status = 0
                        UNION ALL
                        SELECT quotation_id AS form_id, pdf_name, form_status, user_name, '報價單' AS form_type, department
                        FROM quotation
                        WHERE form_status = 0
                        UNION ALL
                        SELECT request_payment_id AS form_id, pdf_name, form_status, user_name, '請款單' AS form_type, department
                        FROM request_payment
                        WHERE form_status = 0
                    """
            cursor.execute(query)
        else:
            query = """
                        SELECT form_id, pdf_name, form_status, user_name, '憑證統計表' AS form_type, department
                        FROM formA
                        WHERE form_status = 0 AND user_name = %s
                        UNION ALL
                        SELECT quotation_id AS form_id, pdf_name, form_status, user_name, '報價單' AS form_type, department
                        FROM quotation
                        WHERE form_status = 0 AND user_name = %s
                        UNION ALL
                        SELECT request_payment_id AS form_id, pdf_name, form_status, user_name, '請款單' AS form_type, department
                        FROM request_payment
                        WHERE form_status = 0 AND user_name = %s
                    """
            cursor.execute(query, (user, user, user))

        # 獲取查詢結果
        results = cursor.fetchall()

        # 構建回傳的 JSON 數據
        form_list = []
        for form in results:
            form_data = {
                "form_id": form[0],
                "pdf_name": form[1],
                "form_status": form[2],
                "user_name": form[3],
                "form_type": form[4],
                "department": form[5],
            }
            form_list.append(form_data)

        return jsonify({'success': True, 'forms': form_list}), 200

    except Exception as e:
        logging.error(f"Error occurred: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/pdfs/<pdf_name>')
def serve_pdf(pdf_name):
    pdf_folder = os.path.join(os.getcwd(), 'pdfs')
    pdf_path = os.path.join(pdf_folder, pdf_name)

    if os.path.exists(pdf_path):
        return send_file(pdf_path, mimetype='application/pdf')
    else:
        logging.warning(f"PDF file not found: {pdf_path}")
        return jsonify({'success': False, 'message': 'PDF 文件未找到'}), 404


@app.route('/api/deleteForm', methods=['POST'])
def delete_form():
    cursor = None
    form_id = None
    try:
        data = request.get_json()
        form_id = data.get('formId')
        form_type = data.get('formType')

        if not form_id:
            return jsonify({'success': False, 'message': 'formId 是必填的'}), 400

        cursor = get_db_connection()

        # 更新表單狀態=2 (已删除)
        # 根據 form_type 選擇不同的表和欄位
        if form_type == '報價單':
            update_query = """
                        UPDATE quotation
                        SET form_status = 2, updated_time = NOW()
                        WHERE quotation_id = %s
                    """
        elif form_type == '憑證統計表':
            update_query = """
                        UPDATE formA
                        SET form_status = 2, updated_time = NOW()
                        WHERE form_id = %s
                    """
        elif form_type == '請款單':
            update_query = """
                        UPDATE request_payment
                        SET form_status = 2, updated_time = NOW()
                        WHERE request_payment_id = %s
                    """
        else:
            return jsonify({'success': False, 'message': '未知的表單類型'}), 400
        cursor.execute(update_query, (form_id,))

        mysql.connection.commit()

        logging.info(f"Form with form_id: {form_id} deleted successfully")
        return jsonify({'success': True, 'message': '表單刪除成功'}), 200

    except Exception as e:
        if form_id:
            logging.error(f"Error deleting form with form_id: {form_id}, error: {str(e)}")
        else:
            logging.error(f"Error deleting form, form_id is not provided, error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# 配置靜態文件夾，讓 Flask 能處理 /pdfs/merge/ 下的請求，不設定這個的話，儘管網址對，pdf預覽會跳出404
# @app.route('/pdfs/merge/<filename>')
# def download_pdf(filename):
#     return send_from_directory(merged_pdf_folder, filename)

@app.route('/pdfs/merge/<filename>')
def download_pdf(filename):
    # 構造完整的檔案路徑
    merged_pdf_folder = os.path.join(os.getcwd(), 'pdfs', 'merge')
    pdf_path = os.path.join(merged_pdf_folder, filename)

    if os.path.exists(pdf_path):
        return send_from_directory(merged_pdf_folder, filename)
    else:
        logging.warning(f"PDF file not found: {pdf_path}")
        return jsonify({'success': False, 'message': 'PDF 文件未找到'}), 404


@app.route('/api/mergePdf', methods=['POST'])
def merge_pdf():
    cursor = None
    try:
        # 獲取前端傳來的 pdfNames
        data = request.get_json()
        pdf_names = data.get('pdfNames', [])

        # 確保至少傳入一個PDF名稱
        if not pdf_names:
            logging.warning("No PDF names provided in the request")
            return jsonify({"success": False, "message": "没有提供有效的文件名"}), 400

        # 創建 PdfMerger 對象
        merger = PdfMerger()

        # 使用第一個 PDF 名稱來當作新名稱的基底
        first_pdf_name = pdf_names[0]
        # 拆解文件名
        parts = first_pdf_name.split('_')

        company_name = parts[0]  # 公司名稱
        form_type = parts[1]
        raw_date_segment  = parts[2]  # 系統日期

        # 針對不同 form_type 判斷如何取出日期
        if form_type == '報價單':
            # 日期是開頭的 8 碼，例如 "20250422A040" → "20250422"
            system_date = raw_date_segment[:8]
        else:
            # 憑證統計表或其他類型直接就是日期
            system_date = raw_date_segment

        cursor = get_db_connection()

        # 查詢合併文件名稱，獲取最大的序號
        cursor.execute("""
                    SELECT merge_pdf_name FROM pdf_merge_history 
                    WHERE company_name = %s AND system_date = %s 
                    ORDER BY merge_pdf_name DESC LIMIT 1
                """, (company_name, system_date))

        result = cursor.fetchone()

        # 如果存在合併檔案，提取最大的序號並追加1
        if result:
            last_merge_pdf_name = result[0]
            try:
                # 提取檔案名稱中的序號部分，例如 "_001", "_002" 等
                sequence_number = int(
                    last_merge_pdf_name.split('_')[-1].replace('.pdf',
                                                               ''))  # 格式是 "{company_name}_合併檔案_{system_date}_001"
                new_sequence = sequence_number + 1
            except ValueError:
                # 如果解析序號出錯，序號從001開始
                new_sequence = 1
        else:
            # 如果查無紀錄，序號從001開始
            new_sequence = 1

        # 確保序號是3位數
        new_sequence_str = str(new_sequence).zfill(3)  # 例如 1 變為 "001", 2 變為 "002"

        # 循環合併所有 PDF
        for pdf_name in pdf_names:
            pdf_path = os.path.join(PDF_DIRECTORY, pdf_name)
            if os.path.exists(pdf_path):
                merger.append(pdf_path)
            else:
                logging.error(f"PDF file {pdf_name} does not exist at {pdf_path}")
                return jsonify({"success": False, "message": f"文件 {pdf_name} 不存在"}), 400

        # 輸出合併後的文件
        merged_pdf = f'{company_name}_合併檔案_{system_date}_{new_sequence_str}.pdf'
        merged_pdf_path = os.path.join(merged_pdf_folder, merged_pdf)
        merger.write(merged_pdf_path)
        merger.close()
        logging.info(f"PDFs merged successfully into: {merged_pdf}")
        merged_pdf_url = f'http://localhost:5000/pdfs/merge/{merged_pdf}'

        # 儲存合併記錄到資料庫
        cursor.execute("""
                    INSERT INTO pdf_merge_history (company_name, system_date, merge_pdf_name)
                    VALUES (%s, %s, %s)
                """, (company_name, system_date, merged_pdf))
        cursor.connection.commit()

        # 回傳合併後的 PDF檔名
        return jsonify({"success": True, "mergedPdf": merged_pdf, "mergedPdfUrl": merged_pdf_url, "formType": form_type})

    except Exception as e:
        logging.error(f"Error during PDF merge process: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()


app.config['upload_pdf_folder'] = upload_pdf_folder


# 用於處理文件上傳的 API
@app.route('/api/uploadPdf', methods=['POST'])
def upload_pdf():
    if 'files' not in request.files:
        logging.warning("No files part in the request")
        return jsonify({"success": False, "message": "No files part"}), 400

    files = request.files.getlist('files')
    if not files:
        logging.warning("No file selected")
        return jsonify({"success": False, "message": "No file selected"}), 400

    for file in files:
        if file and file.filename.endswith('.pdf'):
            filename = os.path.join(app.config['upload_pdf_folder'], file.filename)
            file.save(filename)
            logging.info(f"File {file.filename} uploaded successfully to {filename}")
        else:
            logging.warning(f"Invalid file type: {file.filename}. Only PDF files are allowed.")
            return jsonify({"success": False, "message": "Only PDF files are allowed"}), 400

    return jsonify({"success": True, "message": "Files uploaded successfully"}), 200


@app.route('/api/updateMailPdfName', methods=['POST'])
def update_mail_pdf_name():
    data = request.get_json()
    pdf_names = data.get('pdfNames')  # 所有的 PDF 文件名稱
    merged_pdf_name = data.get('mergedPdf')  # 如果有合併檔案

    cursor = None
    try:
        if not pdf_names:
            return jsonify({'success': False, 'message': '缺少 pdfNames'}), 400

        cursor = get_db_connection()

        for pdf_name in pdf_names:
            if '憑證統計表' in pdf_name:
                update_table = 'formA'
            elif '報價單' in pdf_name:
                update_table = 'quotation'
            elif '請款單' in pdf_name:
                update_table = 'request_payment'
            else:
                logging.warning(f"未知類型的 PDF: {pdf_name}")
                continue  # 忽略未知的類型

            # 判斷要使用合併後的名稱還是原始 pdf_name
            target_pdf_name = merged_pdf_name if merged_pdf_name else pdf_name

            # 執行更新
            cursor.execute(
                f"UPDATE {update_table} SET send_mail_pdf_name = %s WHERE pdf_name = %s",
                (target_pdf_name, pdf_name)
            )

        mysql.connection.commit()
        logging.info(f"Successfully updated send_mail_pdf_name for {len(pdf_names)} PDF(s)")
        return jsonify({'success': True, 'message': '更新成功'}), 200

    except Exception as e:
        logging.error(f"Error updating send_mail_pdf_name: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        if cursor:
            cursor.close()


# 發送郵件的函數
def send_email(file_path, recipient_email, mail_content, file_name_first_part, form_type, file_name, mail_title):
    sender_email = "lida7239718@gmail.com"  # 發送人郵件地址
    sender_password = "tjzcodkjmftmvjeh"  # 發送人應用密碼
<<<<<<< HEAD
=======

    #sender_email = "kate1sync@gmail.com"
    #sender_password = "nyprqzhhdvjtmcyl"
>>>>>>> dev

    if "合併檔案" in file_name:
        second_subject = form_type
    else:
        parts = file_name.split('_')
        form_type = parts[1]
        second_subject = form_type

    try:
        # 設置郵件內容
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        # msg['Subject'] = f"{file_name_first_part}_{second_subject}"
        msg['Subject'] = mail_title

        body = mail_content
        msg.attach(MIMEText(body, 'plain'))

        # 附加 PDF 文件
        with open(file_path, 'rb') as file:
            part = MIMEApplication(file.read(), Name=os.path.basename(file_path))
        part['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        msg.attach(part)

        # 發送郵件
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)

        logging.info(f"Email successfully sent to {recipient_email} with subject: {msg['Subject']}")

    except smtplib.SMTPException as e:
        logging.error(f"SMTP error occurred: {e}")
        raise

    except Exception as e:
        logging.error(f"An error occurred while sending the email: {e}")
        raise


def update_form_status(file_name):
    cursor = None
    try:
        cursor = get_db_connection()

        # 更新 formA
        cursor.execute("""
                    UPDATE formA 
                    SET form_status = 1, updated_time = NOW() 
                    WHERE send_mail_pdf_name = %s
                """, (file_name,))
        affected_formA = cursor.rowcount  # 可選：查看有幾筆被更新

        # 更新 quotation
        cursor.execute("""
                    UPDATE quotation 
                    SET form_status = 1, updated_time = NOW() 
                    WHERE send_mail_pdf_name = %s
                """, (file_name,))
        affected_quotation = cursor.rowcount  # 可選：查看有幾筆被更新

        # 更新 request_payment
        cursor.execute("""
                        UPDATE request_payment 
                        SET form_status = 1, updated_time = NOW() 
                        WHERE send_mail_pdf_name = %s
                    """, (file_name,))
        affected_request_payment = cursor.rowcount  # 可選：查看有幾筆被更新

        mysql.connection.commit()
        logging.info(
            f"Successfully updated form_status to 1 for file: {file_name} | "
            f"formA updated: {affected_formA}, quotation updated: {affected_quotation}, request_payment update: {affected_request_payment}"
        )

    except Exception as e:
        logging.error(f"Error updating database: {e}")
        raise

    finally:
        if cursor:
            cursor.close()


@app.route('/api/sendEmail', methods=['POST'])
def send_email_request():
    try:
        data = request.get_json()

        # 獲取前端傳來的收件人帳號資訊、 PDF 訊息與郵件內容
        recipient_email = data.get('recipient')
        pdf_info = data.get('pdfInfo')
        mail_content = data.get('mailContent')
        form_type = data.get('formType')
        mail_title = data.get('mailtitle')

        if not recipient_email or not pdf_info:
            logging.error("Missing recipient email or PDF information")
            return jsonify({"error": "缺少收件人或PDF文件信息"}), 400

        # 對每個 PDF 文件執行郵件發送
        for pdf in pdf_info:
            file_name = pdf['name']

            if "合併檔案" in file_name:
                file_path = f"{app_dir}/pdfs/merge"
            else:
                file_path = f"{app_dir}/pdfs"

            file_path_name = rf'{file_path}/{file_name}'
            # 取出_分割後的第一個字段:公司名稱
            file_name_first_part = file_name.split('_')[0]

            # 引用發送郵件函數
            try:
                logging.info("Attempting to send email for file: %s", file_name)
                send_email(file_path_name, recipient_email, mail_content, file_name_first_part, form_type, file_name, mail_title)
                logging.info("Email sent successfully for file: %s", file_name)
            except Exception as e:
                logging.error("Error sending email for file %s: %s", file_name, e)
                return jsonify({"error": f"郵件發送失敗: {file_name}"}), 500

            # 郵件發送成功後，更改資料表狀態
            try:
                logging.info("Updating database for file: %s", file_name)
                update_form_status(file_name)
                logging.info("Database updated successfully for file: %s", file_name)
            except Exception as e:
                logging.error("Error updating database for file %s: %s", file_name, e)
                return jsonify({"error": f"資料庫更新失败: {file_name}"}), 500

            logging.info("All emails sent and database updated successfully.")
            return jsonify({"message": "郵件發送成功"}), 200

    except Exception as e:
        logging.error("Error processing email request: %s", e)
        return jsonify({"error": "郵件發送失敗"}), 500


@app.route('/api/historyData', methods=['GET'])
def history_data():
    cursor = None
    user = None
    try:
        user = request.args.get('user')  # 獲取前端傳遞來的帳戶資訊
        if not user:  # 如果 user 没有传递，返回错误信息
            return jsonify({'success': False, 'message': 'User parameter is required'}), 400

        cursor = get_db_connection()

        # 查詢用户的角色
        role_query = "SELECT role FROM users_info WHERE username = %s"
        cursor.execute(role_query, (user,))
        user_role = cursor.fetchone()

        # 如果查詢不到用戶的角色，回傳錯誤訊息
        if user_role is None:
            logging.warning(f"User {user} not found in users_info.")
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # 根據用戶的角色設置不同的查詢條件
        if user_role[0] == 'admin':
            query = """
                        SELECT * FROM (
                            SELECT form_id, pdf_name, form_status, user_name, '憑證統計表' AS form_type, updated_time, department
                            FROM formA
                            WHERE form_status = 1
                            UNION ALL
                            SELECT quotation_id AS form_id, pdf_name, form_status, user_name, '報價單' AS form_type, updated_time, department
                            FROM quotation
                            WHERE form_status = 1
                            UNION ALL
                            SELECT request_payment_id AS form_id, pdf_name, form_status, user_name, '請款單' AS form_type, updated_time, department
                            FROM request_payment
                            WHERE form_status = 1
                        ) AS combined_forms
                        ORDER BY updated_time DESC
                    """
            cursor.execute(query)
        else:
            query = """
                        SELECT * FROM (
                            SELECT form_id, pdf_name, form_status, user_name, '憑證統計表' AS form_type, updated_time, department
                            FROM formA
                            WHERE form_status = 1 AND user_name = %s
                            UNION ALL
                            SELECT quotation_id AS form_id, pdf_name, form_status, user_name, '報價單' AS form_type, updated_time, department
                            FROM quotation
                            WHERE form_status = 1 AND user_name = %s
                            UNION ALL
                            SELECT request_payment_id AS form_id, pdf_name, form_status, user_name, '請款單' AS form_type, updated_time, department
                            FROM request_payment
                            WHERE form_status = 1 AND user_name = %s
                        ) AS combined_forms
                        ORDER BY updated_time DESC
                    """
            cursor.execute(query, (user, user, user))

        results = cursor.fetchall()

        # 構建回傳的 JSON 數據
        form_list = []
        for form in results:
            form_data = {
                "form_id": form[0],
                "pdf_name": form[1],
                "form_status": form[2],
                "user_name": form[3],
                "form_type": form[4],
                "updated_time": form[5],
                "department": form[6],
            }
            form_list.append(form_data)

        return jsonify({'success': True, 'forms': form_list}), 200

    except Exception as e:
        logging.error(f"Error occurred while retrieving history data for user {user}: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/recipientSuggest', methods=['GET'])
def recipient_suggest():
    cursor = None
    try:
        recipient = request.args.get('recipient', '')
        if not recipient:
            return jsonify([])

        cursor = get_db_connection()
        # 查詢用户的角色
        suggest_query = "SELECT id, email FROM recipient_account WHERE email LIKE %s"
        cursor.execute(suggest_query, ('%' + recipient + '%',))
        results = cursor.fetchall()

        # 將結果轉換為字典格式，以便前端能夠輕鬆處理
        suggestions = [{'id': row[0], 'email': row[1]} for row in results]

        logging.info(f"Found {len(suggestions)} results for recipient: {recipient}")
        return jsonify(suggestions)

    except Exception as e:
        logging.error(f"Error while querying database: {e}")
        return jsonify({"error": "An error occurred while processing your request"}), 500
    finally:
        if cursor:
            cursor.close()


# 檢查郵件是否已經存在，並插入新郵件
@app.route('/api/checkInsert', methods=['POST'])
def check_insert_email():
    cursor = None
    try:
        data = request.get_json()  # 解析 JSON 請求
        email = data.get('recipient')  # .strip() # 移除郵件地址兩端的空格

        if not email:
            return jsonify({"error": "Email is required"}), 400

        cursor = get_db_connection()

        # 查詢郵件是否已經存在
        cursor.execute("SELECT COUNT(*) AS count FROM recipient_account WHERE email = %s", (email,))
        result = cursor.fetchone()

        if result[0] > 0:
            # 如果郵件已存在，返回 exists: true
            return jsonify({"exists": True})
        else:
            # 如果郵件不存在，插入新郵件
            cursor.execute("INSERT INTO recipient_account (email) VALUES (%s)", (email,))
            cursor.connection.commit()  # 提交事務
            return jsonify({"exists": False})

    except Exception as e:
        logging.error(f"Error while processing request: {e}")
        return jsonify({"error": "An error occurred while processing your request"}), 500
    finally:
        if cursor:
            cursor.close()


# 提供 React 靜態文件
@app.route('/')
def index():
    return send_from_directory(os.path.join(app.static_folder), 'index.html')


@app.route('/api/getChart', methods=['GET'])
def get_chart():
    cursor = None
    try:
        cursor = get_db_connection()

        # 當日服務人員數量查詢
        cursor.execute("""
                    SELECT user_name, COUNT(*) AS count 
                    FROM formA 
                    WHERE DATE(updated_time) = CURDATE() 
                    AND form_status = 1 
                    GROUP BY user_name
        """)
        result_today = cursor.fetchall()

        logging.info(f"Fetched {len(result_today)} rows from database.")
        if not result_today:
            logging.info("No data found in the database.")

        # 當年當月服務人員數量查詢
        cursor.execute("""
                SELECT user_name, COUNT(*) AS count 
                FROM formA 
                WHERE YEAR(updated_time) = YEAR(CURDATE()) 
                AND MONTH(updated_time) = MONTH(CURDATE())
                AND DATE(updated_time) < CURDATE()  -- 排除今天的資料
                AND form_status = 1 
                GROUP BY user_name
        """)
        result_month = cursor.fetchall()

        logging.info(f"Fetched {len(result_month)} rows for this month from database.")
        if not result_month:
            logging.info("No data found for this month.")

        # 生成空白圖表函數
        def generate_empty_chart():
            fig, ax = plt.subplots(figsize=(8, 6))
            ax.set_facecolor('white')  # 設定背景為白色
            ax.text(0.5, 0.5, '尚未有圖表數據', horizontalalignment='center', verticalalignment='center',
                    fontsize=36, color='grey')
            ax.axis('off')  # 不顯示軸
            img = io.BytesIO()
            plt.savefig(img, format='png')
            img.seek(0)
            return base64.b64encode(img.getvalue()).decode('utf-8')

        # 2. 準備數據進行圖表繪製
        # 如果沒有資料，則使用空的數據列表
        users_today_sorted, counts_today_sorted = [], []
        users_month_sorted, counts_month_sorted = [], []

        if result_today:
            users_today = [row[0] for row in result_today]
            counts_today = [row[1] for row in result_today]

            # 依據 user_name 進行排序
            sorted_today = sorted(zip(users_today, counts_today), key=lambda x: x[0])
            users_today_sorted, counts_today_sorted = zip(*sorted_today)

        if result_month:
            users_month = [row[0] for row in result_month]
            counts_month = [row[1] for row in result_month]

            # 依據 user_name 進行排序
            sorted_month = sorted(zip(users_month, counts_month), key=lambda x: x[0])
            users_month_sorted, counts_month_sorted = zip(*sorted_month)

        # 3. 使用 Matplotlib 繪製圖表
        # 當日長條圖
        plt.figure(figsize=(8, 6))
        if users_today_sorted:
            bars = plt.bar(users_today_sorted, counts_today_sorted, color='#E2D2D2')
            # 為每個條形加上資料標籤
            for bar in bars:
                yval = bar.get_height()  # 獲取每個條形的高度，也就是數量
                plt.text(bar.get_x() + bar.get_width() / 2, yval, str(int(yval)),
                         ha='center', va='bottom', fontsize=16)  # 在條形上方顯示數量
        # plt.xlabel('User')
        # plt.ylabel('次數', fontproperties=font_prop)
        # plt.title('當日服務人員成功寄信數量', fontproperties=font_prop, fontsize=20)
        plt.xticks(rotation=45, fontsize=16)  # 設定 X 軸刻度字體大小為 12，並且旋轉 45 度
        plt.yticks(fontsize=16)  # Y 軸刻度字體大小

        # 設定 y 軸顯示為整數刻度
        plt.gca().yaxis.set_major_locator(MaxNLocator(integer=True))
        img_today_base64 = generate_empty_chart() if not users_today_sorted else plt_to_base64()
        # plt.close()

        # 當年當月長條圖
        plt.figure(figsize=(8, 6))
        if users_month_sorted:
            bars = plt.bar(users_month_sorted, counts_month_sorted, color='#A2B59F')
            # 為每個條形加上資料標籤
            for bar in bars:
                yval = bar.get_height()  # 獲取每個條形的高度，也就是數量
                plt.text(bar.get_x() + bar.get_width() / 2, yval, str(int(yval)),
                         ha='center', va='bottom', fontsize=16)  # 在條形上方顯示數量
        # plt.xlabel('User')
        # plt.ylabel('Count')
        # plt.title(f'{current_month}月服務人員成功寄信數量', fontproperties=font_prop, fontsize=20)
        plt.xticks(rotation=45, fontsize=16)
        plt.yticks(fontsize=16)
        plt.gca().yaxis.set_major_locator(MaxNLocator(integer=True))
        img_month_base64 = generate_empty_chart() if not users_month_sorted else plt_to_base64()
        # plt.close()

        n = 10
        colors = ['#E9E1D4', '#F5DDAD', '#F1BCAE', '#C9DECF', '#CFDD8E', '#FEF5D4',
                  '#C9CBE0', '#A3B6C5', '#EACACB', '#D5E1DF','#E9E1D4', '#F5DDAD', '#F1BCAE']

        # C7D6DB
        # 用戶顏色對應字典，根據 user 數量為每個 user 配置顏色
        def create_user_color_mapping(users, colors):
            color_map = {}
            num_colors = len(colors)

            # 遍歷所有 user 並為其分配顏色
            for idx, user in enumerate(users):
                color_map[user] = colors[idx % num_colors]

            return color_map

        # 為當日和當月的用戶分配顏色
        # all_users = list(set(users_today_sorted + users_month_sorted))  # 確保包含所有唯一的用戶
        all_users = ['ld1', 'ld2', 'ld3', 'ld4', 'ld5', 'ld6', 'ld7', 'ld8', 'lda1', 'lda2', 'ld9', 'ld10', 'zu1']
        user_color_mapping = create_user_color_mapping(all_users, colors)

        # 當日圓餅圖
        fig, ax = plt.subplots(figsize=(8, 6))  # 設定畫布大小
        if counts_today_sorted:
            total_count = sum(counts_today_sorted)  # 當日總數
            percentages_today = [count / total_count * 100 for count in counts_today_sorted]

            # 按數量排序圓餅圖的數據，從大到小
            sorted_today = sorted(zip(counts_today_sorted, users_today_sorted, percentages_today),
                                  key=lambda x: (x[2], -ord(x[1][2])))  # 先按比例排序，比例相同時按帳號排序
            counts_today_sorted, users_today_sorted, percentages_today_sorted = zip(*sorted_today)

            # 根據 user 顏色映射來獲取顏色
            colors_today = [user_color_mapping[user] for user in users_today_sorted]

            # 畫圓餅圖
            ax.pie(percentages_today_sorted,
                   labels=users_today_sorted,
                   autopct='%1.1f%%',
                   startangle=90,  # 圓餅圖從上方開始
                   colors=colors_today,
                   pctdistance=0.75,
                   radius=1.2,
                   textprops={'fontsize': 16})

        # 設定圓餅圖的標題
        img_pie_today_base64 = generate_empty_chart() if not counts_today_sorted else plt_to_base64()

        # 當年當月圓餅圖
        fig, ax = plt.subplots(figsize=(8, 6))
        if counts_month_sorted:
            # 畫圓餅圖 - 同年同月每個員工數量佔總數的百分比
            total_count_month = sum(counts_month_sorted)  # 同年同月的總數
            percentages_month = [count / total_count_month * 100 for count in counts_month_sorted]

            # 按數量排序圓餅圖的數據，從大到小
            sorted_month = sorted(zip(counts_month_sorted, users_month_sorted, percentages_month),
                                  key=lambda x: (x[2], -ord(x[1][2])))  # 先按比例排序，比例相同時按帳號排序
            counts_month_sorted, users_month_sorted, percentages_month_sorted = zip(*sorted_month)

            # 根據 user 顏色映射來獲取顏色
            colors_month = [user_color_mapping[user] for user in users_month_sorted]

            ax.pie(percentages_month_sorted,
                   labels=users_month_sorted,
                   autopct='%1.1f%%',
                   startangle=90,
                   colors=colors_month,  # 顏色對應
                   pctdistance=0.85,  # 這個參數控制百分比數字的距離，數字越小，圓餅圖會越大
                   radius=1.2,  # 這個參數控制圓餅圖的半徑，數字越大，圓餅圖越大
                   textprops={'fontsize': 14})

        # 保存當年當月圓餅圖
        img_pie_month_base64 = generate_empty_chart() if not counts_month_sorted else plt_to_base64()
        # plt.close()

        # 4. 回傳四個圖表的 base64 編碼
        return jsonify({
            'chart_today': img_today_base64,
            'chart_month': img_month_base64,
            'chart_pie_today': img_pie_today_base64,  # 返回圓餅圖的Base64編碼
            'chart_pie_month': img_pie_month_base64  # 返回圓餅圖的Base64編碼
        })

    except Exception as e:
        logging.error(f"Error occurred: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()


# 將 plt 圖表轉換為 base64 編碼
def plt_to_base64():
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    return base64.b64encode(img.getvalue()).decode('utf-8')


@app.route('/api/submitServiceItem', methods=['POST'])
def submit_service_item():
    cursor = None
    try:
        data = request.get_json()
        items = data.get('items', [])

        if not items:
            return jsonify({'success': False, 'message': '沒有任何資料要儲存'}), 400

        cursor = get_db_connection()

        # 先清空資料表
        truncate_query = "TRUNCATE TABLE service_items"
        cursor.execute(truncate_query)

        insert_query = """
            INSERT INTO service_items (title, subtitle, fee, note, user_name, updated_time, department)
            VALUES (%s, %s, %s, %s, %s, NOW(), %s)
        """

        for item in items:
            cursor.execute(insert_query, (
                item.get('title'),
                item.get('subtitle'),
                item.get('fee', 0),
                item.get('note'),
                item.get('user_name'),
                item.get('department')
            ))

        cursor.connection.commit()

        return jsonify({'success': True, 'message': '所有項目已成功儲存'}), 200

    except Exception as e:
        logging.error(f"儲存服務項目失敗: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/getServiceItems', methods=['GET'])
def get_service_items():
    cursor = None
    try:
        cursor = get_db_connection()
        query = "SELECT title, subtitle, fee, note, department FROM service_items ORDER BY updated_time DESC"
        cursor.execute(query)
        rows = cursor.fetchall()

        # 回傳 JSON 陣列
        service_items_list = [{
            'title': row[0],
            'subtitle': row[1],
            'fee': row[2],
            'note': row[3],
            'department': row[4]
        } for row in rows]


        return jsonify({'success': True, 'service_items': service_items_list})
    except Exception as e:
        logging.error(f"取得服務項目失敗: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/getServiceItemsDetails', methods=['GET'])
def get_service_items_details():
    cursor = None
    try:
        cursor = get_db_connection()
        query = "SELECT title, subtitle, fee, note, department FROM service_items WHERE department like '資越%' AND title like '代辦%' ORDER BY updated_time DESC"
        cursor.execute(query)
        rows = cursor.fetchall()

        # 回傳 JSON 陣列
        service_items_list = [{
            'title': row[0],
            'subtitle': row[1],
            'fee': row[2],
            'note': row[3],
            'department': row[4]
        } for row in rows]

        return jsonify({'success': True, 'service_items': service_items_list})
    except Exception as e:
        logging.error(f"取得服務項目失敗: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/getServiceItemsDetailsLd', methods=['GET'])
def get_service_items_details_ld():
    cursor = None
    try:
        cursor = get_db_connection()
        query = "SELECT title, subtitle, fee, note, department FROM service_items WHERE department like '力達%' AND title like '代辦%' ORDER BY updated_time DESC"
        cursor.execute(query)
        rows = cursor.fetchall()

        # 回傳 JSON 陣列
        service_items_list = [{
            'title': row[0],
            'subtitle': row[1],
            'fee': row[2],
            'note': row[3],
            'department': row[4]
        } for row in rows]

        return jsonify({'success': True, 'service_items': service_items_list})
    except Exception as e:
        logging.error(f"取得服務項目失敗: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/getServiceItemsFees', methods=['GET'])
def get_service_items_fees():
    cursor = None
    try:
        cursor = get_db_connection()
        query = "SELECT title, subtitle, fee, note, department FROM service_items WHERE department like '資越%' AND title like '代墊%' ORDER BY updated_time DESC"
        cursor.execute(query)
        rows = cursor.fetchall()

        # 回傳 JSON 陣列
        service_items_list = [{
            'title': row[0],
            'subtitle': row[1],
            'fee': row[2],
            'note': row[3],
            'department': row[4]
        } for row in rows]

        return jsonify({'success': True, 'service_items': service_items_list})
    except Exception as e:
        logging.error(f"取得服務項目失敗: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/getServiceItemsFeesLd', methods=['GET'])
def get_service_items_fees_ld():
    cursor = None
    try:
        cursor = get_db_connection()
        query = "SELECT title, subtitle, fee, note, department FROM service_items WHERE department like '力達%' AND title like '代墊%' ORDER BY updated_time DESC"
        cursor.execute(query)
        rows = cursor.fetchall()

        # 回傳 JSON 陣列
        service_items_list = [{
            'title': row[0],
            'subtitle': row[1],
            'fee': row[2],
            'note': row[3],
            'department': row[4]
        } for row in rows]

        return jsonify({'success': True, 'service_items': service_items_list})
    except Exception as e:
        logging.error(f"取得服務項目失敗: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/generateQuotationNumber', methods=['POST'])
def generate_quotation_number():
    data = request.get_json()
    component_name = data.get('componentName', 'Unknown')


    try:
        today = datetime.today()
        date_str = today.strftime('%Y%m%d')  # 改為 4 位數年份

        if component_name == 'QuotationLd':
            prefix = 'L'
        else:
            prefix = 'A'

        # 查詢當天所有報價單編號，獲取最大編號
        cursor = get_db_connection()
        cursor.execute("""
            SELECT quotation_id
            FROM quotation
            WHERE quotation_id LIKE %s
            ORDER BY quotation_id DESC
            LIMIT 1
        """, (f"{date_str}{prefix}%",))

        last_quotation = cursor.fetchone()

        if last_quotation:
            last_number = int(last_quotation[0][-3:])
            new_number = f"{date_str}{prefix}{last_number + 1:03d}"
        else:
            new_number = f"{date_str}{prefix}001"

        return jsonify({
            'success': True,
            'quotationNumber': new_number
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })


@app.route('/api/saveQuotation', methods=['POST'])
def save_quotation():
    cursor = None
    try:
        data = request.get_json()
        quotation = data.get('quotation')
        items = data.get('items', [])
        componentName = data.get('componentName')

        if not quotation:
            return jsonify({'success': False, 'message': '缺少主表數據'}), 400

        quotation_id = quotation.get('quotation_id')
        quotation_date = quotation.get('quotation_date')
        contact_email = quotation.get('contact_email')
        contact_phone = quotation.get('contact_phone')
        contact_fax = quotation.get('contact_fax')
        contact_person = quotation.get('contact_person')
        company_name = quotation.get('company_name')
        company_contact_person = quotation.get('company_contact_person')
        subtotal_amount = float(quotation.get('subtotal_amount', 0))
        tax_amount = float(quotation.get('tax_amount', 0))
        total_amount = float(quotation.get('total_amount', 0))
        user_name = quotation.get('user_name')
        department = '力達' if 'L' in quotation_id else '資越'

        formatted_subtotal_amount = f"({abs(subtotal_amount):,.0f})" if subtotal_amount < 0 else f"{subtotal_amount:,.0f}"
        formatted_tax_amount = f"({abs(tax_amount):,.0f})" if tax_amount < 0 else f"{tax_amount:,.0f}"
        formatted_total_amount = f"({abs(total_amount):,.0f})" if total_amount < 0 else f"{total_amount:,.0f}"

        cursor = get_db_connection()

        # 先刪除舊的細項數據
        delete_query = "DELETE FROM quotation WHERE quotation_id = %s"
        cursor.execute(delete_query, (quotation_id,))

        # 插入主表數據
        insert_quotation_query = """
            INSERT INTO quotation (
                quotation_id, quotation_date, contact_email, contact_phone, contact_fax,
                contact_person, company_name, company_contact_person,
                subtotal_amount, tax_amount, total_amount, user_name, department
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                quotation_date = VALUES(quotation_date),
                contact_email = VALUES(contact_email),
                contact_phone = VALUES(contact_phone),
                contact_fax = VALUES(contact_fax),
                contact_person = VALUES(contact_person),
                company_name = VALUES(company_name),
                company_contact_person = VALUES(company_contact_person),
                subtotal_amount = VALUES(subtotal_amount),
                tax_amount = VALUES(tax_amount),
                total_amount = VALUES(total_amount),
                user_name = VALUES(user_name),
                updated_time = NOW(),
                department = VALUES(department)
        """
        cursor.execute(insert_quotation_query, (
            quotation_id,
            quotation_date,
            contact_email,
            contact_phone,
            contact_fax,
            contact_person,
            company_name,
            company_contact_person,
            subtotal_amount,
            tax_amount,
            total_amount,
            user_name,
            department,
        ))

        # 插入新的細項數據
        if items:
            insert_item_query = """
                INSERT INTO quotation_item (
                    quotation_id, subtitle_no, subtitle, fee, note, user_name
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """
            for item in items:
                item_quotation_id = item.get('quotation_id')
                subtitle_no = item.get('subtitle_no')
                subtitle = item.get('subtitle')
                fee = float(item.get('fee', 0))
                note = item.get('note')
                item_user_name = item.get('user_name')

                formatted_fee = f"({abs(fee):,.0f})" if fee < 0 else f"{fee:,.0f}"
                item['formatted_fee'] = formatted_fee
                item['fee'] = fee

                cursor.execute(insert_item_query, (
                    item_quotation_id,
                    subtitle_no,
                    subtitle,
                    fee,
                    note,
                    item_user_name
                ))

        cursor.connection.commit()

        template_name = 'quotation_template_Ld.html' if componentName == 'QuotationLd' else 'quotation_template.html'
        html_content = render_template(template_name, app_dir=app_dir,
                                       quotation_id=quotation_id, quotation_date=quotation_date, contact_email=contact_email,
                                       contact_phone=contact_phone, contact_fax=contact_fax, contact_person=contact_person,
                                       company_name=company_name, company_contact_person=company_contact_person, formatted_subtotal_amount=formatted_subtotal_amount,
                                       formatted_tax_amount=formatted_tax_amount, formatted_total_amount=formatted_total_amount, user_name=user_name, items=items)

        # 生成 PDF 文件名
        pdf_filename = f"{company_name}_報價單_{quotation_id}.pdf"

        # encoded_pdf_filename = urllib.parse.quote(pdf_filename)
        # 如果文件名包含 "啓勝美術社" 或 "慶峯榮金屬企業社" 或 "一块田創意工作室" 才進行 URL 編碼，否則保持原文件名
        if any(keyword in pdf_filename for keyword in ["啓勝美術社", "慶峯榮金屬企業社", "一块田創意工作室"]):
            encoded_pdf_filename = urllib.parse.quote(pdf_filename)
        else:
            encoded_pdf_filename = pdf_filename

        # 確保 'pdfs' 目錄存在，若不存在則創建
        pdf_folder = os.path.join(os.getcwd(), 'pdfs')  # 當前目錄下的 pdfs 資料夾
        os.makedirs(pdf_folder, exist_ok=True)  # 如果資料夾不存在則創建

        # 使用 pdfkit 生成 PDF
        pdf_path = os.path.join(pdf_folder, encoded_pdf_filename)

        options = {
            'encoding': 'UTF-8',  # 可以解決中文亂碼問題
            'no-outline': None,  # 禁用文檔輪廓
            'quiet': None,  # 禁用日志
            'margin-top': '5mm' if componentName == 'QuotationLd' else '10mm',
            'margin-right': '8mm',
            # 'margin-bottom': '0mm',
            'margin-left': '8mm',
        }
        # 將 HTML 文件轉換為 PDF
        #pdfkit.from_string(html_content, pdf_path, options=options)
        try:
            pdfkit.from_string(html_content, pdf_path, options=options)
        except Exception as pdf_error:
            logging.error(f"PDF 生成失敗: {str(pdf_error)}")
            return jsonify({'success': False, 'message': f'PDF 生成失敗: {str(pdf_error)}'}), 500

        rename_rules = {
            "%E6%86%91%E8%AD%89%E7%B5%B1%E8%A8%88%E8%A1%A8": "憑證統計表",
            "%E5%95%93%E5%8B%9D%E7%BE%8E%E8%A1%93%E7%A4%BE": "啓勝美術社",
            "%E6%85%B6%E5%B3%AF%E6%A6%AE%E9%87%91%E5%B1%AC%E4%BC%81%E6%A5%AD%E7%A4%BE": "慶峯榮金屬企業社",
            "%E4%B8%80%E5%9D%97%E7%94%B0%E5%89%B5%E6%84%8F%E5%B7%A5%E4%BD%9C%E5%AE%A4": "一块田創意工作室",
            "%E5%A0%B1%E5%83%B9%E5%96%AE": "報價單"
        }
        # 檢查文件名是否需要更改
        new_filename = encoded_pdf_filename
        for old_str, new_str in rename_rules.items():
            if old_str in new_filename:
                new_filename = new_filename.replace(old_str, new_str)

        # 如果文件名有變化，則進行重新命名
        if new_filename != encoded_pdf_filename:
            old_filepath = os.path.join(pdf_folder, encoded_pdf_filename)
            new_filepath = os.path.join(pdf_folder, new_filename)

            # 執行重新命名
            os.rename(old_filepath, new_filepath)

        # # 更新資料庫中的pdf_name欄位
        update_query = """
                            UPDATE quotation
                            SET pdf_name = %s
                            WHERE quotation_id = %s
                        """
        cursor.execute(update_query, (pdf_filename, quotation_id))
        mysql.connection.commit()
        logging.info(f"PDF generated successfully for quotation_id: {quotation_id}. PDF path: {pdf_path}")

        # 返回 PDF 文件
        new_filepath = os.path.join(pdf_folder, new_filename)
        return send_file(new_filepath, as_attachment=True, download_name=new_filename, mimetype='application/pdf')

        #return jsonify({'success': True, 'message': '報價單已成功儲存'}), 200

    except Exception as e:
        logging.error(f"儲存報價單失敗: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        if cursor:
            cursor.close()


@app.route('/api/getQuotation', methods=['GET'])
def get_quotation():
    quotation_id = request.args.get('quotationId')
    if not quotation_id:
        return jsonify({'success': False, 'message': '請提供報價單編號'}), 400


    cursor = None
    try:
        cursor = get_db_connection()

        # 查詢主表資訊
        cursor.execute("""
            SELECT quotation_id, quotation_date, contact_email, contact_phone, 
                   contact_fax, contact_person, company_name, company_contact_person,
                   subtotal_amount, tax_amount, total_amount, user_name, updated_time
            FROM quotation 
            WHERE quotation_id = %s
        """, (quotation_id,))
        quotation_data = cursor.fetchone()

        if not quotation_data:
            return jsonify({'success': False, 'message': '找不到指定的報價單'}), 404

        # 查詢項目明細
        cursor.execute("""
            SELECT subtitle_no, subtitle, fee, note, user_name, updated_time
            FROM quotation_item 
            WHERE quotation_id = %s
            ORDER BY subtitle_no
        """, (quotation_id,))
        items_data = cursor.fetchall()

        # 格式化回傳資料
        quotation = {
            'quotation_id': quotation_data[0],
            'quotation_date': quotation_data[1].strftime('%Y/%m/%d') if quotation_data[1] else '',
            'contact_email': quotation_data[2],
            'contact_phone': quotation_data[3],
            'contact_fax': quotation_data[4],
            'contact_person': quotation_data[5],
            'company_name': quotation_data[6],
            'company_contact_person': quotation_data[7],
            'subtotal_amount': float(quotation_data[8]) if quotation_data[8] else 0,
            'tax_amount': float(quotation_data[9]) if quotation_data[9] else 0,
            'total_amount': float(quotation_data[10]) if quotation_data[10] else 0,
            'user_name': quotation_data[11],
            'updated_time': quotation_data[12].strftime('%Y-%m-%d %H:%M:%S') if quotation_data[12] else ''
        }

        items = [{
            'subtitle_no': item[0],
            'subtitle': item[1],
            'fee': item[2],
            'note': item[3],
            'user_name': item[4],
            'updated_time': item[5].strftime('%Y-%m-%d %H:%M:%S') if item[5] else ''
        } for item in items_data]

        return jsonify({
            'success': True,
            'quotation': quotation,
            'items': items
        })

    except Exception as e:
        logging.error(f"查詢報價單失敗: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/generateRequestPaymentNumber', methods=['POST'])
def generate_request_payment_number():
    try:
        today = datetime.today()
        date_str = today.strftime('%Y%m%d')  # 改為 4 位數年份

        # 查詢當天所有報價單編號，獲取最大編號
        cursor = get_db_connection()
        cursor.execute("""
            SELECT request_payment_id
            FROM request_payment
            WHERE request_payment_id LIKE %s
            ORDER BY request_payment_id DESC
            LIMIT 1
        """, (f"{date_str}B%",))

        last_quotation = cursor.fetchone()

        if last_quotation:
            last_number = int(last_quotation[0][-3:])
            new_number = f"{date_str}B{last_number + 1:03d}"
        else:
            new_number = f"{date_str}B001"

        return jsonify({
            'success': True,
            'requestPaymentNumber': new_number
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/saveRequestPayment', methods=['POST'])
def save_request_payment():
    cursor = None
    try:
        data = request.get_json()
        request_payment = data.get('requestPayment')
        items1 = data.get('items1', [])
        items2 = data.get('items2', [])

        if not request_payment:
            return jsonify({'success': False, 'message': '缺少主表數據'}), 400

        request_payment_id = request_payment.get('request_payment_id')
        request_payment_date = request_payment.get('request_payment_date')
        quotation_id = request_payment.get('quotation_id')
        contact_email = request_payment.get('contact_email')
        contact_phone = request_payment.get('contact_phone')
        contact_fax = request_payment.get('contact_fax')
        contact_person = request_payment.get('contact_person')
        company_name = request_payment.get('company_name')
        company_contact_person = request_payment.get('company_contact_person')
        details_subtotal_amount = float(request_payment.get('details_subtotal_amount', 0))
        details_tax_amount = float(request_payment.get('details_tax_amount', 0))
        details_total_amount = float(request_payment.get('details_total_amount', 0))
        fees_total_amount = float(request_payment.get('fees_total_amount', 0))
        final_total_amount = float(request_payment.get('final_total_amount', 0))
        user_name = request_payment.get('user_name')
        department = '力達' if 'L' in quotation_id else '資越'

        # 格式化金額
        formatted_details_subtotal = f"{details_subtotal_amount:,.0f}"
        formatted_details_tax = f"{details_tax_amount:,.0f}"
        formatted_details_total = f"{details_total_amount:,.0f}"
        formatted_fees_total = f"{fees_total_amount:,.0f}"
        formatted_final_total = f"{final_total_amount:,.0f}"

        cursor = get_db_connection()

        # 先刪除舊的細項數據
        delete_query1 = "DELETE FROM request_payment_item1 WHERE request_payment_id = %s"
        delete_query2 = "DELETE FROM request_payment_item2 WHERE request_payment_id = %s"
        cursor.execute(delete_query1, (request_payment.get('request_payment_id'),))
        cursor.execute(delete_query2, (request_payment.get('request_payment_id'),))

        # 插入主表數據
        insert_request_payment_query = """
            INSERT INTO request_payment (
                request_payment_id, request_payment_date, quotation_id, contact_email,
                contact_phone, contact_fax, contact_person, company_name,
                company_contact_person, details_subtotal_amount, details_tax_amount,
                details_total_amount, fees_total_amount, final_total_amount, user_name, department
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                request_payment_date = VALUES(request_payment_date),
                quotation_id = VALUES(quotation_id),
                contact_email = VALUES(contact_email),
                contact_phone = VALUES(contact_phone),
                contact_fax = VALUES(contact_fax),
                contact_person = VALUES(contact_person),
                company_name = VALUES(company_name),
                company_contact_person = VALUES(company_contact_person),
                details_subtotal_amount = VALUES(details_subtotal_amount),
                details_tax_amount = VALUES(details_tax_amount),
                details_total_amount = VALUES(details_total_amount),
                fees_total_amount = VALUES(fees_total_amount),
                final_total_amount = VALUES(final_total_amount),
                user_name = VALUES(user_name),
                updated_time = NOW(),
                department = VALUES(department)
        """
        cursor.execute(insert_request_payment_query, (
            request_payment_id,
            request_payment_date,
            quotation_id,
            contact_email,
            contact_phone,
            contact_fax,
            contact_person,
            company_name,
            company_contact_person,
            details_subtotal_amount,
            details_tax_amount,
            details_total_amount,
            fees_total_amount,
            final_total_amount,
            user_name,
            department
        ))

        # 插入第一個表格的細項數據 (request_payment_item1)
        if items1:
            insert_item1_query = """
                INSERT INTO request_payment_item1 (
                    request_payment_id, subtitle_no, subtitle, fee, note, user_name
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """
            for item in items1:
                item_request_payment_id = item.get('request_payment_id')
                subtitle_no = item.get('subtitle_no')
                subtitle = item.get('subtitle')
                fee = float(item.get('fee', 0))
                note = item.get('note')
                item_user_name = item.get('user_name')

                formatted_fee = f"({abs(fee):,.0f})" if fee < 0 else f"{fee:,.0f}"
                item['formatted_fee'] = formatted_fee
                item['fee'] = fee

                cursor.execute(insert_item1_query, (
                    item_request_payment_id,
                    subtitle_no,
                    subtitle,
                    fee,
                    note,
                    item_user_name
                ))

        # 插入第二個表格的細項數據 (request_payment_item2)
        if items2:
            filtered_items2 = []    # 過濾掉 subtitle 為空的項目
            insert_item2_query = """
                INSERT INTO request_payment_item2 (
                    request_payment_id, subtitle_no, subtitle, fee, note, user_name
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """
            for item in items2:
                subtitle = item.get('subtitle')
                if not subtitle:
                    continue  # 如果 subtitle 為空白，不處理

                item_request_payment_id = item.get('request_payment_id')
                subtitle_no = item.get('subtitle_no')
                raw_fee = item.get('fee')
                note = item.get('note')
                item_user_name = item.get('user_name')

                # 嘗試轉成 float（若無法轉換，fee 設為 None）
                try:
                    fee = float(raw_fee)
                except (ValueError, TypeError):
                    fee = None

                # 格式化 fee（只有在 fee 是有效數字且大於 0 才格式化）
                if fee is not None and fee > 0:
                    formatted_fee = f"{fee:,.0f}"
                elif fee is not None and fee < 0:
                    formatted_fee = f"({abs(fee):,.0f})"
                else:
                    formatted_fee = ''

                item['formatted_fee'] = formatted_fee
                item['fee'] = fee
                filtered_items2.append(item)

                cursor.execute(insert_item2_query, (
                    item_request_payment_id,
                    subtitle_no,
                    subtitle,
                    raw_fee,
                    note,
                    item_user_name
                ))

        cursor.connection.commit()

        template_name = 'request_payment_template_Ld.html' if 'L' in quotation_id else 'request_payment_template.html'
        html_content = render_template(template_name,
                                       app_dir=app_dir,
                                       request_payment_id=request_payment_id,
                                       request_payment_date=request_payment_date,
                                       quotation_id=quotation_id,
                                       contact_email=contact_email,
                                       contact_phone=contact_phone,
                                       contact_fax=contact_fax,
                                       contact_person=contact_person,
                                       company_name=company_name,
                                       company_contact_person=company_contact_person,
                                       formatted_details_subtotal=formatted_details_subtotal,
                                       formatted_details_tax=formatted_details_tax,
                                       formatted_details_total=formatted_details_total,
                                       formatted_fees_total=formatted_fees_total,
                                       formatted_final_total=formatted_final_total,
                                       user_name=user_name,
                                       items1=items1,
                                       items2=filtered_items2,
                                       has_items2=bool(filtered_items2),
                                       )

        # 生成 PDF 文件名
        pdf_filename = f"{company_name}_請款單_{request_payment_id}.pdf"

        # encoded_pdf_filename = urllib.parse.quote(pdf_filename)
        # 如果文件名包含 "啓勝美術社" 或 "慶峯榮金屬企業社" 或 "一块田創意工作室" 才進行 URL 編碼，否則保持原文件名
        if any(keyword in pdf_filename for keyword in ["啓勝美術社", "慶峯榮金屬企業社", "一块田創意工作室"]):
            encoded_pdf_filename = urllib.parse.quote(pdf_filename)
        else:
            encoded_pdf_filename = pdf_filename

        # 確保 'pdfs' 目錄存在，若不存在則創建
        pdf_folder = os.path.join(os.getcwd(), 'pdfs')  # 當前目錄下的 pdfs 資料夾
        os.makedirs(pdf_folder, exist_ok=True)  # 如果資料夾不存在則創建

        # 使用 pdfkit 生成 PDF
        pdf_path = os.path.join(pdf_folder, encoded_pdf_filename)

        options = {
            'encoding': 'UTF-8',  # 可以解決中文亂碼問題
            'no-outline': None,  # 禁用文檔輪廓
            'quiet': None,  # 禁用日志
            'margin-top': '5mm' if 'L' in quotation_id else '10mm',
            'margin-right': '8mm',
            # 'margin-bottom': '0mm',
            'margin-left': '8mm',
        }
        # 將 HTML 文件轉換為 PDF
        # pdfkit.from_string(html_content, pdf_path, options=options)
        try:
            pdfkit.from_string(html_content, pdf_path, options=options)
        except Exception as pdf_error:
            logging.error(f"PDF 生成失敗: {str(pdf_error)}")
            return jsonify({'success': False, 'message': f'PDF 生成失敗: {str(pdf_error)}'}), 500

        rename_rules = {
            "%E6%86%91%E8%AD%89%E7%B5%B1%E8%A8%88%E8%A1%A8": "憑證統計表",
            "%E5%95%93%E5%8B%9D%E7%BE%8E%E8%A1%93%E7%A4%BE": "啓勝美術社",
            "%E6%85%B6%E5%B3%AF%E6%A6%AE%E9%87%91%E5%B1%AC%E4%BC%81%E6%A5%AD%E7%A4%BE": "慶峯榮金屬企業社",
            "%E4%B8%80%E5%9D%97%E7%94%B0%E5%89%B5%E6%84%8F%E5%B7%A5%E4%BD%9C%E5%AE%A4": "一块田創意工作室",
            "%E5%A0%B1%E5%83%B9%E5%96%AE": "報價單",
            "%E8%AB%8B%E6%AC%BE%E5%96%AE": "請款單"
        }
        # 檢查文件名是否需要更改
        new_filename = encoded_pdf_filename
        for old_str, new_str in rename_rules.items():
            if old_str in new_filename:
                new_filename = new_filename.replace(old_str, new_str)

        # 如果文件名有變化，則進行重新命名
        if new_filename != encoded_pdf_filename:
            old_filepath = os.path.join(pdf_folder, encoded_pdf_filename)
            new_filepath = os.path.join(pdf_folder, new_filename)

            # 執行重新命名
            os.rename(old_filepath, new_filepath)

        # # 更新資料庫中的pdf_name欄位
        update_query = """
                            UPDATE request_payment
                            SET pdf_name = %s
                            WHERE request_payment_id = %s
                        """
        cursor.execute(update_query, (pdf_filename, request_payment_id))
        mysql.connection.commit()
        logging.info(f"PDF generated successfully for request_payment_id: {request_payment_id}. PDF path: {pdf_path}")

        # 返回 PDF 文件
        new_filepath = os.path.join(pdf_folder, new_filename)
        return send_file(new_filepath, as_attachment=True, download_name=new_filename, mimetype='application/pdf')

    except Exception as e:
        logging.error(f"儲存請款單失敗: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        if cursor:
            cursor.close()


@app.route('/api/getAllQuotations', methods=['GET'])
def get_all_quotations():
    cursor = None
    user = None
    try:
        user = request.args.get('user')  # 獲取前端傳遞來的帳戶資訊
        if not user:  # 如果 user 没有传递，返回错误信息
            return jsonify({'success': False, 'message': 'User parameter is required'}), 400

        cursor = get_db_connection()

        # 查詢用户的角色
        role_query = "SELECT role FROM users_info WHERE username = %s"
        cursor.execute(role_query, (user,))
        user_role = cursor.fetchone()

        # 如果查詢不到用戶的角色，回傳錯誤訊息
        if user_role is None:
            logging.warning(f"User {user} not found in users_info.")
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # 根據用戶的角色設置不同的查詢條件
        if user_role[0] == 'admin':
            # 如果是admin，查詢所有報價單
            query = """
                SELECT quotation_id, quotation_date, contact_email, contact_phone, 
                       contact_fax, contact_person, company_name, company_contact_person,
                       subtotal_amount, tax_amount, total_amount, user_name, updated_time
                FROM quotation
                ORDER BY quotation_Date desc, quotation_id desc
            """
            cursor.execute(query)
        else:
            # 如果是一般使用者，查詢該使用者的報價單
            query = """
                SELECT quotation_id, quotation_date, contact_email, contact_phone, 
                       contact_fax, contact_person, company_name, company_contact_person,
                       subtotal_amount, tax_amount, total_amount, user_name, updated_time
                FROM quotation
                WHERE user_name = %s
                ORDER BY quotation_Date desc, quotation_id desc
            """
            cursor.execute(query, (user,))

        quotations_data = cursor.fetchall()

        quotations = []
        for quotation_data in quotations_data:
            # 查詢每個報價單的項目明細
            cursor.execute("""
                SELECT subtitle_no, subtitle, fee, note, user_name, updated_time
                FROM quotation_item 
                WHERE quotation_id = %s
                ORDER BY subtitle_no
            """, (quotation_data[0],))
            items_data = cursor.fetchall()

            items = [{
                'subtitle_no': item[0],
                'subtitle': item[1],
                'fee': item[2],
                'note': item[3],
                'user_name': item[4],
                'updated_time': item[5].strftime('%Y-%m-%d %H:%M:%S') if item[5] else ''
            } for item in items_data]

            # 將報價單資訊與項目明細組合
            quotations.append({
                'quotation_id': quotation_data[0],
                'quotation_date': quotation_data[1].strftime('%Y/%m/%d') if quotation_data[1] else '',
                'contact_email': quotation_data[2],
                'contact_phone': quotation_data[3],
                'contact_fax': quotation_data[4],
                'contact_person': quotation_data[5],
                'company_name': quotation_data[6],
                'company_contact_person': quotation_data[7],
                'subtotal_amount': float(quotation_data[8]) if quotation_data[8] else 0,
                'tax_amount': float(quotation_data[9]) if quotation_data[9] else 0,
                'total_amount': float(quotation_data[10]) if quotation_data[10] else 0,
                'user_name': quotation_data[11],
                'updated_time': quotation_data[12].strftime('%Y-%m-%d %H:%M:%S') if quotation_data[12] else '',
                'items': items
            })

        return jsonify({
            'success': True,
            'quotations': quotations
        })

    except Exception as e:
        logging.error(f"查詢所有報價單失敗: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


if __name__ == '__main__':
    logging.info("Starting the application")
    # app.run(debug=True)設置會讓 Flask 應用進入調試模式，有助於開發過程中的即時反饋。開發階段時，通常會啟用 debug 模式，部署到生產環境，應該禁用 debug 模式。
    # app.run(debug=False)
    app.run(host='0.0.0.0', port=5000, debug=False)