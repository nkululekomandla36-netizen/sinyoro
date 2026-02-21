// main.js - Sinyoro Trading Platform Interactivity

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sinyoro Main.js Loaded');

    // ==========================================
    // GET STARTED BUTTON
    // ==========================================
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showToast('Welcome to Sinyoro! Let\'s get you started.');
            const portfolio = document.getElementById('portfolio');
            if (portfolio) {
                portfolio.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // ==========================================
    // SIGN IN BUTTON (FIXED - handles both button and link)
    // ==========================================
    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn) {
        signInBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔐 Sign In clicked');
            showToast('Sign In - Coming Soon! 🚀');
        });
    }

    // ==========================================
    // SIGN UP BUTTON (FIXED - handles both button and link)
    // ==========================================
    const signUpBtn = document.getElementById('signUpBtn');
    if (signUpBtn) {
        signUpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📝 Sign Up clicked');
            showToast('Sign Up - Coming Soon! 🎉');
        });
    }

    // ==========================================
    // TIPS LINK
    // ==========================================
    const tipsLink = document.querySelector('a[href="#tips"]');
    if (tipsLink) {
        tipsLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const tipsSection = document.getElementById('tips');
            if (tipsSection) {
                tipsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                showToast('Trading Tips - Learn from the experts! 📚');
            }
        });
    }

    // ==========================================
    // TRADE NOW BUTTONS (FIXED - event delegation)
    // ==========================================
    document.addEventListener('click', function(e) {
        const tradeBtn = e.target.closest('.btn-primary');
        if (tradeBtn && tradeBtn.textContent.includes('Trade Now')) {
            e.preventDefault();
            e.stopPropagation();
            const card = tradeBtn.closest('.glass-card') || tradeBtn.closest('.trading-card');
            if (card) {
                const titleEl = card.querySelector('h3');
                const title = titleEl ? titleEl.textContent : 'Trading';
                showToast(`Starting ${title}... 💰`);
            }
        }
    });

    // ==========================================
    // TOAST NOTIFICATION FUNCTION (ENHANCED)
    // ==========================================
    function showToast(message) {
        // Remove all existing toasts immediately
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon">ℹ️</div>
            <div class="toast-content">
                <h4 style="margin: 0 0 0.25rem 0; font-size: 0.9rem; font-weight: 600;">Notification</h4>
                <p style="margin: 0; font-size: 0.85rem; line-height: 1.4;">${message}</p>
            </div>
        `;

        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: rgba(15, 23, 42, 0.98);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 1rem 1.25rem;
            border-radius: 12px;
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            z-index: 99999;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            color: white;
            min-width: 280px;
            max-width: 350px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            pointer-events: none;
        `;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 400);
        }, 3000);
    }

    // ==========================================
    // SMOOTH SCROLL (FIXED - excludes sign in/up)
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        // Skip sign in/up buttons to prevent conflict
        if (anchor.id === 'signInBtn' || anchor.id === 'signUpBtn') return;
        
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#' || href === '#signin' || href === '#signup') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    console.log('✅ Sinyoro App Ready - All buttons active');
});
