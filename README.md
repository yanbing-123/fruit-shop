# 🍎 小型水果购买系统 (fruit-shop)

基于 HTML5 + CSS3 + Vanilla JS 的纯前端水果商品展示与购物系统。

## 功能特性

- 🍎 **6种水果**：苹果/橙子/葡萄/香蕉/草莓/西瓜
- 🛒 **购物车**：侧边抽屉、+/-数量、删除商品、清空购物车、实时总价、角标计数
- 💾 **数据持久化**：localStorage 独立存储 `fruit_stock` + `fruit_cart`
- 📦 **结算功能**：姓名/手机/地址表单验证 + 订单成功页（时间戳订单号）
- 🔒 **三层防超卖**：`addToCart()` / `updateQuantity()` / `submitOrder()` 全库存校验
- 📱 **响应式设计**：手机双列 / 平板双列 / PC三列自适应

## 商品列表

| 商品 | 单价 | emoji | 初始库存 |
|------|------|-------|---------|
| 苹果 | ¥5.00 | 🍎 | 100 |
| 橙子 | ¥4.00 | 🍊 | 80 |
| 葡萄 | ¥12.00 | 🍇 | 50 |
| 香蕉 | ¥3.00 | 🍌 | 120 |
| 草莓 | ¥15.00 | 🍓 | 60 |
| 西瓜 | ¥8.00 | 🍉 | 40 |

## 项目结构

```
fruit-shop/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## 本地运行

直接在浏览器中打开 `index.html` 即可运行，无需任何构建工具或服务器。

## 技术栈

- HTML5
- CSS3（Flexbox + Grid + CSS Variables + 绿色清新主题）
- Vanilla JavaScript（ES6+）
- localStorage API

## License

MIT
