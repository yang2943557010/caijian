// 创建悬浮按钮
function createFloatingButton() {
  const button = document.createElement('button');
  button.id = 'temu-collector-btn';
  button.innerHTML = '收藏商品';
  
  document.body.appendChild(button);
  return button;
}

// 创建右侧面板
function createSidePanel() {
  const panel = document.createElement('div');
  panel.id = 'temu-side-panel';
  panel.innerHTML = `
    <div class="panel-container">
      <div class="panel-header">
        <h2>Temu收藏夹</h2>
        <button id="panel-toggle">-</button>
      </div>
      <div class="panel-content">
        <div id="product-list"></div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  
  // 添加拖拽调整宽度功能
  const resizer = document.createElement('div');
  resizer.className = 'panel-resizer';
  panel.appendChild(resizer);
  
  return panel;
}

// 显示商品列表
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
        <div class="product-preview">
          <div class="product-image">
            ${product.mainImages?.[0] ? 
              `<img src="${product.mainImages[0]}" alt="${product.title}" />` : 
              '<div class="no-image">暂无图片</div>'
            }
          </div>
          <div class="product-content">
            <div class="product-title">${product.title || '未知商品'}</div>
            <div class="product-price">${product.details?.price?.current || '价格未知'}</div>
            <div class="product-meta">
              <span>销量: ${product.details?.sales || '暂无'}</span>
              <button class="delete-btn" data-index="${index}">删除</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // 创建详情弹窗
    if (!document.getElementById('detail-modal')) {
      const modal = document.createElement('div');
      modal.id = 'detail-modal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3></h3>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="detail-layout">
              <div class="image-section">
                <div class="image-slider">
                  <div class="slider-container"></div>
                  <div class="slider-nav">
                    <button class="nav-prev">&lt;</button>
                    <button class="nav-next">&gt;</button>
                  </div>
                </div>
                <div class="thumbnail-list"></div>
              </div>
              <div class="info-section">
                <div class="info-content"></div>
                <div class="info-actions">
                  <a class="view-link" target="_blank">查看商品页面</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // 关闭弹窗事件
      modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.classList.remove('show');
      });
    }

    // 添加卡片点击事件
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn')) {
          const index = card.dataset.index;
          showProductDetail(products[index]);
        }
      });
    });

    // 添加删除按钮事件
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = button.dataset.index;
        deleteProduct(index);
      });
    });
  });
}

// 创建展开按钮
function createExpandButton() {
  const button = document.createElement('button');
  button.id = 'panel-expand-btn';
  button.innerHTML = '展开收藏夹';
  button.style.display = 'none'; // 初始隐藏
  document.body.appendChild(button);
  return button;
}

// 修改initPanel函数
function initPanel(panel) {
  const toggleBtn = panel.querySelector('#panel-toggle');
  const content = panel.querySelector('.panel-content');
  const expandBtn = createExpandButton();
  let isCollapsed = false;
  
  toggleBtn.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      content.style.display = 'none';
      panel.style.width = '0';  // 完全隐藏面板
      expandBtn.style.display = 'block';
    } else {
      content.style.display = 'block';
      panel.style.width = '400px';
      expandBtn.style.display = 'none';
    }
  });
  
  expandBtn.addEventListener('click', () => {
    isCollapsed = false;
    content.style.display = 'block';
    panel.style.width = '400px';
    expandBtn.style.display = 'none';
  });
  
  displayProducts();
}

// 添加拖拽调整宽度功能
function initResizer(panel) {
  const resizer = panel.querySelector('.panel-resizer');
  let startX, startWidth;
  
  function startResize(e) {
    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(panel).width, 10);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  }
  
  function resize(e) {
    const width = startWidth - (e.clientX - startX);
    panel.style.width = `${Math.min(Math.max(width, 300), 800)}px`;
  }
  
  function stopResize() {
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }
  
  resizer.addEventListener('mousedown', startResize);
}

// 修改getProductInfo函数，使用xpath获取数据
function getProductInfo() {
  // 辅助函数：通过xpath获取元素
  function getElementByXPath(xpath) {
    return document.evaluate(
      xpath, 
      document, 
      null, 
      XPathResult.FIRST_ORDERED_NODE_TYPE, 
      null
    ).singleNodeValue;
  }

  // 辅助函数：通过xpath获取所有元素
  function getElementsByXPath(xpath) {
    const result = document.evaluate(
      xpath, 
      document, 
      null, 
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
      null
    );
    const elements = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      elements.push(result.snapshotItem(i));
    }
    return elements;
  }

  // 获取商品信息
  const title = getElementByXPath('//*[@id="rightContent"]/div[2]/div[1]/div/div/text()')?.textContent?.trim();
  const salesCurrency = getElementByXPath('//*[@id="rightContent"]/div[3]/div[1]/div/span/text()[1]')?.textContent?.trim() || '';
  const salesInteger = getElementByXPath('//*[@id="rightContent"]/div[3]/div[1]/div/span/text()[2]')?.textContent?.trim() || '';
  const salesDecimal = getElementByXPath('//*[@id="rightContent"]/div[3]/div[1]/div/span/text()[3]')?.textContent?.trim() || '';
  const sales = `${salesCurrency}${salesInteger}${salesDecimal}`;
  const priceCurrency = getElementByXPath('//*[@id="goods_price"]/div[1]/div/span/text()[1]')?.textContent?.trim() || '';
  const priceInteger = getElementByXPath('//*[@id="goods_price"]/div[1]/div/span/text()[2]')?.textContent?.trim() || '';
  const priceDecimal = getElementByXPath('//*[@id="goods_price"]/div[1]/div/span/text()[3]')?.textContent?.trim() || '';
  const price = `${priceCurrency}${priceInteger}${priceDecimal}`;
  const modelName = getElementByXPath('//*[@id="rightContent"]/div[7]/div/div/div[1]/div/span/text()[1]')?.textContent?.trim();
  const modelOptions = getElementByXPath('//*[@id="rightContent"]/div[7]/div/div/div[2]/div/div/div/div')?.textContent?.trim();
  const quantityLabel = getElementByXPath('//*[@id="rightContent"]/div[8]/div[1]')?.textContent?.trim();
  const quantity = getElementByXPath('//*[@id="rightContent"]/div[8]/div[2]/div/div/input')?.value;
  
  // 获取轮播
  const images = getElementsByXPath('//*[@id="leftContent"]/div[1]/div[1]/div/div/img')
    .map(img => img.src)
    .filter(Boolean);

  // 获取商品属性
  const attributes = getElementByXPath('//*[@id="leftContent"]/div[5]/div[3]/div[1]/div')?.textContent?.trim();
  
  // 获取商品详细
  const details = getElementByXPath('//*[@id="leftContent"]/div[5]/div[5]/div/div')?.textContent?.trim();

  return {
    title,
    mainImages: images,
    details: {
      price: {
        current: price,
      },
      sales,
      modelName,
      modelOptions,
      quantity: {
        label: quantityLabel,
        value: quantity
      },
      attributes,
      description: details
    },
    productUrl: window.location.href,
    collectedAt: new Date().toISOString()
  };
}

// 初始化
function init() {
  // 创建并初始化右侧面板
  const panel = createSidePanel();
  initPanel(panel);
  initResizer(panel);

  // 创建采集按钮
  const button = createFloatingButton();
  button.addEventListener('click', () => {
    const productInfo = getProductInfo();
    chrome.runtime.sendMessage(
      { type: 'saveProduct', product: productInfo },
      (response) => {
        if (response.success) {
          displayProducts();
          showToast('收藏成功');
        }
      }
    );
  });
}

// 确保DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
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
      if (currentX < 0) { // 只允许左滑
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
      currentX = 0;
    });
    
    // 添加点击删除按钮事件
    const deleteBtn = card.querySelector('.swipe-delete');
    deleteBtn.addEventListener('click', () => {
      const index = card.dataset.index;
      deleteProduct(index);
    });
  });
}

// 删除商品
function deleteProduct(index) {
  chrome.storage.local.get(['products'], (result) => {
    const products = result.products || [];
    products.splice(index, 1);
    chrome.storage.local.set({ products }, () => {
      displayProducts();
      showToast('已删除');
    });
  });
}

// 添加轻提示函数
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }, 100);
}

// 显示商品详情
function showProductDetail(product) {
  const modal = document.getElementById('detail-modal');
  const header = modal.querySelector('.modal-header h3');
  const sliderContainer = modal.querySelector('.slider-container');
  const thumbnailList = modal.querySelector('.thumbnail-list');
  const infoContent = modal.querySelector('.info-content');
  const viewLink = modal.querySelector('.view-link');

  // 设置标题
  header.textContent = product.title;

  // 设置图片
  sliderContainer.innerHTML = product.mainImages.map(img => `
    <div class="slider-item">
      <img src="${img}" alt="${product.title}" class="zoomable-image" />
    </div>
  `).join('');

  // 设置缩略图
  thumbnailList.innerHTML = product.mainImages.map((img, index) => `
    <div class="thumbnail-item" data-index="${index}">
      <img src="${img}" alt="缩略图" />
    </div>
  `).join('');

  // 设置商品信息
  infoContent.innerHTML = `
    <div class="info-group">
      <div class="info-row">
        <span class="label">价格：</span>
        <span class="value price">${product.details.price.current}</span>
      </div>
      <div class="info-row">
        <span class="label">销量：</span>
        <span class="value">${product.details.sales}</span>
      </div>
      <div class="info-row">
        <span class="label">型号：</span>
        <span class="value">${product.details.modelName}</span>
      </div>
      <div class="info-row">
        <span class="label">库存：</span>
        <span class="value">${product.details.quantity.value}</span>
      </div>
    </div>
    <div class="info-group">
      <h4>商品属性</h4>
      <div class="attributes">${product.details.attributes}</div>
    </div>
    <div class="info-group">
      <h4>商品详情</h4>
      <div class="description">${product.details.description}</div>
    </div>
  `;

  // 设置链接
  viewLink.href = product.productUrl;

  // 显示弹窗
  modal.classList.add('show');

  // 添加图片点击放大事件
  const images = modal.querySelectorAll('.zoomable-image');
  images.forEach(img => {
    img.addEventListener('click', () => {
      img.classList.toggle('zoomed');
    });
  });

  // 添加缩略图点击事件
  const thumbnails = modal.querySelectorAll('.thumbnail-item');
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const index = thumb.dataset.index;
      sliderContainer.style.transform = `translateX(-${index * 100}%)`;
      thumbnails.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
} 