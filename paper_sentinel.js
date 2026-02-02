import axios from 'axios';
import fs from 'fs';
import path from 'path';

// --- 📡 前哨雷达配置 (Frontline Radar) ---
const CONFIG = {
    LOOKBACK_DAYS: 7, // 👈 测试完记得改回 7
    MIN_IMPACT_FACTOR: 20, 
    MIN_EARLY_CITATIONS: 1, 
    CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'sentinel@architect.alpha' 
};

// --- 🏆 顶级期刊白名单 (OpenAlex ID) ---
// ⚠️ 注意：这里使用大写 S，匹配 OpenAlex 标准
// Nature(S137773), Science(S198393), Cell(S54687), PNAS(S146577)
const ELITE_IDS = ["S137773", "S198393", "S54687", "S146577"];
const ELITE_JOURNALS_QUERY = ELITE_IDS.join("|");

// --- 🧠 六大宗师策略 (保持不变) ---
const MASTER_STRATEGIES = {
    ANDREESSEN: (text) => (text.match(/large language model|llm|generative|transformer|agent|gpu|multimodal|diffusion|reasoning/i)) ? 'AI_CORE' : null,
    DARWIN: (text) => (text.match(/crispr|gene|synthetic biology|mrna|longevity|brain-computer|organoid|protein|biomanufacturing/i)) ? 'BIO_REVOLUTION' : null,
    VON_BRAUN: (text) => (text.match(/spacecraft|satellite|orbit|propulsion|hypersonic|missile|uav|swarm|radar|stealth|electronic warfare/i)) ? 'SPACE_DEFENSE' : null,
    OPPENHEIMER: (text) => (text.match(/nuclear fusion|fission|plasma|tokamak|hydrogen|smr|directed energy|grid/i)) ? 'STRATEGIC_ENERGY' : null,
    CURIE: (text) => (text.match(/solid-state battery|perovskite|superconductor|graphene|electrolyte|metamaterial|nanomaterial/i)) ? 'ADVANCED_MATERIALS' : null,
    TURING: (text) => (text.match(/quantum|qubit|semiconductor|chip|photonic|neuromorphic|cryptography/i)) ? 'NEXT_COMPUTING' : null,
    GRAHAM: (text) => (text.match(/all you need|rethinking|towards a|roadmap|paradigm|survey/i)) ? 'PARADIGM_SHIFT' : null
};

