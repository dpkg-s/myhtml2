document.addEventListener('DOMContentLoaded', function () {
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
        const bgUrl = getComputedStyle(hero).backgroundImage.replace(/url\("?|"?\)/g, '');
        const img = new Image();
        img.src = bgUrl;

        img.onload = () => {
            const welcome = document.querySelector('.welcome-text');
            setTimeout(() => {
                welcome.style.opacity = '0'; // 整个容器淡出
                unlockScroll(); // 恢复滚动
                setTimeout(() => {
                    welcome.style.display = 'none'; // 移除欢迎页
                }, 2000);
            }, 500);
        };
    });
    /* -------------------- 获取一言 -------------------- */
    const quoteElement = document.getElementById('quote');
    const loadingStatus = document.getElementById('loading-status');

    if (!quoteElement || !loadingStatus) {
        console.error("关键元素未找到！");
        return;
    }


    // ================= 一言API加载 =================
    async function loadHitokoto() {
        try {
            loadingStatus.textContent = "正在加载一言...";

            const response = await fetch('https://international.v1.hitokoto.cn', {
                signal: AbortSignal.timeout(3000) // 3秒超时
            });

            if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);

            const data = await response.json();
            quoteElement.textContent = data.hitokoto;
            loadingStatus.textContent = "加载完成";

            setTimeout(() => loadingStatus.textContent = "", 2000);
        } catch (error) {
            quoteElement.textContent = "一言加载失败了,但是...";
            loadingStatus.textContent = "使用默认文案";
            console.warn("一言加载失败:", error);
        }
    }


    /* -------------------- 深色模式 -------------------- */
    loadHitokoto();
    const modeToggle = document.getElementById('mode-toggle');
    const modeToggleImg = document.getElementById('mode-toggle-img');
    const body = document.body;
    modeToggle.addEventListener('click', function () {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            modeToggleImg.src = './png/月亮.png';
        } else {
            modeToggleImg.src = './png/太阳.png';
        }
    });
    /* -------------------- 隐藏导航栏 -------------------- */
    // let lastScrollTop = 0;
    // window.addEventListener('scroll', function () {
    //     const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    //     const navbar = document.querySelector('.navbar');
    //     if (currentScrollTop > lastScrollTop) {
    //         // 向下滚动
    //         navbar.style.top = '-60px'; 
    //     } else {
    //         // 向上滚动
    //         navbar.style.top = '0';
    //     }
    //     lastScrollTop = currentScrollTop;
    // });
    loadHitokoto();
    // lazyLoadImages();
    /* --------------------  下滑按钮  -------------------- */
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
    /* -------------------- 图片懒加载 -------------------- */
    // function lazyLoadImages() {
    //     const images = document.querySelectorAll('img[data-src]');

    //     if (!('IntersectionObserver' in window)) {
    //         images.forEach(img => {
    //             if (img.dataset.src) img.src = img.dataset.src;
    //         });
    //         return;
    //     }

    //     const observer = new IntersectionObserver((entries) => {
    //         entries.forEach(entry => {
    //             if (entry.isIntersecting) {
    //                 const img = entry.target;
    //                 img.src = img.dataset.src || '';
    //                 img.removeAttribute('data-src');
    //                 observer.unobserve(img);

    //                 img.onload = () => {
    //                     img.style.opacity = 1;
    //                     if (loadingStatus) {
    //                         loadingStatus.textContent = `图片加载完成: ${img.alt || ''}`;
    //                         setTimeout(() => loadingStatus.textContent = "", 1500);
    //                     }
    //                 };
    //             }
    //         });
    //     },
    //         { rootMargin: '200px' });
    //     images.forEach(img => observer.observe(img));
    // }
    /* -------------------- 图片生成随机 -------------------- */
    (() => {
        function loadImages(containerId, folder) {
            const container = document.getElementById(containerId);
            const startIndex = 1;            // 起始编号
            const maxMissing = 3;            // 连续缺失阈值
            const imgs = [];                 // 存放加载成功的图片

            async function loadSequence() {
                let i = startIndex;
                let missing = 0;
                //获取
                while (missing < maxMissing) {
                    const url = folder + i + ".jpg";
                    const imgEl = await tryLoadImage(url);

                    if (imgEl) {
                        imgs.push(imgEl);
                        missing = 0;
                    } else {
                        missing++;
                    }
                    i++;
                }

                // 打乱
                for (let j = imgs.length - 1; j > 0; j--) {
                    const r = Math.floor(Math.random() * (j + 1));
                    [imgs[j], imgs[r]] = [imgs[r], imgs[j]];
                }

                // 插入容器
                imgs.forEach(img => {
                    const wrap = document.createElement("div");
                    wrap.className = "scroll-item";
                    wrap.appendChild(img);
                    container.appendChild(wrap);
                });

                  console.log(" 加载结束，共 " + imgs.length + " 张");
            }

            function tryLoadImage(src) {
                return new Promise(resolve => {
                    const img = new Image();
                    img.decoding = "async";
                    img.referrerPolicy = "no-referrer";
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                    img.src = src;
                    img.alt = "";
                });
            }

            loadSequence();
        }

        // 调用：容器 ID + 图片文件夹路径
        loadImages("imgScrollContainer", "./jpg/1/");
        loadImages("imgScrollContainer2", "./jpg/2/");
    })();
    /* -------------------- 滚动两侧按钮 -------------------- */
    function initScrollButtons() {
        const wrappers = document.querySelectorAll('.scroll-wrapper');

        wrappers.forEach(wrapper => {

            const container = wrapper.querySelector('.scroll-container');
            const btnLeft = wrapper.querySelector('.scroll-btn.left');
            const btnRight = wrapper.querySelector('.scroll-btn.right');

            const scrollStep = 320; // 你原来的步长

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
    //----------------------更新日志----------------/
    const logs = [
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
    logs.forEach(log => {
        const div = document.createElement("div");
        div.className = "scroll-item2";

        div.innerHTML = `
            <h5>${log.date}</h5>
            <small>${log.text}</small>
        `;

        container.appendChild(div);
    });

    //----------------------QQ邮箱功能--------------/
    const btn = document.getElementById('toggleBtn');
    const menu = document.getElementById('popupMenu');

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
    initScrollButtons();

});

