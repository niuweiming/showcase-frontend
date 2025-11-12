// 收藏管理功能
class BookmarkManager {
    constructor() {
        this.bookmarks = [];
        this.filteredBookmarks = [];
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.editingId = null;
        this.init();
    }

    async init() {
        this.bookmarks = await this.loadBookmarks();
        this.filteredBookmarks = [...this.bookmarks];
        this.render();
        this.setupEventListeners();
    }

    // 从服务器加载收藏
    async loadBookmarks() {
        try {
            const response = await fetch('/api/bookmarks');
            if (response.ok) {
                const bookmarks = await response.json();
                localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
                return Array.isArray(bookmarks) ? bookmarks : [];
            }
        } catch (error) {
            console.warn('从服务器加载失败，尝试使用本地缓存:', error);
        }
        
        const stored = localStorage.getItem('bookmarks');
        return stored ? JSON.parse(stored) : [];
    }

    // 保存收藏到服务器
    async saveBookmarks() {
        try {
            const response = await fetch('/api/bookmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.bookmarks)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
                    return true;
                }
            }
        } catch (error) {
            console.error('保存到服务器失败:', error);
            localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
        }
        return false;
    }

    // 添加收藏
    async addBookmark(bookmark) {
        const newBookmark = {
            id: Date.now(),
            title: bookmark.title,
            url: bookmark.url,
            category: bookmark.category,
            desc: bookmark.desc || '',
            createdAt: new Date().toISOString()
        };
        this.bookmarks.push(newBookmark);
        await this.saveBookmarks();
        this.applyFilters();
        return newBookmark;
    }

    // 更新收藏
    async updateBookmark(id, updates) {
        const index = this.bookmarks.findIndex(b => b.id === id);
        if (index !== -1) {
            this.bookmarks[index] = { ...this.bookmarks[index], ...updates };
            await this.saveBookmarks();
            this.applyFilters();
            return true;
        }
        return false;
    }

    // 删除收藏
    async deleteBookmark(id) {
        this.bookmarks = this.bookmarks.filter(b => b.id !== id);
        await this.saveBookmarks();
        this.applyFilters();
    }

    // 应用筛选和搜索
    applyFilters() {
        this.filteredBookmarks = this.bookmarks.filter(bookmark => {
            const matchCategory = this.currentCategory === 'all' || bookmark.category === this.currentCategory;
            const matchSearch = !this.searchQuery || 
                bookmark.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                bookmark.desc.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                bookmark.url.toLowerCase().includes(this.searchQuery.toLowerCase());
            return matchCategory && matchSearch;
        });
        this.render();
    }

    // 渲染收藏列表
    render() {
        const grid = document.getElementById('bookmarks-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (this.filteredBookmarks.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        grid.innerHTML = this.filteredBookmarks.map(bookmark => {
            const date = new Date(bookmark.createdAt);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            return `
                <div class="bookmark-card">
                    <div class="bookmark-header">
                        <h3 class="bookmark-title">${this.escapeHtml(bookmark.title)}</h3>
                        <button class="bookmark-delete" onclick="bookmarkManager.deleteBookmark(${bookmark.id})" title="删除">×</button>
                    </div>
                    <a href="${this.escapeHtml(bookmark.url)}" target="_blank" rel="noopener" class="bookmark-url">
                        ${this.escapeHtml(bookmark.url)}
                    </a>
                    ${bookmark.desc ? `<p class="bookmark-desc">${this.escapeHtml(bookmark.desc)}</p>` : ''}
                    <div class="bookmark-footer">
                        <span class="bookmark-category">${this.escapeHtml(bookmark.category)}</span>
                        <span class="bookmark-date">${dateStr}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 打开添加/编辑弹窗
    openModal(bookmark = null) {
        this.editingId = bookmark ? bookmark.id : null;
        const modal = document.getElementById('bookmark-modal');
        const form = document.getElementById('bookmark-form');
        const title = document.getElementById('modal-title');
        const deleteBtn = document.getElementById('delete-bookmark');
        
        if (bookmark) {
            title.textContent = '编辑收藏';
            document.getElementById('bookmark-title').value = bookmark.title;
            document.getElementById('bookmark-url').value = bookmark.url;
            document.getElementById('bookmark-category').value = bookmark.category;
            document.getElementById('bookmark-desc').value = bookmark.desc || '';
            deleteBtn.style.display = 'block';
        } else {
            title.textContent = '添加收藏';
            form.reset();
            deleteBtn.style.display = 'none';
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('bookmark-title').focus();
    }

    // 关闭弹窗
    closeModal() {
        const modal = document.getElementById('bookmark-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.editingId = null;
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

        // 分类筛选
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.applyFilters();
            });
        });

        // 添加按钮
        document.getElementById('add-bookmark-btn').addEventListener('click', () => {
            this.openModal();
        });

        // 表单提交
        document.getElementById('bookmark-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('bookmark-title').value.trim();
            const url = document.getElementById('bookmark-url').value.trim();
            const category = document.getElementById('bookmark-category').value;
            const desc = document.getElementById('bookmark-desc').value.trim();

            if (!title || !url || !category) {
                alert('请填写所有必填项！');
                return;
            }

            if (this.editingId) {
                await this.updateBookmark(this.editingId, { title, url, category, desc });
            } else {
                await this.addBookmark({ title, url, category, desc });
            }
            
            this.closeModal();
        });

        // 取消按钮
        document.getElementById('cancel-bookmark').addEventListener('click', () => {
            this.closeModal();
        });

        // 删除按钮
        document.getElementById('delete-bookmark').addEventListener('click', async () => {
            if (confirm('确定要删除这个收藏吗？')) {
                await this.deleteBookmark(this.editingId);
                this.closeModal();
            }
        });

        // 关闭按钮
        document.getElementById('close-bookmark-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // 点击背景关闭
        document.getElementById('bookmark-modal').addEventListener('click', (e) => {
            if (e.target.id === 'bookmark-modal') {
                this.closeModal();
            }
        });

        // ESC 关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('bookmark-modal').classList.contains('active')) {
                this.closeModal();
            }
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.bookmarkManager = new BookmarkManager();
});