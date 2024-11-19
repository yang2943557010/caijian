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
    const priceCurrency = getElementByXPath('//*[@id="goods_price"]/div[1]/div/span[1]/text()')?.textContent?.trim() || '';
    const priceInteger = getElementByXPath('//*[@id="goods_price"]/div[1]/div/span[2]/text()')?.textContent?.trim() || '';
    const priceDecimal = getElementByXPath('//*[@id="goods_price"]/div[1]/div/span[3]/text()')?.textContent?.trim() || '';
    const price = `${priceCurrency}${priceInteger}${priceDecimal}`;
    
    // 获取型号信息
    const modelInfoDiv = document.querySelector('._3csHYvw1');
    const modelInfo = {};
    
    if (modelInfoDiv) {
      // 获取所有div元素
      const modelDivs = Array.from(modelInfoDiv.children);
      
      // 当前的key
      let currentKey = null;
      
      modelDivs.forEach(div => {
        const text = div.textContent.trim();
        
        // 如果文本包含冒号，说明这是一个新的key
        if (text.includes(':')) {
          const [key, value] = text.split(':').map(t => t.trim());
          currentKey = key;
          if (!modelInfo[currentKey]) {
            modelInfo[currentKey] = [];
          }
          if (value) {
            modelInfo[currentKey].push(value);
          }
        } 
        // 如果没有冒号，且有currentKey，说明这是前一个key的值
        else if (currentKey && text) {
          modelInfo[currentKey].push(text);
        }
      });
    }
  
    // 获取型号选项
    const modelOptions = getElementByXPath('//*[@id="rightContent"]/div[7]/div/div/div[2]/div/div/div/div')?.textContent?.trim();
    const quantityLabel = getElementByXPath('//*[@id="rightContent"]/div[8]/div[1]')?.textContent?.trim();
    const quantity = getElementByXPath('//*[@id="rightContent"]/div[8]/div[2]/div/div/input')?.value;
    
    // 获取轮播图，尝试多个可能的XPath
    const imageXPaths = [
      '//*[@id="leftContent"]/div[1]/div[1]/div/div/img',  // 原始XPath
      '//*[@id="leftContent"]//div[contains(@class, "slider")]//img',  // 更通用的选择器
      '//div[contains(@class, "product-images")]//img',  // 备用选择器
    ];
  
    let images = [];
    for (const xpath of imageXPaths) {
      const imgElements = getElementsByXPath(xpath);
      if (imgElements.length > 0) {
        // 找到图片后处理URL
        images = imgElements
          .map(img => {
            // 获取原始src和data-src属性
            const originalSrc = img.src || img.getAttribute('data-src');
            if (!originalSrc) return null;
  
            // 处理URL
            const match = originalSrc.match(/(.*?\.jpg)/i); // 添加i标志使匹配不区分大小写
            if (match) return match[1];
  
            // 如果没有.jpg，尝试其他格式
            const otherFormats = originalSrc.match(/(.*?\.(jpeg|png|webp))/i);
            return otherFormats ? otherFormats[1] : null;
          })
          .filter(Boolean) // 过滤掉null值
          .filter((url, index, self) => self.indexOf(url) === index); // 去重
  
        if (images.length > 0) break; // 如果找到图片就跳出循环
      }
    }
  
    // 如果还是没有找到图片，尝试使用MutationObserver监听动态加载的图片
    if (images.length === 0) {
      const imageContainer = document.querySelector('#leftContent') || document.body;
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            const newImages = Array.from(mutation.target.querySelectorAll('img'))
              .map(img => {
                const src = img.src || img.getAttribute('data-src');
                if (!src) return null;
                const match = src.match(/(.*?\.jpg)/i);
                return match ? match[1] : null;
              })
              .filter(Boolean)
              .filter((url, index, self) => self.indexOf(url) === index);
  
            if (newImages.length > 0) {
              images = [...new Set([...images, ...newImages])]; // 合并并去重
              observer.disconnect(); // 找到图片停止观察
              break;
            }
          }
        }
      });
  
      observer.observe(imageContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'data-src']
      });
  
      // 设置超时，防止无限等待
      setTimeout(() => observer.disconnect(), 5000);
    }
  
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
        modelInfo, // 更新后的型号信息
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
    if (!modal) {
      // 如果modal不存在，创建一个新的
      createDetailModal();
      return showProductDetail(product); // 递归调用
    }
  
    const header = modal.querySelector('.modal-header h3');
    
    // 处理图片URL
    const processedImages = product.mainImages.map(url => {
      const match = url.match(/(.*?\.jpg)/i);
      return match ? match[1] : url;
    });
  
    // 设置标题
    header.textContent = product.title;
  
    // 设置图片展示区域
    const imageSection = modal.querySelector('.image-section');
    imageSection.innerHTML = `
      <div class="image-slider">
        <div class="slider-container">
          ${processedImages.map(img => `
            <div class="slider-item">
              <img src="${img}" alt="${product.title}" class="zoomable-image" />
              <button class="download-single-btn" data-url="${img}">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>
        <div class="slider-nav">
          <button class="nav-prev">&lt;</button>
          <button class="nav-next">&gt;</button>
        </div>
      </div>
      <div class="thumbnail-list">
        ${processedImages.map((img, index) => `
          <div class="thumbnail-item${index === 0 ? ' active' : ''}" data-index="${index}">
            <img src="${img}" alt="缩略图" />
          </div>
        `).join('')}
      </div>
    `;
  
    // 修改型号显示部分
    const modelInfoHtml = Object.entries(product.details.modelInfo || {})
      .map(([key, values]) => `
        <div class="model-group">
          <div class="model-key">${key}</div>
          <div class="model-values">
            ${values.map(value => `
              <span class="model-value">${value}</span>
            `).join('')}
          </div>
        </div>
      `).join('');
  
    // 设置信息区域
    const infoSection = modal.querySelector('.info-section');
    infoSection.innerHTML = `
      <div class="info-content">
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
            <span class="label">型号信息：</span>
          </div>
          <div class="model-info">
            ${modelInfoHtml}
          </div>
        </div>
        <div class="info-group">
          <h4>商品属性</h4>
          <div class="attributes">${product.details.attributes || '暂无'}</div>
        </div>
        <div class="info-group">
          <h4>商品详情</h4>
          <div class="description">${product.details.description || '暂无'}</div>
        </div>
      </div>
      <div class="info-actions">
        <a class="view-link" href="${product.productUrl}" target="_blank">查看商品页面</a>
        <button class="download-all-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          下载全部图片
        </button>
      </div>
    `;
  
    // 添加事件监听器
    addModalEventListeners(modal, processedImages, product);
  
    // 显示弹窗
    modal.classList.add('show');
  }
  
  // 创建详情弹窗
  function createDetailModal() {
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
            <div class="image-section"></div>
            <div class="info-section"></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加关闭按钮事件
    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.classList.remove('show');
    });
  }
  
  // 添加弹窗事件监听器
  function addModalEventListeners(modal, processedImages, product) {
    // 图片切换事件
    const thumbnails = modal.querySelectorAll('.thumbnail-item');
    const sliderContainer = modal.querySelector('.slider-container');
    let currentIndex = 0;
  
    thumbnails.forEach(thumb => {
      thumb.addEventListener('click', () => {
        currentIndex = parseInt(thumb.dataset.index);
        updateSlider();
      });
    });
  
    // 导航按钮事件
    const prevBtn = modal.querySelector('.nav-prev');
    const nextBtn = modal.querySelector('.nav-next');
  
    prevBtn.addEventListener('click', () => {
      currentIndex = Math.max(0, currentIndex - 1);
      updateSlider();
    });
  
    nextBtn.addEventListener('click', () => {
      currentIndex = Math.min(processedImages.length - 1, currentIndex + 1);
      updateSlider();
    });
  
    function updateSlider() {
      sliderContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
      thumbnails.forEach((t, i) => {
        t.classList.toggle('active', i === currentIndex);
      });
    }
  
    // 下载按钮事件
    const downloadAllBtn = modal.querySelector('.download-all-btn');
    downloadAllBtn.addEventListener('click', () => {
      downloadImages(processedImages, product.title);
    });
  
    const downloadSingleBtns = modal.querySelectorAll('.download-single-btn');
    downloadSingleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.dataset.url;
        downloadSingleImage(url, product.title);
      });
    });
  
    // 图片放大事件
    const images = modal.querySelectorAll('.zoomable-image');
    images.forEach(img => {
      img.addEventListener('click', () => {
        img.classList.toggle('zoomed');
      });
    });
  }
  
  // 添加下载单张图片的函数
  async function downloadSingleImage(url, productTitle) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = `${productTitle}_${Date.now()}.jpg`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      showToast('图片下载成功');
    } catch (error) {
      showToast('图片下载失败');
    }
  }
  
  // 添加批量下载图片的函数
  async function downloadImages(urls, productTitle) {
    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const response = await fetch(url);
        const blob = await response.blob();
        const filename = `${productTitle}_${i + 1}.jpg`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        // 添加延迟，避免浏览器阻止多次下载
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      showToast('所有图片下载完成');
    } catch (error) {
      showToast('部分图片下载失败');
    }
  }
  
  // 修改保存商品的逻辑，使用标题和型号来判断重复
  function saveProduct(productInfo) {
    chrome.storage.local.get(['products'], (result) => {
      const products = result.products || [];
      
      // 检查是否存在相同标题和型号的商品
      const existingIndex = products.findIndex(p => {
        // 比较标题
        const isSameTitle = p.title === productInfo.title;
        // 比较型号（如果有的话）
        const isSameModel = JSON.stringify(p.details.modelInfo) === JSON.stringify(productInfo.details.modelInfo);
        return isSameTitle && isSameModel;
      });
      
      if (existingIndex !== -1) {
        const existing = products[existingIndex];
        // 比较其他内容是否有变化
        const existingCopy = { ...existing };
        const newCopy = { ...productInfo };
        delete existingCopy.collectedAt;
        delete newCopy.collectedAt;
        
        if (JSON.stringify(existingCopy) === JSON.stringify(newCopy)) {
          showToast('已有相同采集数据');
        } else {
          showUpdateConfirmDialog(productInfo, existing, existingIndex, products);
        }
      } else {
        // 不存在相同商品，直接保存
        products.push(productInfo);
        chrome.storage.local.set({ products }, () => {
          showToast('收藏成功');
          displayProducts();
        });
      }
    });
  }
  
  // 添加更新确认对话框
  function showUpdateConfirmDialog(newProduct, oldProduct, index, products) {
    const dialog = document.createElement('div');
    dialog.className = 'update-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>发现已采集数据</h3>
        <div class="dialog-body">
          <p>该商品已存在采集记录，是否更新内容？</p>
          <div class="changes">
            <div class="change-item">
              <h4>价格变化：</h4>
              <p class="old">原价格：${oldProduct.details.price.current}</p>
              <p class="new">新价格：${newProduct.details.price.current}</p>
            </div>
            <div class="change-item">
              <h4>销量变化：</h4>
              <p class="old">原销量：${oldProduct.details.sales}</p>
              <p class="new">新销量：${newProduct.details.sales}</p>
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn">取消</button>
          <button class="update-btn">更新</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 添加按钮事件
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const updateBtn = dialog.querySelector('.update-btn');
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    updateBtn.addEventListener('click', () => {
      products[index] = newProduct;
      chrome.storage.local.set({ products }, () => {
        showToast('更新成功');
        displayProducts();
        document.body.removeChild(dialog);
      });
    });
  } 
  