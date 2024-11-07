from flask import Flask, request, jsonify
from flask_mysqldb import MySQL
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# 配置 MySQL 数据库连接
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'  # 修改为您的数据库用户名
app.config['MYSQL_PASSWORD'] = '1qaz@WSX'  # 修改为您的数据库密码
app.config['MYSQL_DB'] = 'dw'  # 修改为您的数据库名

mysql = MySQL(app)

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
            cursor.close()  # 关闭游标
    else:
        return jsonify({'message': '客户编号不能为空'}), 400

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

# 新增一個處理 formData 提交的路由
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

    # 检查是否有必填项为空
    if not formId or not companyId or not year1 or not month1 or not revenue or not income:
        return jsonify({'success': False, 'message': '所有字段都是必填的'}), 400

    # 將數據寫入到 MySQL
    try:
        cursor = get_db_connection()

        query = """
            INSERT INTO formA(form_id,company_id,company_name,form_titleyear,form_titlemonth,revenue,cost
            ,expense,profit,nonrevenue,noncost,income,cost_percent,expense_percent,profit_percent
            ,nonrevenue_percent,noncost_percent,income_percent,ischecked,netincome,extracost,extraexpense
            ,note,staff,form_submityear,form_submitmonth,form_submitdate)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (formId,companyId,companyName,year1,month1,revenue,cost,expense,profit
                               ,nonrevenue,noncost,income,costPercent,expensePercent,profitPercent
                               ,nonrevenuePercent,noncostPercent,incomePercent,isChecked,netincome
                               ,extracost,extraexpense,note,selectedStaff,year,month,date))

        # 提交事务
        mysql.connection.commit()

        return jsonify({'success': True, 'message': '表單資料提交成功'}), 201

    except Exception as e:
        return jsonify({'success': False, 'message': f'提交失敗: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)