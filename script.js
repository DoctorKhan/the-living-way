document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('waitlist-form');
    const successMessage = document.querySelector('.success-message');
    const errorMessage = document.querySelector('.error-message');
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button');
    let sealedEmail = ''; // Store the user's email after success

    // 1. Check for Referral Code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get('ref');
    if (referrer) {
        const refInput = document.getElementById('referred_by');
        if (refInput) refInput.value = referrer;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = input.value;
        if (!email) return;

        // Reset error state
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';

        // Collect data BEFORE disabling inputs
        const formData = new FormData(form);
        const jsonData = Object.fromEntries(formData.entries());

        // UI State: Loading
        button.textContent = 'SEALING...';
        button.disabled = true;
        input.disabled = true;

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: JSON.stringify(jsonData),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Success
                sealedEmail = email; // Save for referral link
                form.style.display = 'none';
                successMessage.classList.remove('hidden');
            } else {
                // Error
                const data = await response.json();
                console.error("Formspree Error:", data);
                
                let msg = "Unable to seal your place. Please try again.";
                if (Object.hasOwn(data, 'errors')) {
                    msg = data["errors"].map(error => error["message"]).join(", ");
                } else if (data.error) {
                    msg = data.error;
                }
                
                errorMessage.textContent = msg;
                errorMessage.classList.remove('hidden');

                // Reset UI
                button.textContent = 'SEAL MY PLACE';
                button.disabled = false;
                input.disabled = false;
            }
        } catch (error) {
            console.error("Network Error:", error);
            errorMessage.textContent = "Connection error. Please try again.";
            errorMessage.classList.remove('hidden');
            
            button.textContent = 'SEAL MY PLACE';
            button.disabled = false;
            input.disabled = false;
        }
    });

    // Helper to get Referral URL
    function getReferralUrl() {
        const baseUrl = window.location.origin + window.location.pathname;
        return sealedEmail 
            ? `${baseUrl}?ref=${encodeURIComponent(sealedEmail)}`
            : window.location.href;
    }

    const shareText = 'The Scroll is opening. I have been sealed. Join the 144,000.';

    // WhatsApp
    const waBtn = document.getElementById('share-whatsapp');
    if (waBtn) {
        waBtn.addEventListener('click', () => {
            const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + getReferralUrl())}`;
            window.open(url, '_blank');
        });
    }

    // Telegram
    const tgBtn = document.getElementById('share-telegram');
    if (tgBtn) {
        tgBtn.addEventListener('click', () => {
            const url = `https://t.me/share/url?url=${encodeURIComponent(getReferralUrl())}&text=${encodeURIComponent(shareText)}`;
            window.open(url, '_blank');
        });
    }

    // Native / Copy Link
    const shareBtn = document.getElementById('share-native');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const referralUrl = getReferralUrl();
            const shareData = {
                title: 'The Second Coming',
                text: shareText,
                url: referralUrl
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    // User cancelled
                }
            } else {
                try {
                    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                    const originalText = shareBtn.textContent;
                    shareBtn.textContent = 'COPIED';
                    setTimeout(() => {
                        shareBtn.textContent = originalText;
                    }, 2000);
                } catch (err) {
                    prompt('Copy this link:', referralUrl);
                }
            }
        });
    }
});