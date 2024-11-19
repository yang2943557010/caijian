// 显示收藏的商品列表
function displayProducts() {
  const productList = document.getElementById('product-list');
  
  chrome.storage.local.get(['products'], (result) => {
    const products = result.products || [];
    
    if (products.length === 0) {
      productList.innerHTML = '<p>暂无收藏商品</p>';
      return;
    }
    
    productList.innerHTML = products.map((product, index) => `
      <div class="product-card" data-index="${index}">
        <h3>${product.title || '未知商品'}</h3>
        <div class="product-price">
          ${product.details.price.current || '价格未知'}
        </div>
        <div class="product-image">
          ${product.mainImages?.[0] ? 
            `<img src="${product.mainImages[0]}" alt="${product.title}" />` : 
            '无图片'
          }
        </div>
        <div class="product-meta">
          <span>收藏于: ${new Date(product.collectedAt).toLocaleString()}</span>
        </div>
      </div>
    `).join('');
    
    // 添加右滑删除功能
    addSwipeToDelete();
  });
}

// 添加右滑删除功能
function addSwipeToDelete() {
  const cards = document.querySelectorAll('.product-card');
  let startX = 0;
  let currentX = 0;
  
  cards.forEach(card => {
    card.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });
    
    card.addEventListener('touchmove', (e) => {
      currentX = e.touches[0].clientX - startX;
      if (currentX < 0) { // 只允许右滑
        card.style.transform = `translateX(${currentX}px)`;
      }
    });
    
    card.addEventListener('touchend', () => {
      if (currentX < -100) { // 滑动距离足够时删除
        const index = card.dataset.index;
        deleteProduct(index);
      } else {
        card.style.transform = '';
      }
    });
  });
}

// 删除商品
function deleteProduct(index) {
  chrome.storage.local.get(['products'], (result) => {
    const products = result.products || [];
    products.splice(index, 1);
    chrome.storage.local.set({ products }, () => {
      displayProducts(); // 重新显示列表
    });
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  displayProducts();
}); 