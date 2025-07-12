document.addEventListener('DOMContentLoaded', function () {
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
    let lastScrollTop = 0;
    window.addEventListener('scroll', function () {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const navbar = document.querySelector('.navbar');
        if (currentScrollTop > lastScrollTop) {
            // 向下滚动
            navbar.style.top = '-60px'; // 假设导航栏高度为 60px
        } else {
            // 向上滚动
            navbar.style.top = '0';
        }
        lastScrollTop = currentScrollTop;
    });
    loadHitokoto();
    lazyLoadImages();
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
    function lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');

        // 兼容性降级方案
        if (!('IntersectionObserver' in window)) {
            images.forEach(img => {
                if (img.dataset.src) img.src = img.dataset.src;
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || '';
                    img.removeAttribute('data-src');
                    observer.unobserve(img);

                    img.onload = () => {
                        img.style.opacity = 1;
                        if (loadingStatus) {
                            loadingStatus.textContent = `图片加载完成: ${img.alt || ''}`;
                            setTimeout(() => loadingStatus.textContent = "", 1500);
                        }
                    };
                }
            });
        },
            { rootMargin: '200px' });
        images.forEach(img => observer.observe(img));
    }
    /* -------------------- 滚动两侧按钮 -------------------- */
    function initScrollButtons() {
        const wrappers = document.querySelectorAll('.scroll-wrapper');

        wrappers.forEach(wrapper => {
            const container = wrapper.querySelector('.scroll-container');
            const btnLeft = wrapper.querySelector('.scroll-btn.left');
            const btnRight = wrapper.querySelector('.scroll-btn.right');

            const scrollStep = 320; // 每次跳跃的像素距离（约等于一张图宽）

            btnLeft.addEventListener('click', () => {
                container.scrollTo({
                    left: Math.max(container.scrollLeft - scrollStep, 0)
                });
            });

            btnRight.addEventListener('click', () => {
                const maxScroll = container.scrollWidth - container.clientWidth;
                container.scrollTo({
                    left: Math.min(container.scrollLeft + scrollStep, maxScroll)
                });
            });
        });
    }

    initScrollButtons();
});
