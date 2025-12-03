document.addEventListener('DOMContentLoaded', function () {
    /*------------------ 入场动画控制 -----------------*/
    let isEntryCompleted = false;

    function completeEntryAnimation() {
        if (isEntryCompleted) return;
        isEntryCompleted = true;

        const welcome = document.querySelector('.welcome');
        if (!welcome) {
            unlockScroll();
            return;
        }

        setTimeout(() => {
            welcome.style.opacity = '0';
            unlockScroll();
            setTimeout(() => {
                welcome.style.display = 'none';
                const currentScrollY = window.scrollY || document.documentElement.scrollTop;

                if (currentScrollY <= 200) {
                    window.scrollTo({ top: 600, behavior: 'smooth' });
                    console.log("自动下滑");
                } else {
                    console.log("取消自动下滑");
                }
            }, 2000);
        }, 500);
    }
    /*------------------ 入场动画控制 -----------------*/


    /*------------------ 入场加载调试 -----------------*/
    (function () {
        const panel = document.getElementById('network-panel');
        if (!panel) return;

        const resourceSet = new Set();
        const fetchSet = new Set();
        const xhrSet = new Set();

        // 输出到面板
        const logToPanel = (type, url, info) => {
            const div = document.createElement('div');
            div.className = 'network-entry';
            div.innerHTML = `<span class="type">[${type}]</span> ${url} <br> ${info || ''}`;
            panel.appendChild(div);
            panel.scrollTop = panel.scrollHeight;
        };

        // 记录资源加载时间
        const logResources = () => {
            const resources = performance.getEntriesByType('resource');
            resources.forEach(res => {
                if (!resourceSet.has(res.name)) {
                    resourceSet.add(res.name);
                    logToPanel('RESOURCE', res.name, `类型: ${res.initiatorType}, 加载时间: ${res.duration.toFixed(2)}ms`);
                }
            });
        };

        //拦截 Fetch
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            if (!fetchSet.has(url)) fetchSet.add(url);
            logToPanel('FETCH', url, '正在加载...');
            const response = await originalFetch(...args);
            const clone = response.clone();
            clone.text().then(text => {
                logToPanel('FETCH', url, `响应内容(前70字符): ${text.slice(0, 70)}`);
            }).catch(err => logToPanel('FETCH', url, `解析失败: ${err}`));
            return response;
        };

        //拦截 XHR
        (function () {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function (method, url, ...rest) {
                this._url = url;
                return originalOpen.call(this, method, url, ...rest);
            };

            XMLHttpRequest.prototype.send = function (body) {
                this.addEventListener('load', () => {
                    if (!xhrSet.has(this._url)) xhrSet.add(this._url);
                    logToPanel('XHR', this._url, `响应内容(前200字符): ${this.responseText.slice(0, 200)}`);
                });
                return originalSend.call(this, body);
            };
        })();

        //轮询资源
        const interval = setInterval(() => {
            logResources();
            if (document.readyState === 'complete') {
                clearInterval(interval);
                logToPanel('INFO', '页面加载完成', '');
            }
        }, 100);
    })();
    /*------------------ 入场加载调试 -----------------*/


    /*------------------ 滚动控制 -----------------*/
    // 禁用滚动函数
    function disableScroll(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    // 启用禁止滚动
    function lockScroll() {
        document.body.style.overflow = "hidden";
        window.addEventListener("wheel", disableScroll, { passive: false });
        window.addEventListener("touchmove", disableScroll, { passive: false });
        window.addEventListener("keydown", keyBlock, { passive: false });
    }

    // 解锁滚动
    function unlockScroll() {
        document.body.style.overflow = "";
        window.removeEventListener("wheel", disableScroll, { passive: false });
        window.removeEventListener("touchmove", disableScroll, { passive: false });
        window.removeEventListener("keydown", keyBlock, { passive: false });
    }

    // 禁止方向键、空格、PageUp/PageDown
    function keyBlock(e) {
        const keys = [32, 33, 34, 35, 36, 37, 38, 39, 40]; // 空格、PgUp、PgDn、End、Home、方向键
        if (keys.includes(e.keyCode)) {
            e.preventDefault();
            return false;
        }
    }

    // 初始锁定滚动
    lockScroll();
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    window.addEventListener('load', () => {
        const hero = document.querySelector('.hero');
        const bgUrl = hero ? getComputedStyle(hero).backgroundImage.replace(/url\("?|"?\)/g, '') : null;
        const img = new Image();

        if (bgUrl) img.src = bgUrl;

        // 如果没有背景图或元素，立即结束入场动画
        if (!bgUrl || !hero) {
            completeEntryAnimation();
            return;
        }

        img.onload = () => {
            // 背景图加载成功后，调用统一的完成函数
            completeEntryAnimation();
        };
        // 如果图片加载失败，也应该触发入场完成，防止卡死
        img.onerror = () => {
            completeEntryAnimation();
        };
    });
    /* -------------------- 滚动控制 -------------------- */


    /* -------------------- 获取一言 -------------------- */
    const quoteElement = document.getElementById('quote');
    const loadingStatus = document.getElementById('loading-status');

    if (!quoteElement || !loadingStatus) {
        console.error("关键元素未找到（quote/loading-status）！");
    }

    // ================= 一言API加载 =================
    async function loadHitokoto() {
        if (!quoteElement) return;
        try {
            if (loadingStatus) loadingStatus.textContent = "正在加载一言...";

            const response = await fetch('https://international.v1.hitokoto.cn', {
                signal: AbortSignal.timeout(3000) // 3秒超时
            });

            if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);

            const data = await response.json();
            quoteElement.textContent = data.hitokoto;
            if (loadingStatus) loadingStatus.textContent = "加载完成";

            setTimeout(() => { if (loadingStatus) loadingStatus.textContent = "" }, 2000);
        } catch (error) {
            quoteElement.textContent = "一言加载失败了,但是...";
            if (loadingStatus) loadingStatus.textContent = "使用默认文案";
            console.warn("一言加载失败:", error);
        }
    }
    loadHitokoto();
    /* -------------------- 获取一言 -------------------- */


    /* -------------------- 深色模式 -------------------- */
    const modeToggle = document.getElementById('mode-toggle');
    const modeToggleImg = document.getElementById('mode-toggle-img');
    const body = document.body;

    if (modeToggle) {
        modeToggle.addEventListener('click', function () {
            body.classList.toggle('dark-mode');
            if (modeToggleImg) {
                if (body.classList.contains('dark-mode')) {
                    modeToggleImg.src = './png/月亮.png';
                } else {
                    modeToggleImg.src = './png/太阳.png';
                }
            }
        });
    }
    /* -------------------- 深色模式 -------------------- */


    /* -------------------- 下滑按钮 -------------------- */
    const scrollDownBtn = document.getElementById('scroll-down-btn');
    const heroSection = document.querySelector('.hero');

    if (scrollDownBtn && heroSection) {
        scrollDownBtn.addEventListener('click', () => {
            const nextSection = document.querySelector('.section');
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth' });
            }
        });

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            const heroBottom = heroSection.offsetHeight - 100;

            if (scrollY > heroBottom) {
                scrollDownBtn.classList.add('hidden');
            } else {
                scrollDownBtn.classList.remove('hidden');
            }
        });
    }
    /* -------------------- 下滑按钮 -------------------- */


    /* -------------------- 图片加载 -------------------- */

    const FORCE_LOAD_TIMEOUT = 5000; // 5秒强制加载
    let imagesLoadedFlag = false; // 图片是否已通过正常流程加载

    // **尝试加载单个图片**
    function tryLoadImage(src) {
        return new Promise(resolve => {
            const img = new Image();
            img.decoding = "async";
            img.referrerPolicy = "no-referrer";
            img.onload = () => resolve({ img, src }); // 成功时返回 img 元素和 src
            img.onerror = () => resolve(null); // 失败时返回 null
            img.src = src;
            img.alt = "";
        });
    }

    // **从本地存储加载图片（超时时调用）**
    function loadImagesFromLocalStorage(containerId1, containerId2) {
        const containers = [
            { id: containerId1, key: containerId1 + '_urls' },
            { id: containerId2, key: containerId2 + '_urls' }
        ];

        containers.forEach(item => {
            const container = document.getElementById(item.id);
            const urls = JSON.parse(localStorage.getItem(item.key));

            if (container && urls && urls.length > 0) {
                container.innerHTML = ''; // 清空现有内容

                // 打乱 URL
                for (let j = urls.length - 1; j > 0; j--) {
                    const r = Math.floor(Math.random() * (j + 1));
                    [urls[j], urls[r]] = [urls[r], urls[j]];
                }

                urls.forEach(url => {
                    const img = document.createElement("img");
                    img.src = url;
                    img.alt = "";
                    img.decoding = "async";

                    const wrap = document.createElement("div");
                    wrap.className = "scroll-item";
                    wrap.appendChild(img);
                    container.appendChild(wrap);
                });
                console.log(`${item.id} 强制从本地存储加载了 ${urls.length} 张图片`);
            } else {
                console.warn(`${item.id} 本地存储中没有找到图片 URL，无法强制加载`);
            }
        });
    }

    // **强制加载回调函数（超时触发）**
    const forceLoadFromLocalStorage = () => {
        if (imagesLoadedFlag) return;

        console.log("超过 5 秒，强制从本地存储加载图片！");
        loadImagesFromLocalStorage("imgScrollContainer", "imgScrollContainer2");
        imagesLoadedFlag = true;

        // 强制加载完成后，立即结束入场动画
        completeEntryAnimation();
    };

    // **设置 5 秒超时定时器**
    const forceLoadTimer = setTimeout(forceLoadFromLocalStorage, FORCE_LOAD_TIMEOUT);


    // **主函数：执行网络加载并存储 URL (修改为并行加载)**
    function loadImages(containerId, folder) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 【修正：清空容器，防止重复插入】
        container.innerHTML = '';

        const startIndex = 1;
        const maxMissing = 2; // 虽然现在是并行请求，但保持这个变量作为逻辑参考
        const localStoreKey = containerId + '_urls';

        // 1. 确定所有可能的 URL (预设一个请求范围)
        let possibleUrls = [];
        let i = startIndex;
        const maxImageCount = 15; // 最大尝试请求图片

        while (i < startIndex + maxImageCount) {
            possibleUrls.push(folder + i + ".jpg");
            i++;
        }

        async function loadSequence() {
            let successfulUrls = [];
            let currentPromises = [];

            // 2. 并行发起所有可能的图片请求
            for (let j = 0; j < possibleUrls.length; j++) {
                const url = possibleUrls[j];

                // 发起请求，不等待结果
                const promise = tryLoadImage(url)
                    .then(result => {
                        // result 是 {img, src} 或 null
                        if (result) {
                            const { img, src } = result;

                            const wrap = document.createElement("div");
                            wrap.className = "scroll-item";
                            wrap.appendChild(img);
                            container.appendChild(wrap);

                            // 记录成功的URL (用于本地存储)
                            successfulUrls.push(src);

                            console.log(`${containerId} 快速加载并插入: ${src}`); // 调试信息
                        }
                        return result; // 返回结果，供 Promise.allSettled 使用
                    });

                currentPromises.push(promise);
            }

            // 3. 等待所有请求完成，以完成本地存储和定时器清理
            await Promise.allSettled(currentPromises);

            // 4. 清理本地存储和定时器
            if (successfulUrls.length > 0) {
                // 打乱并存储成功的 URL 列表
                for (let j = successfulUrls.length - 1; j > 0; j--) {
                    const r = Math.floor(Math.random() * (j + 1));
                    [successfulUrls[j], successfulUrls[r]] = [successfulUrls[r], successfulUrls[j]];
                }
                localStorage.setItem(localStoreKey, JSON.stringify(successfulUrls));

                // 正常加载成功，清除定时器并设置标志
                clearTimeout(forceLoadTimer);
                imagesLoadedFlag = true;
            }

            console.log(containerId + " 并行加载批次结束，共 " + successfulUrls.length + " 张图片存储在本地。");
        }

        loadSequence();
    }


    // **图片加载入口**
    (function initImageLoading() {
        loadImages("imgScrollContainer", "./jpg/1/");
        loadImages("imgScrollContainer2", "./jpg/2/");
    })();
    /* -------------------- 图片加载 -------------------- */


    /* -------------------- 滚动两侧按钮 -------------------- */
    function initScrollButtons() {
        const wrappers = document.querySelectorAll('.scroll-wrapper');

        wrappers.forEach(wrapper => {
            const container = wrapper.querySelector('.scroll-container');
            const btnLeft = wrapper.querySelector('.scroll-btn.left');
            const btnRight = wrapper.querySelector('.scroll-btn.right');

            if (!container || !btnLeft || !btnRight) return;

            const scrollStep = 320;

            const smoothTo = (left) => container.scrollTo({
                left,
                behavior: 'smooth'
            });

            btnLeft.addEventListener('click', () => {
                smoothTo(Math.max(container.scrollLeft - scrollStep, 0));
            });

            btnRight.addEventListener('click', () => {
                const maxScroll = container.scrollWidth - container.clientWidth;
                smoothTo(Math.min(container.scrollLeft + scrollStep, maxScroll));
            });
        });
    }
    /* -------------------- 滚动两侧按钮 -------------------- */


    //----------------------更新日志----------------/
    const logs = [
        { date: "2025-12-3", text: "解决了入场卡死,但是又有新的bug" },
        { date: "2025-12-2", text: "想起来我有这个这个网站" },
        { date: "2025-8-22", text: "购买dpkg.top域名" },
        { date: "2025-8-21", text: "优化/入场动画" },
        { date: "2025-8-20", text: "增加联系方式/优化/更改了几个按钮" },
        { date: "2025-8-19", text: "优化" },
        { date: "2025-7-11", text: "优化，加了些按钮和动画" },
        { date: "2025-7-6", text: "终于修了历史BUG" },
        { date: "2025-7-2", text: "突然想起来我有这个这个网站" },
        { date: "2025-3-6", text: "增加了些动画效果" },
        { date: "2025-3-6", text: "映射成功" },
        { date: "2025-3-5", text: "初版完成" }
    ];

    const container = document.getElementById("scrollContainer");

    // 循环渲染
    if (container) {
        logs.forEach(log => {
            const div = document.createElement("div");
            div.className = "scroll-item2";

            div.innerHTML = `
                <h5>${log.date}</h5>
                <small>${log.text}</small>
            `;

            container.appendChild(div);
        });
    }
    //----------------------更新日志----------------/


    //----------------------联系我功能--------------/
    const btn = document.getElementById('toggleBtn');
    const menu = document.getElementById('popupMenu');

    if (btn && menu) {
        btn.addEventListener('click', () => {
            // 切换显示/隐藏
            menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
        });

        // 点击页面其他地方时收起菜单
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !menu.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
    }
    //----------------------联系我功能--------------/

    // 初始化滚动按钮功能
    initScrollButtons();
});