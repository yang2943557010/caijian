// 显示收藏的商品列表
function displayProducts() {
  const productList = document.getElementById('product-list');
  
  chrome.storage.local.get(['products'], (result) => {
    const products = result.products || [];
    
    if (products.length === 0) {
      productList.innerHTML = '<div class="empty-state">暂无收藏商品</div>';
      return;
    }
    
    productList.innerHTML = products.map((product, index) => `
      <div class="product-card" data-index="${index}">
        <div class="product-image">
          ${product.mainImages?.[0] ? 
            `<img src="${product.mainImages[0]}" alt="${product.title}" />` : 
            '<div class="no-image">暂无图片</div>'
          }
        </div>
        <div class="product-title">${product.title || '未知商品'}</div>
        <div class="product-price">
          ${product.details.price.current || '价格未知'}
        </div>
        <div class="product-meta">
          收藏于: ${new Date(product.collectedAt).toLocaleString()}
        </div>
        <div class="swipe-delete">删除</div>
      </div>
    `).join('');
    
    // 添加点击事件显示详情
    addCardClickHandlers();
    // 添加右滑删除功能
    addSwipeToDelete();
  });
}

// 显示商品详情
function showProductDetail(product) {
  const detailView = document.getElementById('detail-view');
  detailView.innerHTML = `
    <div class="detail-header">
      <button class="back-button">返回</button>
      <h3>${product.title}</h3>
    </div>
    <div class="detail-content">
      <div class="detail-images">
        ${product.mainImages.map(img => `
          <img src="${img}" alt="${product.title}" />
        `).join('')}
      </div>
      <div class="detail-info">
        <div class="detail-price">
          <div class="current-price">${product.details.price.current}</div>
          ${product.details.price.original ? 
            `<div class="original-price">${product.details.price.original}</div>` : 
            ''
          }
        </div>
        <div class="detail-attributes">
          ${Object.entries(product.attributes).map(([key, values]) => `
            <div class="attribute-group">
              <div class="attribute-name">${key}</div>
              <div class="attribute-values">
                ${values.map(value => `<span>${value}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="detail-stats">
          <div>评分: ${product.details.rating || '暂无'}</div>
          <div>评论数: ${product.details.reviewCount || '0'}</div>
          <div>销量: ${product.details.sales || '暂无'}</div>
        </div>
      </div>
    </div>
  `;
  
  detailView.classList.add('active');
  
  // 添加返回按钮事件
  detailView.querySelector('.back-button').addEventListener('click', () => {
    detailView.classList.remove('active');
  });
}

// 添加卡片点击事件
function addCardClickHandlers() {
  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const index = card.dataset.index;
      chrome.storage.local.get(['products'], (result) => {
        const products = result.products || [];
        const product = products[index];
        if (product) {
          showProductDetail(product);
        }
      });
    });
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  displayProducts();
  
  // 添加清空按钮事件
  document.getElementById('clear-all').addEventListener('click', () => {
    if (confirm('确定要清空所有收藏吗？')) {
      chrome.storage.local.set({ products: [] }, () => {
        displayProducts();
      });
    }
  });
}); 