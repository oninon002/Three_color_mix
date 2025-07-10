from flask import Flask, render_template, request, jsonify
import re
from functools import wraps
import os
from werkzeug.utils import secure_filename
import base64

app = Flask(__name__)

# 预编译正则表达式
HEX_PATTERN = re.compile(r'^[A-F0-9]{6}$')
RGB_PATTERN = re.compile(r'^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$')

UPLOAD_FOLDER = os.path.join('static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2MB
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_input(f):
    """输入验证装饰器"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except (ValueError, TypeError):
            return jsonify({'error': '无效的输入值'}), 400
    return wrapper

def percent_to_hex(val):
    """将百分比值(0-100)转换为十六进制(00-FF)"""
    return format(round(float(val) * 2.55), '02x').upper()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/update-color', methods=['POST'])
@validate_input
def update_color():
    data = request.get_json()
    
    # 验证并限制输入范围
    red = min(max(int(data.get('red', 100)), 0), 100)
    green = min(max(int(data.get('green', 100)), 0), 100)
    blue = min(max(int(data.get('blue', 100)), 0), 100)
    
    hex_color = f"#{percent_to_hex(red)}{percent_to_hex(green)}{percent_to_hex(blue)}"
    
    return jsonify({
        'hex': hex_color,
        'rgb': f"({percent_to_hex(red)}, {percent_to_hex(green)}, {percent_to_hex(blue)})",
        'rgb_percent': f"({red}%, {green}%, {blue}%)",
        'color': hex_color
    })

@app.route('/hex-to-rgb', methods=['POST'])
@validate_input
def hex_to_rgb():
    data = request.get_json()
    hex_value = data.get('hex', 'FFFFFF').lstrip('#').upper()
    
    if not HEX_PATTERN.match(hex_value):
        return jsonify({'error': '格式错误，请输入6位十六进制颜色值'}), 400
    
    r = int(hex_value[0:2], 16)
    g = int(hex_value[2:4], 16)
    b = int(hex_value[4:6], 16)
    
    red_percent = round(r / 2.55)
    green_percent = round(g / 2.55)
    blue_percent = round(b / 2.55)
    
    return jsonify({
        'rgb': f"({r}, {g}, {b})",
        'rgb_percent': f"({red_percent}%, {green_percent}%, {blue_percent}%)",
        'red': red_percent,
        'green': green_percent,
        'blue': blue_percent
    })

@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': '未检测到文件'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': '未选择文件'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': '仅支持图片文件'}), 400
    # 读取文件内容并转为base64
    img_bytes = file.read()
    img_b64 = base64.b64encode(img_bytes).decode('utf-8')
    mime = file.mimetype or 'image/png'
    data_url = f"data:{mime};base64,{img_b64}"
    return jsonify({'url': data_url})

if __name__ == '__main__':
    app.run(debug=True)