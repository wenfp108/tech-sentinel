import axios from 'axios';
import fs from 'fs';
import path from 'path';

// --- ☢️ 核爆级配置 (Nuclear Level Config) ---
const CONFIG = {
    // 1. 极速响应：只看最近 7 天的论文 (拒绝旧闻)
    LOOKBACK_DAYS: 7, 
    
    // 2. 绝对权威：影响因子必须 > 30 (只看 Nature/Science/Cell 主刊级别)
    // 普通顶会(CVPR/ICLR)通常在 10-20 左右，这里直接过滤掉，只留真神
    MIN_IMPACT_FACTOR: 30, 
    
    // 3. 病毒爆发：如果一周内引用数就能 > 15，说明是现象级神作 (如 GPT-4 发布)
    FORCE_KEEP_CITATIONS: 15, 
    
    CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'sentinel@architect.alpha' 
};

// --- 🧠 六大宗师策略 (全维度覆盖) ---
const MASTER_STRATEGIES = {
    // 1. Andreessen: 数字智能 (AI)
    ANDREESSEN: (text) => (text.match(/large language model|llm|generative|transformer|foundation model|agent|gpu|multimodal/i)) ? 'AI_CORE' : null,
    
    // 2. Darwin: 生命编码 (Bio)
    DARWIN: (text) => (text.match(/crispr|gene editing|synthetic biology|mrna|longevity|aging|immunotherapy|neuroscience|brain-computer interface/i)) ? 'BIO_REVOLUTION' : null,

    // 3. Von Braun: 星辰与利剑 (Space & Defense)
    VON_BRAUN: (text) => (text.match(/spacecraft|satellite|orbit|propulsion|hypersonic|missile|uav|drone swarm|radar|stealth|electronic warfare/i)) ? 'SPACE_DEFENSE' : null,

    // 4. Oppenheimer: 能量源泉 (Nuclear Energy)
    OPPENHEIMER: (text) => (text.match(/nuclear fusion|fission|reactor|plasma|tokamak|hydrogen fuel|smr|directed energy/i)) ? 'STRATEGIC_ENERGY' : null,

    // 5. Curie: 物质基础 (Materials)
    CURIE: (text) => (text.match(/solid-state battery|perovskite|superconductor|graphene|electrolyte|metamaterial/i)) ? 'ADVANCED_MATERIALS' : null,

    // 6. Turing: 计算基石 (Quantum & Compute)
    TURING: (text) => (text.match(/quantum computing|qubit|semiconductor|lithography|chip architecture|photonics/i)) ? 'NEXT_COMPUTING' : null,

    // 7. Graham: 范式转移 (颠覆性理论)
    GRAHAM: (text) => (text.match(/all you need|rethinking|towards a|roadmap|comprehensive|paradigm|survey/i)) ? 'PARADIGM_SHIFT' : null
};

async function run() {
    const now = new Date();
    // 北京时间
    const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const hour = bjTime.getUTCHours();
    const ampm = hour < 12 ? 'AM' : 'PM';
    const timeLabel = `${ampm}-${hour}h`; 
    const dateStr = bjTime.toISOString().split('T')[0];

    const startDate = new Date(now.getTime() - CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`☢️ Nuclear Science Sentinel [${timeLabel}] 启动核爆级侦察...`);
    console.log(`   - 窗口: 最近 ${CONFIG.LOOKBACK_DAYS} 天`);
    console.log(`   - 门槛: IF > ${CONFIG.MIN_IMPACT_FACTOR} (Nature/Science Level)`);

    // 构建查询
    const apiUrl = `https://api.openalex.org/works?filter=from_publication_date:${startDate},cited_by_count:>0&sort=cited_by_count:desc&per_page=100`;

    try {
        const { data } = await axios.get(apiUrl, {
            headers: { 'User-Agent': `mailto:${CONFIG.CONTACT_EMAIL}` }
        });

        const elitePapers = [];
        const strategyStats = {}; 

        console.log(`📥 初筛池: ${data.results.length} 篇，开始执行严酷过滤...`);

        data.results.forEach(paper => {
            const title = paper.title || "";
            const concepts = paper.concepts.map(c => c.display_name).join(" ");
            const fullText = (title + " " + concepts).toLowerCase();
            
            const citations = paper.cited_by_count;
            const venue = paper.primary_location?.source;
            const impactFactor = venue?.summary_stats?.['2yr_mean_citedness'] || 0;
            const journalName = venue?.display_name || "Unknown Venue";

            let isKeeper = false;
            let strategies = [];
            let keepReason = "";

            // 1. 基础资格审查 (Pre-Screening)
            // 如果既不是高分期刊，也不是病毒式爆款，直接 pass，连策略都不用跑
            const isHighImpact = impactFactor >= CONFIG.MIN_IMPACT_FACTOR;
            const isViral = citations >= CONFIG.FORCE_KEEP_CITATIONS;

            if (!isHighImpact && !isViral) return; 

            // 2. 大师策略审查 (Master Strategy Check)
            for (const [name, logic] of Object.entries(MASTER_STRATEGIES)) {
                const tag = logic(fullText);
                if (tag) {
                    strategies.push(tag); 
                    isKeeper = true;
                }
            }

            // 3. 最终裁决
            if (isKeeper) {
                // 如果是因为病毒式传播保留的，特别标记
                if (isViral) keepReason = `🔥 VIRAL BREAKOUT (${citations} citations in 1 week)`;
                else keepReason = `🏆 TOP JOURNAL (${journalName} IF:${impactFactor.toFixed(1)})`;

                strategies.forEach(t => strategyStats[t] = (strategyStats[t] || 0) + 1);

                elitePapers.push({
                    title: title,
                    journal: journalName,
                    metrics: {
                        citations: citations,
                        impact_factor: impactFactor.toFixed(1)
                    },
                    strategies: strategies,
                    concepts: paper.concepts.filter(c => c.level >= 2).map(c => c.display_name).slice(0, 3),
                    url: paper.open_access?.oa_url || paper.doi,
                    reason: keepReason
                });
            }
        });

        // 落盘保存
        if (elitePapers.length > 0) {
            const filePath = `data/papers/${dateStr}/sentinel-${timeLabel}.json`;
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const fileContent = {
                meta: {
                    scanned_at_bj: bjTime.toISOString(),
                    session: ampm,
                    total_kept: elitePapers.length, // 实际保留数量
                    mode: "NUCLEAR_ONLY",
                    strategy_summary: strategyStats 
                },
                // ✂️ 最终截断：只取前 5 名。这就是你要的“核爆级”。
                // 如果今天有 6 个核爆级？对不起，第 6 个不够强，扔掉。
                items: elitePapers.slice(0, 5) 
            };

            fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));
            console.log(`✅ [Nuclear Report] 报告已生成: ${filePath}`);
            console.log(`🔥 仅收录 Top ${fileContent.items.length} (From ${elitePapers.length} candidates)`);
        } else {
            console.log("☕️ 今日无核爆级进展 (No Nature/Science level breakthroughs).");
        }

    } catch (error) {
        console.error("❌ 探测失败:", error.message);
        if (error.response) console.error(error.response.data);
    }
}

run();
