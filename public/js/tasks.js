// 任务管理功能
class TaskManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.tasks = {};
        this.init();
    }

    async init() {
        this.tasks = await this.loadTasks();
        this.renderCalendar();
        this.setupEventListeners();
    }

    // 从服务器加载任务
    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (response.ok) {
                const tasks = await response.json();
                // 同时保存到 localStorage 作为缓存
                localStorage.setItem('dailyTasks', JSON.stringify(tasks));
                return tasks;
            }
        } catch (error) {
            console.warn('从服务器加载失败，尝试使用本地缓存:', error);
        }
        
        // 如果服务器加载失败，从 localStorage 加载缓存
        const stored = localStorage.getItem('dailyTasks');
        return stored ? JSON.parse(stored) : {};
    }

    // 保存任务到服务器
    async saveTasks() {
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.tasks)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // 同时保存到 localStorage 作为缓存
                    localStorage.setItem('dailyTasks', JSON.stringify(this.tasks));
                    return true;
                }
            }
        } catch (error) {
            console.error('保存到服务器失败:', error);
            // 如果服务器保存失败，至少保存到 localStorage
            localStorage.setItem('dailyTasks', JSON.stringify(this.tasks));
        }
        return false;
    }

    // 获取某天的任务
    getTasksForDate(dateStr) {
        return this.tasks[dateStr] || [];
    }

    // 添加任务
    async addTask(dateStr, taskText) {
        if (!this.tasks[dateStr]) {
            this.tasks[dateStr] = [];
        }
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.tasks[dateStr].push(task);
        await this.saveTasks();
        return task;
    }

    // 切换任务完成状态
    async toggleTask(dateStr, taskId) {
        const tasks = this.tasks[dateStr];
        if (tasks) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                await this.saveTasks();
                // 刷新日历和任务列表
                this.renderCalendar();
                const tasksList = this.getTasksForDate(dateStr);
                this.renderTaskList(dateStr, tasksList);
            }
        }
    }

    // 删除任务
    async deleteTask(dateStr, taskId) {
        if (this.tasks[dateStr]) {
            this.tasks[dateStr] = this.tasks[dateStr].filter(t => t.id !== taskId);
            if (this.tasks[dateStr].length === 0) {
                delete this.tasks[dateStr];
            }
            await this.saveTasks();
            // 刷新日历和任务列表
            this.renderCalendar();
            const tasksList = this.getTasksForDate(dateStr);
            this.renderTaskList(dateStr, tasksList);
        }
    }

    // 渲染日历
    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // 更新月份显示
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                           '七月', '八月', '九月', '十月', '十一月', '十二月'];
        document.getElementById('current-month-year').textContent = 
            `${year}年 ${monthNames[month]}`;

        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        // 清空日历
        calendar.innerHTML = '';

        // 星期标题
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        weekDays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });

        // 填充空白（月初）
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendar.appendChild(emptyDay);
        }

        // 渲染日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const dayTasks = this.getTasksForDate(dateStr);
            const completedCount = dayTasks.filter(t => t.completed).length;
            const totalCount = dayTasks.length;

            dayElement.className = 'calendar-day';
            
            // 标记今天
            if (date.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }

            // 标记有任务的日期
            if (totalCount > 0) {
                dayElement.classList.add('has-tasks');
                if (completedCount === totalCount && totalCount > 0) {
                    dayElement.classList.add('all-completed');
                }
            }

            // 构建任务显示内容
            let tasksHTML = '';
            if (totalCount > 0) {
                // 显示前2个任务
                const tasksToShow = dayTasks.slice(0, 2);
                tasksHTML = '<div class="day-tasks">';
                tasksToShow.forEach(task => {
                    const taskClass = task.completed ? 'task-preview completed' : 'task-preview';
                    const taskText = this.escapeHtml(task.text);
                    // 限制显示长度，避免过长（更严格的限制）
                    const maxLength = 12;
                    const displayText = taskText.length > maxLength ? taskText.substring(0, maxLength) + '...' : taskText;
                    tasksHTML += `<div class="${taskClass}" title="${taskText}" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayText}</div>`;
                });
                // 如果还有更多任务，显示提示
                if (dayTasks.length > 2) {
                    tasksHTML += `<div class="task-more">还有 ${dayTasks.length - 2} 个任务...</div>`;
                }
                tasksHTML += '</div>';
                
                // 任务指示器
                tasksHTML += `<div class="task-indicator">${completedCount}/${totalCount}</div>`;
            }
            
            dayElement.innerHTML = `
                <div class="day-number">${day}</div>
                ${tasksHTML}
            `;

            dayElement.addEventListener('click', () => this.openTaskModal(dateStr, date));
            calendar.appendChild(dayElement);
        }
    }

    // 打开任务弹窗
    openTaskModal(dateStr, date) {
        this.selectedDate = dateStr;
        const modal = document.getElementById('task-modal');
        const tasks = this.getTasksForDate(dateStr);
        
        // 更新标题
        const dateStrDisplay = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        document.getElementById('modal-date-title').textContent = dateStrDisplay;

        // 清空输入框
        document.getElementById('task-input').value = '';
        document.getElementById('task-input').focus();

        // 渲染任务列表
        this.renderTaskList(dateStr, tasks);

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 关闭任务弹窗
    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.selectedDate = null;
    }

    // 渲染任务列表
    renderTaskList(dateStr, tasks) {
        const tasksList = document.getElementById('tasks-list');
        tasksList.innerHTML = '';

        if (tasks.length === 0) {
            tasksList.innerHTML = '<p class="no-tasks">暂无任务，添加第一个任务吧！</p>';
            return;
        }

        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            const taskIcon = task.completed ? '✓' : '○';
            taskItem.innerHTML = `
                <div class="task-checkbox-wrapper">
                    <input type="checkbox" 
                           id="task-${task.id}"
                           ${task.completed ? 'checked' : ''} 
                           onchange="taskManager.toggleTask('${dateStr}', ${task.id})">
                    <label for="task-${task.id}" class="custom-checkbox">
                        <span class="checkmark">${task.completed ? '✓' : ''}</span>
                    </label>
                </div>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <button class="task-delete" onclick="taskManager.deleteTask('${dateStr}', ${task.id})" title="删除任务">×</button>
            `;
            tasksList.appendChild(taskItem);
        });
    }

    // HTML 转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 格式化日期为 YYYY-MM-DD
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 设置事件监听
    setupEventListeners() {
        // 上个月/下个月
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // 保存任务
        document.getElementById('save-task').addEventListener('click', async () => {
            const input = document.getElementById('task-input');
            const taskText = input.value.trim();
            
            if (taskText) {
                await this.addTask(this.selectedDate, taskText);
                const tasks = this.getTasksForDate(this.selectedDate);
                this.renderTaskList(this.selectedDate, tasks);
                this.renderCalendar(); // 刷新日历
                input.value = '';
                input.focus();
            }
        });

        // 取消
        document.getElementById('cancel-task').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // 关闭按钮
        document.getElementById('close-task-modal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // 点击背景关闭
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                this.closeTaskModal();
            }
        });

        // 回车保存
        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('save-task').click();
            }
        });

        // ESC 关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTaskModal();
            }
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});

