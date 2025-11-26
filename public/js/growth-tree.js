// 成长树管理功能
class GrowthTreeManager {
    constructor() {
        this.records = {}; // { "2025-01-15": [{ id, content, tags, time, createdAt }] }
        this.filteredRecords = {};
        this.currentTag = 'all';
        this.searchQuery = '';
        this.editingRecord = null;
        this.init();
    }

    async init() {
        this.records = await this.loadRecords();
        this.applyFilters();
        this.setupEventListeners();
    }

    // 从服务器加载记录
    async loadRecords() {
        try {
            const response = await fetch('/api/daily-records');
            if (response.ok) {
                const records = await response.json();
                localStorage.setItem('dailyRecords', JSON.stringify(records));
                return records && typeof records === 'object' ? records : {};
            }
        } catch (error) {
            console.warn('从服务器加载失败，尝试使用本地缓存:', error);
        }
        
        const stored = localStorage.getItem('dailyRecords');
        return stored ? JSON.parse(stored) : {};
    }

    // 保存记录到服务器
    async saveRecords() {
        try {
            const response = await fetch('/api/daily-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.records)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    localStorage.setItem('dailyRecords', JSON.stringify(this.records));
                    return true;
                }
            }
        } catch (error) {
            console.error('保存到服务器失败:', error);
            localStorage.setItem('dailyRecords', JSON.stringify(this.records));
        }
        return false;
    }

    // 添加记录
    async addRecord(dateStr, recordData) {
        if (!this.records[dateStr]) {
            this.records[dateStr] = [];
        }
        
        const newRecord = {
            id: Date.now(),
            content: recordData.content,
            tags: recordData.tags || [],
            time: recordData.time || '',
            createdAt: new Date().toISOString()
        };
        
        this.records[dateStr].push(newRecord);
        // 按时间排序（最新的在前）
        this.records[dateStr].sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            return timeB.localeCompare(timeA);
        });
        
        await this.saveRecords();
        this.applyFilters();
        return newRecord;
    }

    // 更新记录
    async updateRecord(dateStr, recordId, updates) {
        const records = this.records[dateStr];
        if (records) {
            const record = records.find(r => r.id === recordId);
            if (record) {
                Object.assign(record, updates);
                await this.saveRecords();
                this.applyFilters();
                return true;
            }
        }
        return false;
    }

    // 删除记录
    async deleteRecord(dateStr, recordId) {
        if (this.records[dateStr]) {
            this.records[dateStr] = this.records[dateStr].filter(r => r.id !== recordId);
            if (this.records[dateStr].length === 0) {
                delete this.records[dateStr];
            }
            await this.saveRecords();
            this.applyFilters();
        }
    }

    // 删除记录（供onclick调用）
    async handleDeleteRecord(dateStr, recordId) {
        if (confirm('确定要删除这条记录吗？')) {
            await this.deleteRecord(dateStr, recordId);
        }
    }

    // 应用筛选和搜索
    applyFilters() {
        this.filteredRecords = {};
        
        Object.keys(this.records).forEach(dateStr => {
            const dayRecords = this.records[dateStr].filter(record => {
                // 标签筛选
                const matchTag = this.currentTag === 'all' || 
                    (record.tags && record.tags.includes(this.currentTag));
                
                // 搜索筛选
                const matchSearch = !this.searchQuery || 
                    record.content.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    (record.tags && record.tags.some(tag => 
                        tag.toLowerCase().includes(this.searchQuery.toLowerCase())
                    ));
                
                return matchTag && matchSearch;
            });
            
            if (dayRecords.length > 0) {
                this.filteredRecords[dateStr] = dayRecords;
            }
        });
        
        this.render();
    }

    // 渲染树形结构
    render() {
        const wrapper = document.getElementById('tree-wrapper');
        const emptyState = document.getElementById('empty-state');
        
        const allDates = Object.keys(this.filteredRecords).sort((a, b) => b.localeCompare(a));
        
        if (allDates.length === 0) {
            wrapper.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        wrapper.style.display = 'block';
        emptyState.style.display = 'none';
        
        // 按月份分组
        const monthGroups = {};
        allDates.forEach(dateStr => {
            const date = new Date(dateStr);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthGroups[monthKey]) {
                monthGroups[monthKey] = [];
            }
            monthGroups[monthKey].push(dateStr);
        });
        
        // 渲染月份组
        wrapper.innerHTML = Object.keys(monthGroups)
            .sort((a, b) => b.localeCompare(a))
            .map(monthKey => {
                const dates = monthGroups[monthKey];
                const date = new Date(dates[0]);
                const monthName = `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
                const totalCount = dates.reduce((sum, d) => sum + this.filteredRecords[d].length, 0);
                
                return `
                    <div class="month-group">
                        <div class="month-header">
                            <h3 class="month-title">${monthName}</h3>
                            <span class="month-count">共 ${dates.length} 天，${totalCount} 条记录</span>
                        </div>
                        <div class="days-list">
                            ${dates.map(dateStr => this.renderDayNode(dateStr)).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        
        // 绑定展开/收起事件
        this.setupToggleEvents();
    }

    // 渲染单个日期节点
    renderDayNode(dateStr) {
        const records = this.filteredRecords[dateStr];
        const date = new Date(dateStr);
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdays[date.getDay()];
        const dateDisplay = `${date.getMonth() + 1}月${date.getDate()}日`;
        
        // 默认展开最近7天的记录
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const recordDate = new Date(dateStr);
        recordDate.setHours(0, 0, 0, 0);
        const daysDiff = (today - recordDate) / (1000 * 60 * 60 * 24);
        const isExpanded = daysDiff <= 7;
        
        return `
            <div class="day-node ${isExpanded ? 'expanded' : ''}" data-date="${dateStr}">
                <div class="day-header" onclick="growthTreeManager.toggleDay('${dateStr}')">
                    <span class="day-dot"></span>
                    <span class="day-date">${dateDisplay}</span>
                    <span class="day-weekday">星期${weekday}</span>
                    <span class="day-count">${records.length} 条</span>
                    <span class="toggle-icon">▶</span>
                </div>
                <div class="records-list">
                    ${records.map(record => this.renderRecord(record, dateStr)).join('')}
                </div>
            </div>
        `;
    }

    // 渲染单条记录
    renderRecord(record, dateStr) {
        const tagsHtml = record.tags && record.tags.length > 0
            ? `<div class="record-tags">${record.tags.map(tag => 
                `<span class="record-tag">${this.escapeHtml(tag)}</span>`
            ).join('')}</div>`
            : '';
        
        const timeDisplay = record.time ? record.time : '';
        
        return `
            <div class="record-item">
                <div class="record-content">${this.escapeHtml(record.content)}</div>
                <div class="record-meta">
                    ${tagsHtml}
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${timeDisplay ? `<span class="record-time">${timeDisplay}</span>` : ''}
                        <div class="record-actions">
                            <button class="record-edit" onclick="growthTreeManager.editRecord('${dateStr}', ${record.id})" title="编辑">✎</button>
                            <button class="record-delete" onclick="growthTreeManager.handleDeleteRecord('${dateStr}', ${record.id})" title="删除">×</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 切换日期展开/收起
    toggleDay(dateStr) {
        const dayNode = document.querySelector(`.day-node[data-date="${dateStr}"]`);
        if (dayNode) {
            dayNode.classList.toggle('expanded');
        }
    }

    // 打开添加/编辑弹窗
    openModal(record = null, dateStr = null) {
        this.editingRecord = record;
        const modal = document.getElementById('record-modal');
        const form = document.getElementById('record-form');
        const title = document.getElementById('modal-title');
        const deleteBtn = document.getElementById('delete-record');
        
        if (record) {
            // 编辑模式
            title.textContent = '编辑记录';
            document.getElementById('record-date').value = dateStr;
            document.getElementById('record-time').value = record.time || '';
            document.getElementById('record-content').value = record.content;
            document.getElementById('record-tags').value = record.tags ? record.tags.join(',') : '';
            deleteBtn.style.display = 'block';
        } else {
            // 添加模式
            title.textContent = '添加记录';
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('record-date').value = dateStr || today;
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            document.getElementById('record-time').value = timeStr;
            document.getElementById('record-content').value = '';
            document.getElementById('record-tags').value = '';
            deleteBtn.style.display = 'none';
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('record-content').focus();
    }

    // 关闭弹窗
    closeModal() {
        const modal = document.getElementById('record-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.editingRecord = null;
        document.getElementById('record-form').reset();
    }

    // 编辑记录
    editRecord(dateStr, recordId) {
        const records = this.records[dateStr];
        if (records) {
            const record = records.find(r => r.id === recordId);
            if (record) {
                this.openModal(record, dateStr);
            }
        }
    }

    // HTML 转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 设置事件监听
    setupEventListeners() {
        // 搜索
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.applyFilters();
        });

        // 标签筛选
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTag = btn.dataset.tag;
                this.applyFilters();
            });
        });

        // 添加按钮
        document.getElementById('add-record-btn').addEventListener('click', () => {
            this.openModal();
        });

        // 表单提交
        document.getElementById('record-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const dateStr = document.getElementById('record-date').value;
            const time = document.getElementById('record-time').value;
            const content = document.getElementById('record-content').value.trim();
            const tagsInput = document.getElementById('record-tags').value.trim();
            
            if (!content) {
                alert('请输入记录内容！');
                return;
            }

            const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

            if (this.editingRecord) {
                // 更新记录
                const oldDateStr = Object.keys(this.records).find(d => 
                    this.records[d].some(r => r.id === this.editingRecord.id)
                );
                
                if (oldDateStr !== dateStr) {
                    // 日期改变了，需要移动记录
                    await this.deleteRecord(oldDateStr, this.editingRecord.id);
                    await this.addRecord(dateStr, { content, tags, time });
                } else {
                    // 同一天，直接更新
                    await this.updateRecord(dateStr, this.editingRecord.id, { content, tags, time });
                }
            } else {
                // 添加记录
                await this.addRecord(dateStr, { content, tags, time });
            }
            
            this.closeModal();
        });

        // 取消按钮
        document.getElementById('cancel-record').addEventListener('click', () => {
            this.closeModal();
        });

        // 删除按钮
        document.getElementById('delete-record').addEventListener('click', async () => {
            if (this.editingRecord && confirm('确定要删除这条记录吗？')) {
                const dateStr = document.getElementById('record-date').value;
                await this.deleteRecord(dateStr, this.editingRecord.id);
                this.closeModal();
            }
        });

        // 关闭按钮
        document.getElementById('close-record-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // 点击背景关闭
        document.getElementById('record-modal').addEventListener('click', (e) => {
            if (e.target.id === 'record-modal') {
                this.closeModal();
            }
        });

        // ESC 关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('record-modal').classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    // 设置展开/收起事件（在渲染后调用）
    setupToggleEvents() {
        // 事件已经在 renderDayNode 中通过 onclick 绑定了
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.growthTreeManager = new GrowthTreeManager();
});

