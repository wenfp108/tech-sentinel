# 🛰️  GitHub Sentinel

> **"Filtering the world's code to find the 1% of true innovation."**

四号机是一个高信噪比的全球代码侦察单元，专门监控 GitHub 上的新进项目与爆发趋势。它不记录平庸的搬运，只捕捉能够改变技术范式的“精英代码”。

---

## 🧠 核心策略：四大科技之神 (The Tech Masters)

系统通过以下四种截然不同的硬核视角，对全球代码进行打标与筛选：

| 大师视角 | 代号 | 侦察目标 (Keywords) | 决策逻辑 |
| --- | --- | --- | --- |
| **ANDREESSEN** | **科技加速** | `agi`, `llm`, `cuda`, `vlm`, `weights` | 关注 AGI 基础设施、模型重工业及推理算力加速。 |
| **TORVALDS** | **硬核务实** | `rust`, `zig`, `kernel`, `performance` | 关注高性能底层语言、系统级优化及“不玩虚的”实用工程。 |
| **NAVAL** | **代码杠杆** | `agent`, `protocol`, `autonomous`, `sdk` | 识别能赋予个人极大生产力的“无许可”智能体与协议工具。 |
| **GRAHAM** | **范式转移** | `alternative to`, `new way`, `reimagining` | 捕捉那些试图重新定义现有问题、具备黑马潜质的早期创新。 |

---

## 🛡️ 侦察机制：全量统计，精英入库

为了保持数据库的极度纯净，四号机执行以下过滤决策：

1. **精英准入制**：只有命中上述四大策略之一的项目，才会保留完整详情（Name, Desc, Stars, URL）。
2. **终极保险 (FORCE_KEEP)**：若项目在 24 小时内获得极高关注（Star > 200），即便未命中关键词，也会以 `VIRAL_GIANT` 标签强制入库，防止新物种漏网。
3. **噪音隔离**：所有的“人才成长类”（如技能表、面试题）仅在 `trend_summary` 中记录数量，详情不予存档，以防污染技术库。

---

## 📊 运行标准与时效

* **侦察节拍**：每 12 小时巡逻一次，对齐北京时间早晚 8 点。
* **存档命名**：`data/tech/YYYY-MM-DD/sentinel-AM-8h.json`。
* **资源占用**：单次扫描耗时约 ****，每月 GitHub Actions 费用为 ****。

---

## 📂 数据样板 (Data Snippet)

```json
{
  "meta": {
    "scanned_at_bj": "2026-01-28T20:00:00Z",
    "trend_summary": {
      "TECH_ACCELERATOR": 4, // 发现4个硬核加速项目
      "TALENT_GROWTH": 25,   // 发现25个人才流向噪音
      "VIRAL_GIANT": 1        // 捕获1个不明高热度巨物
    }
  },
  "items": [
    { "name": "deepseek-ai/...", "tags": ["TECH_ACCELERATOR"], "reason": "STRATEGY" }
  ]
}

```

