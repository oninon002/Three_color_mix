from flask import Flask, render_template, request, jsonify
import re
from functools import wraps

app = Flask(__name__)

# 预编译正则表达式
HEX_PATTERN = re.compile(r'^[A-F0-9]{6}$')
RGB_PATTERN = re.compile(r'^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$')

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

if __name__ == '__main__':
    app.run(debug=True)