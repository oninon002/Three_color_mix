document.addEventListener('DOMContentLoaded', () => {
    // 初始化默认值
    let red = 100;
    let green = 100;
    let blue = 100;
    
    // 获取DOM元素
    const previewBox = document.getElementById('previewBox');
    const rgbPercent = document.getElementById('rgbPercent');
    const hexCode = document.getElementById('hexCode');
    const colorInfo = document.getElementById('colorInfo');
    
    const redSlider = document.getElementById('redSlider');
    const greenSlider = document.getElementById('greenSlider');
    const blueSlider = document.getElementById('blueSlider');
    
    const redValue = document.querySelector('.slider.red .slider-value');
    const greenValue = document.querySelector('.slider.green .slider-value');
    const blueValue = document.querySelector('.slider.blue .slider-value');
    
    const redLight = document.getElementById('redLight');
    const greenLight = document.getElementById('greenLight');
    const blueLight = document.getElementById('blueLight');
    
    const hexInput = document.getElementById('hexInput');
    const applyBtn = document.getElementById('applyBtn');
    const hexError = document.getElementById('hexError');
    
    const resetBtn = document.getElementById('resetBtn');
    const pickColorBtn = document.getElementById('pickColorBtn');
    
    const rgbInput = document.getElementById('rgbInput');
    const applyRgbBtn = document.getElementById('applyRgbBtn');
    const rgbError = document.getElementById('rgbError');

    const hexToRgbResult = document.getElementById('hexToRgbResult');

    // 更新颜色显示
    function updateColor() {
        fetch('/update-color', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                red: red,
                green: green,
                blue: blue
            })
        })
        .then(response => response.json())
        .then(data => {
            previewBox.style.backgroundColor = data.color;
            rgbPercent.textContent = data.rgb_percent;
            hexCode.textContent = data.hex;
            colorInfo.textContent = `当前颜色信息：RGB${data.rgb} HEX:${data.hex}`;
            
            // 删除/注释掉原有的光圈opacity控制代码
            // redLight.style.opacity = red / 100;
            // greenLight.style.opacity = green / 100;
            // blueLight.style.opacity = blue / 100;

            // 新增：高精度canvas物理加色混色
            drawPhysicalMixCanvas(red, green, blue);
        })
        .catch(error => console.error('更新颜色失败:', error));
    }
    
    // 滑块值变化处理
    function handleSliderChange(slider, valueElement, valueType) {
        return function() {
            const newValue = parseInt(this.value);
            valueElement.textContent = `${newValue}%`;
            
            // 更新对应的颜色值
            if (valueType === 'red') red = newValue;
            if (valueType === 'green') green = newValue;
            if (valueType === 'blue') blue = newValue;
            
            updateColor();
        };
    }
    
    // 设置滑块事件监听器
    redSlider.addEventListener('input', handleSliderChange(redSlider, redValue, 'red'));
    greenSlider.addEventListener('input', handleSliderChange(greenSlider, greenValue, 'green'));
    blueSlider.addEventListener('input', handleSliderChange(blueSlider, blueValue, 'blue'));
    
    // 重置按钮
    resetBtn.addEventListener('click', function() {
        red = green = blue = 100;
        redSlider.value = 100;
        greenSlider.value = 100;
        blueSlider.value = 100;
        
        redValue.textContent = '100%';
        greenValue.textContent = '100%';
        blueValue.textContent = '100%';
        
        hexInput.value = '';
        hexError.textContent = '';
        
        updateColor();
    });
    
    // 应用HEX颜色
    applyBtn.addEventListener('click', function() {
        const hexValue = hexInput.value.trim().toUpperCase();
        hexError.textContent = '';
        
        // 验证输入格式（6位十六进制）
        if (!/^[0-9A-F]{6}$/.test(hexValue)) {
            hexError.textContent = '格式错误，请输入6位十六进制颜色值';
            return;
        }
        
        fetch('/hex-to-rgb', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hex: hexValue
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                hexError.textContent = data.error;
                return;
            }
            
            // 更新滑块和值
            red = data.red;
            green = data.green;
            blue = data.blue;
            
            redSlider.value = red;
            greenSlider.value = green;
            blueSlider.value = blue;
            
            redValue.textContent = `${red}%`;
            greenValue.textContent = `${green}%`;
            blueValue.textContent = `${blue}%`;
            
            // 更新预览颜色
            updateColor();
        })
        .catch(error => {
            console.error('转换失败:', error);
            hexError.textContent = '转换失败，请重试';
        });
    });

    applyRgbBtn.addEventListener('click', function() {
        rgbError.textContent = '';
        const value = rgbInput.value.trim();
        // 支持“255,255,255”格式
        let match = value.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
        if (!match) {
            rgbError.textContent = '格式错误，请输入如 255,255,255';
            return;
        }
        let [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        if ([r, g, b].some(x => x < 0 || x > 255)) {
            rgbError.textContent = '每个值需在0-255之间';
            return;
        }
        // 转百分比
        red = Math.round(r / 255 * 100);
        green = Math.round(g / 255 * 100);
        blue = Math.round(b / 255 * 100);

        redSlider.value = red;
        greenSlider.value = green;
        blueSlider.value = blue;

        redValue.textContent = `${red}%`;
        greenValue.textContent = `${green}%`;
        blueValue.textContent = `${blue}%`;

        hexInput.value = '';
        hexError.textContent = '';
        updateColor();
    });
    
    // 颜色选择器（浏览器原生API）
    pickColorBtn.addEventListener('click', function() {
        // 创建一个虚拟的input元素以打开颜色选择器
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = previewBox.style.backgroundColor || '#FFFFFF';
        
        colorPicker.addEventListener('input', function() {
            // 格式为#RRGGBB
            const hexValue = this.value.slice(1).toUpperCase();
            hexInput.value = hexValue;
            
            // 调用应用按钮的功能
            applyBtn.click();
        });
        
        colorPicker.click();
    });

    hexInput.addEventListener('input', function() {
        const hexValue = hexInput.value.trim();
        if (/^[0-9A-Fa-f]{6}$/.test(hexValue)) {
            const r = parseInt(hexValue.slice(0,2), 16);
            const g = parseInt(hexValue.slice(2,4), 16);
            const b = parseInt(hexValue.slice(4,6), 16);
            hexToRgbResult.value = `${r},${g},${b}`;
        } else {
            hexToRgbResult.value = '';
        }
    });
    
    // 初始更新
    updateColor();
});

