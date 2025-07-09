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
            
            // 恢复用opacity控制三个色光透明度
            redLight.style.opacity = red / 100;
            greenLight.style.opacity = green / 100;
            blueLight.style.opacity = blue / 100;
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
    
    // 初始更新
    updateColor();
});