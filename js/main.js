// app.js - Sinyoro Trading Platform Interactivity

document.addEventListener('DOMContentLoaded', function() {
    
    // Get Started Button
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            showToast('Welcome to Sinyoro! Let\'s get you started.');
            document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Sign In Button
    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn) {
        signInBtn.addEventListener('click', function() {
            showToast('Sign In - Coming Soon! 🚀');
        });
    }

    // Sign Up Button
    const signUpBtn = document.getElementById('signUpBtn');
    if (signUpBtn) {
        signUpBtn.addEventListener('click', function() {
            showToast('Sign Up - Coming Soon! 🎉');
        });
    }

    // Tips Link
    const tipsLink = document.querySelector('a[href="#tips"]');
    if (tipsLink) {
        tipsLink.addEventListener('click', function(e) {
            e.preventDefault();
            const tipsSection = document.getElementById('tips');
            if (tipsSection) {
                tipsSection.scrollIntoView({ behavior: 'smooth' });
                showToast('Trading Tips - Learn from the experts! 📚');
            }
        });
    }

    // Trade Now Buttons
    const tradeButtons = document.querySelectorAll('.btn-primary');
    tradeButtons.forEach(btn => {
        if (btn.textContent.includes('Trade Now')) {
            btn.addEventListener('click', function() {
                const card = this.closest('.glass-card');
                const title = card.querySelector('h3').textContent;
                showToast(`Starting ${title}... 💰`);
            });
        }
    });

    // Toast Notification Function
    function showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon">ℹ️</div>
            <div class="toast-content">
                <h4>Notification</h4>
                <p>${message}</p>
            </div>
        `;

        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: rgba(30, 41, 59, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1.5rem 2rem;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 1rem;
            z-index: 9999;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.4s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 100);

        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // Smooth scroll for all nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    console.log('Sinyoro App Loaded Successfully! 🚀');
});
