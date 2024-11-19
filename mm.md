# Temu前端一键搬家 - 产品开发文档

## 1. 产品概述
一款用于快速采集Temu商品信息的Chrome浏览器插件，支持一键保存商品信息并在右侧面板中管理收藏。

## 2. 功能特性
### 2.1 核心功能
- 一键采集商品信息
- 右侧常驻收藏夹面板
- 商品详情查看
- 图片批量下载
- 商品信息更新检测
- 右滑删除收藏

### 2.2 数据采集项
- 商品标题
- 商品价格
- 销量信息
- 型号信息（多层级）
- 商品图片
- 商品属性
- 商品描述

### 2.3 UI/UX设计
- 苹果风格UI
- 圆角设计
- 简洁布局
- 流畅动画
- 响应式交互

## 3. 技术架构
### 3.1 核心组件
- content.js: 内容脚本，负责数据采集和UI渲染
- content.css: 样式文件
- background.js: 后台服务
- manifest.json: 插件配置文件

### 3.2 数据结构
```javascript
{
  title: String,          // 商品标题
  productUrl: String,     // 商品链接
  mainImages: Array,      // 商品图片
  collectedAt: String,    // 采集时间
  details: {
    price: {
      current: String     // 当前价格
    },
    sales: String,        // 销量
    modelInfo: {          // 型号信息
      [key: String]: Array<String>  // 键值对形式存储型号信息
    },
    attributes: String,   // 商品属性
    description: String   // 商品描述
  }
}
```

### 3.3 XPath定位
```javascript
// 标题
'//*[@id="rightContent"]/div[2]/div[1]/div/div/text()'

// 销量（三部分）
'//*[@id="rightContent"]/div[3]/div[1]/div/span/text()[1]' // 货币符号
'//*[@id="rightContent"]/div[3]/div[1]/div/span/text()[2]' // 整数部分
'//*[@id="rightContent"]/div[3]/div[1]/div/span/text()[3]' // 小数部分

// 价格（三部分）
'//*[@id="goods_price"]/div[1]/div/span[1]/text()' // 货币符号
'//*[@id="goods_price"]/div[1]/div/span[2]/text()' // 整数部分
'//*[@id="goods_price"]/div[1]/div/span[3]/text()' // 小数部分

// 型号信息
'._3csHYvw1' // class选择器

// 商品图片
'//*[@id="leftContent"]/div[1]/div[1]/div/div/img'

// 商品属性
'//*[@id="leftContent"]/div[5]/div[3]/div[1]/div'

// 商品详情
'//*[@id="leftContent"]/div[5]/div[5]/div/div'
```

## 4. 开发注意事项
### 4.1 型号信息处理
- 获取 ._3csHYvw1 下所有div元素的文本
- 根据冒号(:)分割文本获取键值对
- 同一个键可能对应多个值
- 保持键值对的层级关系
- 处理特殊字符和换行

### 4.2 图片处理
- 处理图片URL，移除.jpg后的参数
- 支持jpg、jpeg、png、webp等格式
- 处理动态加载的图片
- 使用MutationObserver监听图片加载
- 设置超时机制避免无限等待

### 4.3 数据存储
- 使用chrome.storage.local存储数据
- 检查重复数据（基于标题和型号）
- 支持数据更新
- 提供更新确认机制
- 保持数据一致性

### 4.4 UI交互
- 支持面板宽度调整
- 支持面板展开/收起
- 支持图片预览和放大
- 支持批量下载图片
- 提供操作反馈提示

## 5. 错误处理
### 5.1 数据采集
- 处理缺失数据
- 处理格式异常
- 处理动态加载失败
- 提供默认值
- 错误提示

### 5.2 图片处理
- 处理加载失败
- 处理格式不支持
- 处理下载失败
- 批量下载限制
- 超时处理

### 5.3 存储操作
- 处理存储失败
- 处理数据冲突
- 处理配额超限
- 数据备份机制
- 恢复机制

## 6. 性能优化
### 6.1 DOM操作
- 减少DOM查询
- 使用事件委托
- 批量更新DOM
- 使用DocumentFragment
- 避免重排重绘

### 6.2 资源加载
- 延迟加载
- 资源预加载
- 图片懒加载
- 缓存机制
- 压缩资源

### 6.3 事件处理
- 使用防抖
- 使用节流
- 优化事件监听
- 及时移除监听
- 避免内存泄漏

## 7. 后续优化方向
- [ ] 支持批量采集
- [ ] 数据导出功能
- [ ] 价格变动监控
- [ ] 库存提醒功能
- [ ] 分类管理功能
- [ ] 搜索筛选功能
- [ ] 数据同步功能
- [ ] 快捷键支持
- [ ] 自定义采集项
- [ ] 数据分析功能

## 8. 更新日志
### v1.0.0 (2024-03-xx)
- 实现基础采集功能
- 完成右侧面板开发
- 支持商品信息更新
- 实现图片批量下载
- 添加右滑删除功能
- 优化型号信息处理
- 改进UI交互体验
