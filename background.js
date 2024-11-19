// 后台服务脚本
chrome.runtime.onInstalled.addListener(() => {
  console.log('插件已安装');
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'saveProduct') {
    chrome.storage.local.get(['products'], (result) => {
      const products = result.products || [];
      products.push(request.product);
      chrome.storage.local.set({ products }, () => {
        sendResponse({ success: true });
      });
    });
    return true; // 保持消息通道打开
  }
}); 