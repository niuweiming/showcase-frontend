// 新春计算机 - 魔术逻辑
document.addEventListener('DOMContentLoaded', function () {
    // DOM 元素
    const inputFirst = document.getElementById('input-first');
    const inputSecond = document.getElementById('input-second');
    const btnPlus = document.getElementById('btn-plus');
    const btnEquals = document.getElementById('btn-equals');
    const btnShuffle = document.getElementById('btn-shuffle');
    const btnRestart = document.getElementById('btn-restart');
    const resultDisplay = document.getElementById('result-display');
    const numberGrid = document.getElementById('number-grid');
    const clickCount = document.getElementById('click-count');
    const finalResult = document.getElementById('final-result');
    const timeExplanation = document.getElementById('time-explanation');

    // 状态变量
    let firstNumber = '';
    let secondNumber = '';
    let sumResult = '';
    let currentTime = '';
    let clickedCount = 0;
    let clickedNumbers = [];

    // 获取当前时间（7位数格式：月日时分）
    function getCurrentTimeString() {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const day = now.getDate(); // 1-31
        const hour = now.getHours(); // 0-23
        const minute = now.getMinutes(); // 0-59

        // 格式化为 M(M)DD(H)HMM 或 MDDHMM
        const monthStr = month.toString();
        const dayStr = day.toString().padStart(2, '0');
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');

        return monthStr + dayStr + hourStr + minuteStr;
    }

    // 格式化时间说明
    function formatTimeExplanation() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hour = now.getHours();
        const minute = now.getMinutes();

        return `现在是 ${month}月${day}日 ${hour}点${minute}分`;
    }

    // 步骤1: 监听第一个输入框
    inputFirst.addEventListener('input', function () {
        const value = this.value.replace(/\D/g, ''); // 只保留数字
        this.value = value;
        btnPlus.disabled = value.length !== 4;
    });

    // 点击 + 按钮
    btnPlus.addEventListener('click', function () {
        firstNumber = inputFirst.value;
        showStep(2);
    });

    // 步骤2: 监听第二个输入框（这里是假输入，实际会被替换）
    inputSecond.addEventListener('input', function () {
        const value = this.value.replace(/\D/g, '');
        this.value = value;
        btnEquals.disabled = value.length !== 5;
    });

    // 点击 = 按钮（核心魔术逻辑）
    btnEquals.addEventListener('click', function () {
        // 获取当前时间（7位数）
        currentTime = getCurrentTimeString();

        // 用户输入的第二个数字（假的，只是为了显示）
        secondNumber = inputSecond.value;

        // 计算显示的和（第一个数 + 第二个数）
        sumResult = (parseInt(firstNumber) + parseInt(secondNumber)).toString();

        // 显示结果
        resultDisplay.textContent = sumResult;
        showStep(3);
    });

    // 点击"开始魔术"按钮
    btnShuffle.addEventListener('click', function () {
        // 生成打乱的数字按钮（1-9）
        generateNumberGrid();
        showStep(4);
    });

    // 生成数字按钮网格
    function generateNumberGrid() {
        numberGrid.innerHTML = '';
        
        // 创建 1-9 的数组并打乱
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(numbers);

        // 创建按钮
        numbers.forEach((num) => {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.dataset.number = num;
            btn.textContent = num; // 实际数字（被 CSS 隐藏）
            
            btn.addEventListener('click', function () {
                if (!this.classList.contains('clicked') && clickedCount < 7) {
                    handleNumberClick(this);
                }
            });

            numberGrid.appendChild(btn);
        });
    }

    // 处理数字按钮点击（魔术核心）
    function handleNumberClick(btn) {
        // 标记为已点击
        btn.classList.add('clicked');
        clickedCount++;

        // 显示当前时间的对应位数字（而不是按钮上的数字）
        const timeDigit = currentTime[clickedCount - 1];
        btn.textContent = timeDigit;
        clickedNumbers.push(timeDigit);

        // 更新计数器
        clickCount.textContent = clickedCount;

        // 如果点击了7次，显示最终结果
        if (clickedCount === 7) {
            setTimeout(() => {
                showFinalResult();
            }, 500);
        }
    }

    // 显示最终结果
    function showFinalResult() {
        finalResult.textContent = clickedNumbers.join('');
        timeExplanation.textContent = formatTimeExplanation();
        showStep(5);
    }

    // 打乱数组
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 显示指定步骤
    function showStep(stepNumber) {
        document.querySelectorAll('.step').forEach((step) => {
            step.classList.remove('active');
        });
        document.querySelector(`.step-${stepNumber}`).classList.add('active');
    }

    // 重新开始
    btnRestart.addEventListener('click', function () {
        // 重置所有状态
        firstNumber = '';
        secondNumber = '';
        sumResult = '';
        currentTime = '';
        clickedCount = 0;
        clickedNumbers = [];

        // 清空输入框
        inputFirst.value = '';
        inputSecond.value = '';
        resultDisplay.textContent = '0';
        clickCount.textContent = '0';
        finalResult.textContent = '';
        timeExplanation.textContent = '';

        // 禁用按钮
        btnPlus.disabled = true;
        btnEquals.disabled = true;

        // 返回第一步
        showStep(1);
    });
});
