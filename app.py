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
    form_id = request.args.get('formId')  # 获取前端传递的客户编号
    if form_id:
        try:
            cursor = get_db_connection()  # 获取数据库连接
            cursor.execute("SELECT companyname FROM company_info WHERE companyid = %s", (form_id,))
            result = cursor.fetchone()  # 获取查询结果

            if result:
                companyname = result[0]  # 结果中公司名称是第一个字段
                return jsonify({'companyName': companyname})  # 返回公司名称
            else:
                return jsonify({'message': '找不到该客户编号的公司信息'}), 404
        except Exception as e:
            return jsonify({'message': str(e)}), 500
        finally:
            cursor.close()  # 关闭游标
    else:
        return jsonify({'message': '客户编号不能为空'}), 400

if __name__ == '__main__':
    app.run(debug=True)