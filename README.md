# 🎯 Grid World - 強化學習

[![Live Demo](https://img.shields.io/badge/Demo-Live_Website-success?style=for-the-badge&logo=github)](https://pcchou102.github.io/GridWorld/)

這是一個基於網格地圖的強化學習 (Reinforcement Learning) 互動式展示專案。此專案展示了從隨機策略、策略評估 (Policy Evaluation)，到價值迭代 (Value Iteration) 尋找最佳路徑的視覺化過程。

> **🔗 [Demo-https://pcchou102.github.io/GridWorld/](https://pcchou102.github.io/GridWorld/)**

---

## 🌟 功能特色 (Homework 1 規格)

* **🗺️ 互動式網格地圖開發 (HW1-1)**
  * 可自由指定大小從 **5×5 到 9×9** 的網格地圖。
  * **順序式自動設定**：第一點設定為「**起點**」(Pulse發光綠色)，第二點設定為「**終點**」(Pulse發光紅色)，接著點擊即可放置「**障礙物**」(最多允許 `n-2` 個)。
  * **手動模式切換**：如果您點錯了，可以點擊上方的按鈕強制切換，或是重複點擊方格來取消並重新設定。
  * Grid Cell 增加左上角編號，方便判斷網格。
  
* **📊 策略顯示與價值評估 (HW1-2)**
  * **隨機策略 (Random Policy)**：一鍵為所有空白方格隨機生成行動箭頭（↑↓←→）。
  * **策略評估 (Policy Evaluation)**：使用迭代演算法推導並評估 $V(s)$，動態顯示各狀態的數值。不同數值將會以顏色熱力圖 (Heatmap) 自動渲染。

* **🚀 價值迭代推導最佳策略 (HW1-3)**
  * **價值迭代 (Value Iteration)**：執行價值迭代演算法來找出最佳行動策略 $\pi^*(s)$ 與它的價值 $V^*(s)$。
  * **視覺化路徑更新**：找到的最佳化箭頭會直接覆蓋原有的隨機箭頭，並以「橘色高亮標記」，直觀顯示智慧體如何避開障礙物找到最短路徑！

---

## 👨‍💻 技術細節與啟動

* **前端介面 (Pure Frontend)**: HTML5 + Vanilla JS + CSS3
* **靜態化運行 (Serverless)**: 所有的 RL Engine (包含 Policy Evaluation / Value Iteration) 都被移植到了 `app.js` 以客戶端運算，代表**不需要任何後端架構**即可執行。
* **介面美學 (Aesthetics)**: 暗黑質感風格 (Dark Mode)，實踐 Glassmorphism 與 Gradient 高階樣式。 

### ▶️ 在本地端運行
由於沒有後端束縛，非常輕量級：
```bash
git clone https://github.com/pcchou102/GridWorld.git
cd GridWorld
```
接著，在資料夾裡面直接用瀏覽器打開 `index.html` 就可以立即開始使用了！
