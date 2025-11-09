// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 打字机效果 - 修改这里的名字
    const typedText = document.getElementById('typed-text');
    const nameToType = '无风爱自由'; // 改成你的名字
    
    if (typedText) {
        // 循环打字机效果
        function startTypingLoop() {
            // 打印文字
            typeWriter(typedText, nameToType, 150, function() {
                // 打印完成后，等待 2 秒，然后重新开始
                setTimeout(function() {
                    typedText.textContent = ''; // 清空文字
                    setTimeout(startTypingLoop, 500); // 稍微延迟后重新开始
                }, 2000); // 显示完整文字的时间（2秒）
            });
        }
        
        // 开始循环
        startTypingLoop();
    }
    
    // 头像鼠标跟随效果（可选，轻微效果）
    const avatar = document.getElementById('avatar');
    if (avatar) {
        document.addEventListener('mousemove', function(e) {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            avatar.style.transform = `translateY(${-20 + y * 10}px) rotate(${(x - 0.5) * 5}deg)`;
        });
    }
});


// 弹窗功能
document.addEventListener('DOMContentLoaded', function() {
    const contactBtn = document.getElementById('contact-btn');
    const modal = document.getElementById('contact-modal');
    const closeBtn = document.getElementById('close-modal');
    
    // 打开弹窗
    if (contactBtn && modal) {
        contactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        });
    }
    
    // 关闭弹窗 - 点击关闭按钮
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // 恢复滚动
        });
    }
    
    // 关闭弹窗 - 点击背景
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // 关闭弹窗 - 按ESC键
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});


// 打字机效果（支持循环）
function typeWriter(element, text, speed = 100, onComplete = null) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            // 打字完成后，光标继续闪烁
            const cursor = document.querySelector('.cursor');
            if (cursor) {
                cursor.style.animation = 'blink 1s infinite';
            }
            // 如果提供了完成回调，执行它
            if (onComplete) {
                onComplete();
            }
        }
    }
    
    type();
}

// 删除文字效果（可选，如果你想要删除效果）
function deleteText(element, text, speed = 50, onComplete = null) {
    let i = text.length;
    
    function deleteChar() {
        if (i > 0) {
            element.textContent = text.substring(0, i - 1);
            i--;
            setTimeout(deleteChar, speed);
        } else {
            if (onComplete) {
                onComplete();
            }
        }
    }
    
    deleteChar();
}

// 自定义光标拖尾效果
document.addEventListener('DOMContentLoaded', function() {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-trail';
    document.body.appendChild(cursor);
    
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);
    
    let trail = [];
    const trailLength = 5;
    
    document.addEventListener('mousemove', function(e) {
        // 主光标
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        // 光点
        dot.style.left = e.clientX + 'px';
        dot.style.top = e.clientY + 'px';
        
        // 拖尾效果
        trail.push({ x: e.clientX, y: e.clientY });
        if (trail.length > trailLength) {
            trail.shift();
        }
    });
    
    // 可点击元素效果
    const clickableElements = document.querySelectorAll('a, button, .btn, .social-link');
    clickableElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.width = '30px';
            cursor.style.height = '30px';
            cursor.style.background = 'var(--accent)';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.width = '10px';
            cursor.style.height = '10px';
            cursor.style.background = 'var(--primary)';
        });
    });
});