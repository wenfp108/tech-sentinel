import fs from 'fs';
import path from 'path';
import process from 'process';

async function archiveGitData() {
    const ROOT = process.cwd();
    const LOCAL_DATA = path.resolve(ROOT, 'data');
    const BANK_ROOT = path.resolve(ROOT, 'central_bank');

    console.log(`📅 启动收割程序...`);

    const targets = [
        { local: 'tech', bank: 'github/tech' },
        { local: 'papers', bank: 'papers/global' }
    ];

    let totalCopied = 0;
    let totalFailed = 0;

    targets.forEach(t => {
        const localCategoryPath = path.join(LOCAL_DATA, t.local);
        const bankCategoryPath = path.join(BANK_ROOT, t.bank);

        if (fs.existsSync(localCategoryPath)) {
            const dateFolders = fs.readdirSync(localCategoryPath).filter(f => {
                const fullPath = path.join(localCategoryPath, f);
                return fs.statSync(fullPath).isDirectory();
            });

            dateFolders.forEach(dateFolder => {
                const sourcePath = path.join(localCategoryPath, dateFolder);
                // 解析 YYYY-MM-DD 为层级目录
                const [y, m, d] = dateFolder.split('-');
                const targetPath = (y && m && d)
                    ? path.join(bankCategoryPath, y, m, d)
                    : path.join(bankCategoryPath, dateFolder);

                const files = fs.readdirSync(sourcePath).filter(f => f.endsWith('.json'));

                if (files.length > 0) {
                    if (!fs.existsSync(targetPath)) {
                        fs.mkdirSync(targetPath, { recursive: true });
                    }

                    files.forEach(file => {
                        const srcFile = path.join(sourcePath, file);
                        const destFile = path.join(targetPath, file);
                        try {
                            fs.copyFileSync(srcFile, destFile);
                            const srcSize = fs.statSync(srcFile).size;
                            const destSize = fs.statSync(destFile).size;
                            if (srcSize !== destSize) {
                                console.error(`❌ [${t.local}/${dateFolder}] 校验失败: ${file} (src=${srcSize}, dest=${destSize})`);
                                totalFailed++;
                            } else {
                                console.log(`✅ [${t.local}/${dateFolder}] 已搬运: ${file} (${srcSize} bytes)`);
                                totalCopied++;
                            }
                        } catch (err) {
                            console.error(`❌ [${t.local}/${dateFolder}] 搬运失败: ${file} - ${err.message}`);
                            totalFailed++;
                        }
                    });
                }
            });
        }
    });

    if (totalFailed > 0) {
        console.error(`🛑 检测到 ${totalFailed} 个文件搬运失败，跳过清理以保护数据！`);
        return;
    }

    if (totalCopied === 0) {
        console.log("💤 今日无数据需要搬运，跳过清理。");
        return;
    }

    console.log(`🔥 全部 ${totalCopied} 个文件搬运验证通过，执行本地清理...`);
    if (fs.existsSync(LOCAL_DATA)) {
        const items = fs.readdirSync(LOCAL_DATA);
        items.forEach(item => {
            if (item.startsWith('.git')) return;
            const itemPath = path.join(LOCAL_DATA, item);
            try {
                fs.rmSync(itemPath, { recursive: true, force: true });
                console.log(`🗑️ 已清理: ${item}`);
            } catch (err) {
                console.error(`❌ 清理失败 ${item}: ${err.message}`);
            }
        });
    }
}

archiveGitData().catch(console.error);