// 新增：高精度canvas物理加色混色函数
function drawPhysicalMixCanvas(redPercent, greenPercent, bluePercent) {
    const canvas = document.getElementById('mixCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 圆参数
    const r = 110;
    const offset = r * 0.55; // 原来是0.8，改小一点让圆心更近
    const vertical = r * 0.32; // 原来是0.4，改小一点
    const down = r * 0.65; // 原来是0.9，改小一点
    const centers = [
        {x: w/2 - offset, y: h/2 - vertical}, // 红
        {x: w/2 + offset, y: h/2 - vertical}, // 绿
        {x: w/2,          y: h/2 + down}      // 蓝
    ];
    // 颜色百分比转0-255
    const redVal = Math.round(redPercent * 2.55);
    const greenVal = Math.round(greenPercent * 2.55);
    const blueVal = Math.round(bluePercent * 2.55);

    // 先画底色
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, w, h);

    // 获取像素数据
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            // 判断每个像素是否在各自圆内
            let rIn = Math.pow(x - centers[0].x, 2) + Math.pow(y - centers[0].y, 2) < r*r;
            let gIn = Math.pow(x - centers[1].x, 2) + Math.pow(y - centers[1].y, 2) < r*r;
            let bIn = Math.pow(x - centers[2].x, 2) + Math.pow(y - centers[2].y, 2) < r*r;

            // 物理加色法：每个通道只在对应圆内加
            let R = rIn ? redVal : 0;
            let G = gIn ? greenVal : 0;
            let B = bIn ? blueVal : 0;

            // 三色加色法：RGB通道直接相加，最大不超过255
            let finalR = Math.min(R, 255);
            let finalG = Math.min(G, 255);
            let finalB = Math.min(B, 255);

            // 叠加
            let idx = (y * w + x) * 4;
            // 先用底色
            let base = 34; // #222
            data[idx]   = Math.max(finalR, base);
            data[idx+1] = Math.max(finalG, base);
            data[idx+2] = Math.max(finalB, base);
            data[idx+3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}