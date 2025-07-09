from flask import Flask, render_template, request, jsonify
import re

app = Flask(__name__)

@app.route('/')
def index():
    print(">>> 你正在运行的 app.py 路径：", __file__)
    return render_template('index.html')

@app.route('/update-color', methods=['POST'])
def update_color():
    data = request.get_json()
    red = int(data.get('red', 100))
    green = int(data.get('green', 100))
    blue = int(data.get('blue', 100))
    
    # 计算HEX值
    def percent_to_hex(val):
        return format(round(val * 2.55), '02x').upper()
    
    hex_color = f"#{percent_to_hex(red)}{percent_to_hex(green)}{percent_to_hex(blue)}"
    
    return jsonify({
        'hex': hex_color,
        'rgb': f"({percent_to_hex(red)}, {percent_to_hex(green)}, {percent_to_hex(blue)})",
        'rgb_percent': f"({red}%, {green}%, {blue}%)",
        'color': hex_color
    })

@app.route('/hex-to-rgb', methods=['POST'])
def hex_to_rgb():
    data = request.get_json()
    hex_value = data.get('hex', '#FFFFFF').lstrip('#').upper()
    
    if not re.match(r'^[A-F0-9]{6}$', hex_value):
        return jsonify({'error': '格式错误，请输入6位十六进制颜色值'})
    
    try:
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
    except ValueError:
        return jsonify({'error': '转换错误，请检查输入值'})

if __name__ == '__main__':
    app.run(debug=True)