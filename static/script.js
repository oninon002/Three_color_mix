class ColorMixApp {
    constructor() {
        this.state = {
            red: 100,
            green: 100,
            blue: 100
        };
        
        this.cacheElements();
        this.initRenderer();
        this.bindEvents();
        this.updateColor();
        this.cacheGradientElements();
        this.initGradientDemo();
        if (this.elements.upload && this.elements.upload.defaultUrl) {
            this.showImagePreview(this.elements.upload.defaultUrl);
        }
    }
    
    cacheElements() {
        this.elements = {
            previewBox: document.getElementById('previewBox'),
            rgbPercent: document.getElementById('rgbPercent'),
            hexCode: document.getElementById('hexCode'),
            colorInfo: document.getElementById('colorInfo'),
            
            sliders: {
                red: document.getElementById('redSlider'),
                green: document.getElementById('greenSlider'),
                blue: document.getElementById('blueSlider')
            },
            
            values: {
                red: document.querySelector('.slider.red .slider-value'),
                green: document.querySelector('.slider.green .slider-value'),
                blue: document.querySelector('.slider.blue .slider-value')
            },
            
            inputs: {
                hex: document.getElementById('hexInput'),
                rgb: document.getElementById('rgbInput')
            },
            
            errors: {
                hex: document.getElementById('hexError'),
                rgb: document.getElementById('rgbError')
            },
            
            buttons: {
                applyHex: document.getElementById('applyBtn'),
                applyRgb: document.getElementById('applyRgbBtn'),
                reset: document.getElementById('resetBtn'),
                picker: document.getElementById('pickColorBtn')
            },
            upload: {
                input: document.getElementById('imageInput'),
                button: document.getElementById('uploadBtn'),
                error: document.getElementById('uploadError'),
                preview: null,
                defaultUrl: '/static/default_upload.png'
            }
        };
    }
    
    initRenderer() {
        this.renderer = new ColorMixRenderer('mixCanvas');
    }
    
    bindEvents() {
        // 滑块事件
        this.elements.sliders.red.addEventListener('input', () => this.handleSliderChange('red'));
        this.elements.sliders.green.addEventListener('input', () => this.handleSliderChange('green'));
        this.elements.sliders.blue.addEventListener('input', () => this.handleSliderChange('blue'));
        
        // 按钮事件
        this.elements.buttons.reset.addEventListener('click', () => this.resetColor());
        this.elements.buttons.applyHex.addEventListener('click', () => this.applyHexColor());
        this.elements.buttons.applyRgb.addEventListener('click', () => this.applyRgbColor());
        this.elements.buttons.picker.addEventListener('click', () => this.openColorPicker());
        
        // 上传图片事件
        this.elements.upload.button.addEventListener('click', (e) => this.handleImageUpload(e));
        
        // 输入框回车事件
        this.elements.inputs.hex.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyHexColor();
        });
        
        this.elements.inputs.rgb.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyRgbColor();
        });
    }
    
    handleSliderChange(colorType) {
        const newValue = parseInt(this.elements.sliders[colorType].value);
        this.state[colorType] = newValue;
        this.elements.values[colorType].textContent = `${newValue}%`;
        this.updateColor();
    }
    
    async updateColor() {
        try {
            const response = await fetch('/update-color', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    red: this.state.red,
                    green: this.state.green,
                    blue: this.state.blue
                })
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            // 更新UI
            this.elements.previewBox.style.backgroundColor = data.color;
            this.elements.rgbPercent.textContent = data.rgb_percent;
            this.elements.hexCode.textContent = data.hex;
            this.elements.colorInfo.textContent = `当前颜色信息：RGB${data.rgb} HEX:${data.hex}`;
            
            // 更新Canvas渲染
            this.renderer.render(
                Math.round(this.state.red * 2.55),
                Math.round(this.state.green * 2.55),
                Math.round(this.state.blue * 2.55)
            );
            
        } catch (error) {
            console.error('更新颜色失败:', error);
        }
    }
    
    resetColor() {
        this.state = { red: 100, green: 100, blue: 100 };
        
        // 重置滑块
        this.elements.sliders.red.value = 100;
        this.elements.sliders.green.value = 100;
        this.elements.sliders.blue.value = 100;
        
        // 重置显示值
        this.elements.values.red.textContent = '100%';
        this.elements.values.green.textContent = '100%';
        this.elements.values.blue.textContent = '100%';
        
        // 清空输入和错误
        this.elements.inputs.hex.value = '';
        this.elements.inputs.rgb.value = '';
        this.elements.errors.hex.textContent = '';
        this.elements.errors.rgb.textContent = '';
        
        this.updateColor();
    }
    
    async applyHexColor() {
        const hexValue = this.elements.inputs.hex.value.trim().toUpperCase();
        this.elements.errors.hex.textContent = '';
        
        if (!/^[0-9A-F]{6}$/.test(hexValue)) {
            this.elements.errors.hex.textContent = '格式错误，请输入6位十六进制颜色值';
            return;
        }
        
        try {
            const response = await fetch('/hex-to-rgb', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    hex: hexValue
                })
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            if (data.error) {
                this.elements.errors.hex.textContent = data.error;
                return;
            }
            
            // 更新状态
            this.state.red = data.red;
            this.state.green = data.green;
            this.state.blue = data.blue;
            
            // 更新滑块
            this.elements.sliders.red.value = data.red;
            this.elements.sliders.green.value = data.green;
            this.elements.sliders.blue.value = data.blue;
            
            // 更新显示值
            this.elements.values.red.textContent = `${data.red}%`;
            this.elements.values.green.textContent = `${data.green}%`;
            this.elements.values.blue.textContent = `${data.blue}%`;
            
            // 更新RGB输入框
            this.elements.inputs.rgb.value = data.rgb.replace(/[()]/g, '');
            
            this.updateColor();
            
        } catch (error) {
            console.error('转换失败:', error);
            this.elements.errors.hex.textContent = '转换失败，请重试';
        }
    }
    
    applyRgbColor() {
        this.elements.errors.rgb.textContent = '';
        const value = this.elements.inputs.rgb.value.trim();
        
        // 支持"255,255,255"格式
        let match = value.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
        if (!match) {
            this.elements.errors.rgb.textContent = '格式错误，请输入如 255,255,255';
            return;
        }
        
        let [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        if ([r, g, b].some(x => x < 0 || x > 255)) {
            this.elements.errors.rgb.textContent = '每个值需在0-255之间';
            return;
        }
        
        // 转百分比
        this.state.red = Math.round(r / 255 * 100);
        this.state.green = Math.round(g / 255 * 100);
        this.state.blue = Math.round(b / 255 * 100);
        
        // 更新滑块
        this.elements.sliders.red.value = this.state.red;
        this.elements.sliders.green.value = this.state.green;
        this.elements.sliders.blue.value = this.state.blue;
        
        // 更新显示值
        this.elements.values.red.textContent = `${this.state.red}%`;
        this.elements.values.green.textContent = `${this.state.green}%`;
        this.elements.values.blue.textContent = `${this.state.blue}%`;
        
        // 更新HEX输入框
        this.elements.inputs.hex.value = '';
        this.elements.errors.hex.textContent = '';
        
        this.updateColor();
    }
    
    openColorPicker() {
        // 创建一个虚拟的input元素以打开颜色选择器
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = this.elements.previewBox.style.backgroundColor || '#FFFFFF';
        
        colorPicker.addEventListener('input', () => {
            // 格式为#RRGGBB
            const hexValue = colorPicker.value.slice(1).toUpperCase();
            this.elements.inputs.hex.value = hexValue;
            
            // 调用应用按钮的功能
            this.applyHexColor();
        });
        
        colorPicker.click();
    }

    async handleImageUpload(e) {
        e.preventDefault();
        this.elements.upload.error.textContent = '';
        const file = this.elements.upload.input.files[0];
        if (!file) {
            this.elements.upload.error.textContent = '请选择图片文件';
            return;
        }
        if (!file.type.startsWith('image/')) {
            this.elements.upload.error.textContent = '仅支持图片文件';
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB限制
            this.elements.upload.error.textContent = '图片大小不能超过2MB';
            return;
        }
        const formData = new FormData();
        formData.append('image', file);
        try {
            const response = await fetch('/upload-image', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                this.elements.upload.error.textContent = data.error || '上传失败';
                return;
            }
            this.elements.upload.error.textContent = '上传成功！';
            // 展示图片预览
            this.showImagePreview(data.url);
            // 可在此处处理返回的图片URL等
        } catch (err) {
            this.elements.upload.error.textContent = '上传失败，请重试';
        }
    }

    showImagePreview(url) {
        if (!this.elements.upload.preview) {
            this.elements.upload.preview = document.createElement('img');
            this.elements.upload.preview.style.display = 'block';
            this.elements.upload.preview.style.maxWidth = '100%';
            this.elements.upload.preview.style.maxHeight = '320px';
            this.elements.upload.preview.style.margin = '20px auto 0 auto';
            this.elements.upload.preview.style.borderRadius = '8px';
            this.elements.upload.preview.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            const group = document.getElementById('uploadGroup');
            group.parentNode.insertBefore(this.elements.upload.preview, group.nextSibling);
        }
        this.elements.upload.preview.src = url;
    }

    cacheGradientElements() {
        this.gradient = {
            canvas: document.getElementById('gradientCanvas'),
            slider: document.getElementById('gradientSlider'),
            input: document.getElementById('gradientInput'),
            label: document.getElementById('gradientCountLabel'),
            ctx: null
        };
        if (this.gradient.canvas) {
            this.gradient.ctx = this.gradient.canvas.getContext('2d');
        }
    }

    initGradientDemo() {
        if (!this.gradient.canvas) return;
        // 初始渲染
        this.renderGradient(256);
        // 事件绑定
        this.gradient.slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.gradient.input.value = val;
            this.gradient.label.textContent = val;
            this.renderGradient(val);
        });
        this.gradient.input.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val)) val = 1;
            val = Math.max(1, Math.min(256, val));
            this.gradient.slider.value = val;
            this.gradient.label.textContent = val;
            this.renderGradient(val);
        });
    }

    renderGradient(count) {
        const ctx = this.gradient.ctx;
        const w = this.gradient.canvas.width;
        const h = this.gradient.canvas.height;
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < count; i++) {
            const x0 = Math.round(i * w / count);
            const x1 = Math.round((i + 1) * w / count);
            const gray = Math.round(i * 255 / (count - 1));
            ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
            ctx.fillRect(x0, 0, x1 - x0, h);
        }
        // 边框
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(0, 0, w, h);
    }
}

class ColorMixRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 预计算圆参数
        this.r = 110;
        this.offset = this.r * 0.55;
        this.vertical = this.r * 0.32;
        this.down = this.r * 0.65;
        this.centers = [
            {x: this.width/2 - this.offset, y: this.height/2 - this.vertical},
            {x: this.width/2 + this.offset, y: this.height/2 - this.vertical},
            {x: this.width/2, y: this.height/2 + this.down}
        ];
        
        // 预计算r²
        this.r2 = this.r * this.r;
    }
    
    render(red, green, blue) {
        if (!this.ctx) return;
        
        requestAnimationFrame(() => {
            // 清除画布
            this.ctx.fillStyle = "#222";
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // 获取像素数据
            const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
            const data = imgData.data;
            const base = 34; // #222的R/G/B值
            
            // 优化循环性能
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const idx = (y * this.width + x) * 4;
                    
                    // 计算距离
                    const dx0 = x - this.centers[0].x;
                    const dy0 = y - this.centers[0].y;
                    const dx1 = x - this.centers[1].x;
                    const dy1 = y - this.centers[1].y;
                    const dx2 = x - this.centers[2].x;
                    const dy2 = y - this.centers[2].y;
                    
                    // 判断是否在圆内
                    const rIn = dx0*dx0 + dy0*dy0 < this.r2;
                    const gIn = dx1*dx1 + dy1*dy1 < this.r2;
                    const bIn = dx2*dx2 + dy2*dy2 < this.r2;
                    
                    // 设置像素颜色
                    data[idx]   = Math.max(rIn ? red : 0, base);
                    data[idx+1] = Math.max(gIn ? green : 0, base);
                    data[idx+2] = Math.max(bIn ? blue : 0, base);
                    data[idx+3] = 255; // Alpha通道
                }
            }
            
            // 将像素数据放回画布
            this.ctx.putImageData(imgData, 0, 0);
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ColorMixApp();
});