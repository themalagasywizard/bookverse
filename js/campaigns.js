// Helper function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Helper function to calculate days remaining
function getDaysRemaining(endDate) {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Function to load and display campaigns
async function loadCampaigns() {
    try {
        const campaignsGrid = document.getElementById('campaignsGrid');
        if (!campaignsGrid) return; // Exit if element doesn't exist
        
        // Show loading state
        campaignsGrid.innerHTML = `
            <div class="col-span-full flex justify-center items-center py-10">
                <svg class="animate-spin h-10 w-10 text-[#FF5733]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        `;

        // Get campaigns from Supabase
        const { data: campaigns, error } = await supabaseClient
            .from('campaigns')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) throw error;

        // Clear loading message
        campaignsGrid.innerHTML = '';

        // Display campaigns
        if (campaigns && campaigns.length > 0) {
            campaigns.forEach(campaign => {
                const isDirectPublish = campaign.is_direct_publish;
                
                const campaignCard = document.createElement('div');
                campaignCard.className = 'bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300';
                
                const statusBadge = isDirectPublish ? 
                    `<span class="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Available Now</span>` :
                    `<span class="absolute top-4 right-4 bg-[#FF5733] text-white px-3 py-1 rounded-full text-xs font-semibold">Crowdfunding</span>`;

                const progressSection = isDirectPublish ?
                    `<div class="flex justify-between items-center mb-3">
                        <span class="text-sm text-gray-600">Print on demand</span>
                        <span class="text-sm text-green-500 font-semibold">Ships in 3-5 days</span>
                     </div>` :
                    `<div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                            <div class="progress-bar-fill h-2.5 rounded-full" style="width: ${((campaign.current_purchases || 0) / campaign.min_purchases * 100)}%"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 mb-3">
                            <span>${campaign.current_purchases || 0}/${campaign.min_purchases} pre-purchases</span>
                            <span>${getDaysRemaining(new Date(campaign.created_at).setDate(new Date(campaign.created_at).getDate() + campaign.duration_days))} days left</span>
                        </div>
                     </div>`;

                campaignCard.innerHTML = `
                    <div class="relative">
                        <img src="${campaign.cover_image_url || 'https://picsum.photos/300/400'}" 
                             alt="${campaign.title}" 
                             class="w-full h-48 object-cover">
                        ${statusBadge}
                    </div>
                    <div class="p-4">
                        <h3 class="font-semibold text-lg mb-1 text-[#333]">${campaign.title}</h3>
                        <p class="text-sm text-gray-600 mb-2">by ${campaign.author_name}</p>
                        <p class="text-sm text-gray-700 mb-3">${campaign.description ? campaign.description.substring(0, 100) + (campaign.description.length > 100 ? '...' : '') : 'No description available.'}</p>
                        ${progressSection}
                        <a href="campaign.html?id=${campaign.id}" 
                           class="cta-button block text-center w-full py-2 rounded-md font-semibold text-sm">
                           ${isDirectPublish ? 'Buy Now' : 'Back this Book'} for ${formatCurrency(campaign.price)}
                        </a>
                    </div>
                `;
                campaignsGrid.appendChild(campaignCard);
            });
        } else {
            campaignsGrid.innerHTML = `
                <div class="col-span-3 text-center text-gray-500">
                    No books found.
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading campaigns:', error);
        if (campaignsGrid) {
            campaignsGrid.innerHTML = `
                <div class="col-span-3 text-center text-red-500">
                    Error loading campaigns. Please try again later.
                </div>
            `;
        }
    }
}

// Initialize fade-in animations
function initializeFadeIn() {
    const sectionsToFade = document.querySelectorAll('.fade-in-section');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    sectionsToFade.forEach(section => {
        observer.observe(section);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('campaignsGrid')) {
        loadCampaigns();
    }
    initializeFadeIn();
}); 