// app.js - Sinyoro Trading Platform - Complete JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sinyoro App Loaded');

    // ==========================================
    // TOAST NOTIFICATION SYSTEM
    // ==========================================
    function showToast(message, type = 'info') {
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <h4 style="margin: 0 0 0.25rem 0; font-size: 0.9rem; font-weight: 600;">${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
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
            font-family: system-ui, -apple-system, sans-serif;
            pointer-events: none;
        `;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // ==========================================
    // NAVIGATION BUTTONS
    // ==========================================
    
    // Sign In
    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn) {
        signInBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔐 Sign In clicked');
            showToast('Sign In - Coming Soon! 🚀');
        });
    }

    // Sign Up
    const signUpBtn = document.getElementById('signUpBtn');
    if (signUpBtn) {
        signUpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📝 Sign Up clicked');
            showToast('Sign Up - Coming Soon! 🎉');
        });
    }

    // Get Started
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚀 Get Started clicked');
            showToast('Welcome to Sinyoro! Let\'s get started! 🚀', 'success');
            const portfolio = document.getElementById('portfolio');
            if (portfolio) {
                portfolio.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // ==========================================
    // TIPS SECTION
    // ==========================================
    
    const tips = [
        { text: "Always check asset trends before trading.", category: "Trading" },
        { text: "Start small, grow your portfolio gradually.", category: "Portfolio" },
        { text: "Diversify your investments to reduce risk.", category: "Risk Management" },
        { text: "Use alerts to stay updated on market changes.", category: "Alerts" },
        { text: "Never invest more than you can afford to lose.", category: "Safety" },
        { text: "Research before you trade, not after.", category: "Research" }
    ];

    function loadRandomTip() {
        const tipContent = document.getElementById('tipContent');
        const tipCategory = document.getElementById('tipCategory');
        const tipDate = document.getElementById('tipDate');

        if (tipContent && tipCategory) {
            const tip = tips[Math.floor(Math.random() * tips.length)];
            tipContent.textContent = tip.text;
            tipCategory.textContent = tip.category;
            if (tipDate) tipDate.textContent = new Date().toLocaleDateString();
        }
    }

    loadRandomTip();

    const refreshTipBtn = document.getElementById('refreshTipBtn');
    if (refreshTipBtn) {
        refreshTipBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadRandomTip();
            showToast('New tip loaded! 💡', 'success');
        });
    }

    // Tips Link in Nav
    const tipsLink = document.querySelector('a[href="#tips"]');
    if (tipsLink) {
        tipsLink.addEventListener('click', function(e) {
            e.preventDefault();
            const tipsSection = document.getElementById('tips');
            if (tipsSection) {
                tipsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                showToast('Trading Tips - Learn from the experts! 📚');
            }
        });
    }

    // ==========================================
    // TRADING CARDS (Event Delegation)
    // ==========================================
    
    document.addEventListener('click', function(e) {
        const tradeBtn = e.target.closest('.trade-btn') || 
                        (e.target.matches('.btn-primary') && e.target.textContent.includes('Trade Now') ? e.target : null);
        
        if (tradeBtn) {
            e.preventDefault();
            const card = tradeBtn.closest('.trading-card') || tradeBtn.closest('.glass-card');
            if (card) {
                const titleEl = card.querySelector('h3');
                const title = titleEl ? titleEl.textContent : 'Trading';
                console.log(`💰 Trade: ${title}`);
                showToast(`Starting ${title}... 💰`, 'success');
            }
        }
    });

    // ==========================================
    // SMOOTH SCROLLING
    // ==========================================
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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

    // ==========================================
    // DEBUG BUTTONS (Optional)
    // ==========================================
    
    const welcomeAlertBtn = document.getElementById('welcomeAlertBtn');
    if (welcomeAlertBtn) {
        welcomeAlertBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert("Welcome to Sinyoro!");
        });
    }

    const consoleTestBtn = document.getElementById('consoleTestBtn');
    if (consoleTestBtn) {
        consoleTestBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Console test successful ✅");
        });
    }

    const greetBtn = document.getElementById('greetBtn');
    if (greetBtn) {
        greetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert("Welcome to Sinyoro!");
        });
    }

    console.log('✅ Sinyoro App Ready - All Systems Active');
});