async function run() {
    const now = new Date();
    const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const hour = bjTime.getUTCHours();
    const ampm = hour < 12 ? 'AM' : 'PM';
    const timeLabel = `${ampm}-${hour}h`; 
    const dateStr = bjTime.toISOString().split('T')[0];

    const startDate = new Date(now.getTime() - CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`📡 Frontline Radar [${timeLabel}] 启动前哨侦察...`);
    console.log(`   - 模式: 双轨制 (信任白名单 + 早期高热信号)`);
    console.log(`   - 范围: ${startDate} 至今`);

    // 🕸️ 热度网 (Hot Net)
    const hotUrl = `https://api.openalex.org/works?filter=from_publication_date:${startDate},cited_by_count:>${CONFIG.MIN_EARLY_CITATIONS - 1},type:article|review|preprint&sort=cited_by_count:desc&per_page=50`;

    // 🕸️ 名门网 (Prestige Net)
    const nuclearUrl = `https://api.openalex.org/works?filter=from_publication_date:${startDate},primary_location.source.id:${ELITE_JOURNALS_QUERY},type:article|review&sort=publication_date:desc&per_page=20`;

    try {
        console.log("⚡ 发起双轨探测...");
        const [hotRes, nuclearRes] = await Promise.all([
            axios.get(hotUrl, { headers: { 'User-Agent': `mailto:${CONFIG.CONTACT_EMAIL}` } }),
            axios.get(nuclearUrl, { headers: { 'User-Agent': `mailto:${CONFIG.CONTACT_EMAIL}` } })
        ]);

        const rawPapers = [...hotRes.data.results, ...nuclearRes.data.results];
        const uniqueMap = new Map();
        rawPapers.forEach(item => {
            if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
        });
        const uniquePapers = Array.from(uniqueMap.values());

        const elitePapers = [];
        const conceptHeatmap = {}; 
        const strategyStats = {}; 

        console.log(`📥 混合扫描池: ${uniquePapers.length} 篇 (去重后)，开始筛选...`);

        uniquePapers.forEach(paper => {
            const title = paper.title || "";
            const concepts = paper.concepts ? paper.concepts.map(c => c.display_name).join(" ") : "";
            const fullText = (title + " " + concepts).toLowerCase();
            
            const citations = paper.cited_by_count;
            const venue = paper.primary_location?.source;
            // ⚠️ 这里的 impactFactor 可能是 0，不能完全依赖它
            const impactFactor = venue?.summary_stats?.['2yr_mean_citedness'] || 0;
            const journalName = venue?.display_name || "ArXiv/Preprint"; 
            const journalId = venue?.id || ""; // e.g., "https://openalex.org/S137773"

            let isKeeper = false;
            let strategies = [];
            let keepReason = "";
            let signalType = "";

            // 🔥🔥 核心修复：直接检查 ID 是否在白名单中 🔥🔥
            // 只要 ID 对上了，不管 IF 是多少，直接通过！
            const isEliteJournal = ELITE_IDS.some(id => journalId.includes(id));

            // --- 策略 A: 核爆级 (Nuclear) ---
            if (isEliteJournal || impactFactor >= CONFIG.MIN_IMPACT_FACTOR) {
                isKeeper = true;
                signalType = "☢️ NUCLEAR";
                keepReason = `Elite Journal (${journalName})`;
            }

            // --- 策略 B: 早期信号 (Early Signal) ---
            if (!isKeeper && citations >= CONFIG.MIN_EARLY_CITATIONS) {
                for (const [name, logic] of Object.entries(MASTER_STRATEGIES)) {
                    if (logic(fullText)) {
                        isKeeper = true;
                        signalType = "⚡ EARLY_SIGNAL";
                        keepReason = `Velocity: ${citations} citations`;
                        break;
                    }
                }
            }

            if (isKeeper) {
                // 跑一遍策略打标签
                for (const [name, logic] of Object.entries(MASTER_STRATEGIES)) {
                    const tag = logic(fullText);
                    if (tag) {
                        strategies.push(tag);
                        strategyStats[tag] = (strategyStats[tag] || 0) + 1;
                    }
                }
                
                // 核爆级如果没有策略标签，强制标记为 SCIENCE_CORE
                if (strategies.length === 0) {
                    strategies.push(signalType.includes("NUCLEAR") ? "SCIENCE_CORE" : "GENERAL_SCIENCE");
                }

                if (paper.concepts) {
                    paper.concepts.filter(c => c.level === 2 || c.level === 3).forEach(c => {
                        const score = citations + 1; 
                        conceptHeatmap[c.display_name] = (conceptHeatmap[c.display_name] || 0) + score;
                    });
                }

                elitePapers.push({
                    title: title,
                    type: signalType,
                    journal: journalName,
                    metrics: {
                        citations: citations,
                        impact_factor: impactFactor.toFixed(1) // 仅作展示，不参与逻辑
                    },
                    strategies: strategies,
                    url: paper.open_access?.oa_url || paper.doi,
                    reason: keepReason,
                    publication_date: paper.publication_date 
                });
            }
        });

        // 排序：Nuclear 永远置顶
        elitePapers.sort((a, b) => {
            if (a.type.includes("NUCLEAR") && !b.type.includes("NUCLEAR")) return -1;
            if (!a.type.includes("NUCLEAR") && b.type.includes("NUCLEAR")) return 1;
            return b.metrics.citations - a.metrics.citations;
        });

        const trendingConcepts = Object.entries(conceptHeatmap)
            .sort((a, b) => b[1] - a[1]).slice(0, 5)
            .map(([name, score]) => `${name} (Heat:${score})`);

        if (elitePapers.length > 0) {
            const filePath = `data/papers/${dateStr}/radar-${timeLabel}.json`;
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const fileContent = {
                meta: {
                    scanned_at_bj: bjTime.toISOString(),
                    total_captured: elitePapers.length,
                    TRENDING_DIRECTIONS: trendingConcepts, 
                    strategy_summary: strategyStats
                },
                items: elitePapers.slice(0, 20) 
            };

            fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));
            console.log(`✅ [Radar] 报告生成完毕: ${filePath}`);
            console.log(`📊 统计: ${elitePapers.length} 篇 (Nuclear: ${elitePapers.filter(e=>e.type.includes("NUCLEAR")).length})`);
        } else {
            console.log("💤 今日雷达静默。");
        }

    } catch (error) {
        console.error("❌ 探测失败:", error.message);
    }
}

run();
