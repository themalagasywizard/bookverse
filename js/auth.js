// Authentication utility functions

// Check if user is authenticated
async function isAuthenticated() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        return !!user;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Update UI based on authentication state
function updateAuthUI(isLoggedIn, user = null) {
    const loginButtons = document.querySelectorAll('.loginBtn');
    const userProfileDropdown = document.getElementById('userProfileDropdown');
    const mobileUserProfile = document.getElementById('mobileUserProfile');
    const signOutButtons = document.querySelectorAll('.signOutBtn');
    
    if (isLoggedIn && user) {
        // Hide login buttons, show profile
        loginButtons.forEach(btn => btn.classList.add('hidden'));
        if (userProfileDropdown) userProfileDropdown.classList.remove('hidden');
        if (mobileUserProfile) mobileUserProfile.classList.remove('hidden');
        
        // Update profile information
        const displayName = user.user_metadata?.full_name || user.email || 'User';
        const initials = getInitials(displayName);
        
        if (document.getElementById('headerUserName')) {
            document.getElementById('headerUserName').textContent = displayName;
        }
        if (document.getElementById('mobileUserName')) {
            document.getElementById('mobileUserName').textContent = displayName;
        }
        if (document.getElementById('headerInitials')) {
            document.getElementById('headerInitials').textContent = initials;
        }
        if (document.getElementById('mobileInitials')) {
            document.getElementById('mobileInitials').textContent = initials;
        }

        // Set up sign out buttons
        signOutButtons.forEach(btn => {
            btn.classList.remove('hidden');
            btn.addEventListener('click', handleSignOut);
        });
    } else {
        // Show login buttons, hide profile
        loginButtons.forEach(btn => btn.classList.remove('hidden'));
        if (userProfileDropdown) userProfileDropdown.classList.add('hidden');
        if (mobileUserProfile) mobileUserProfile.classList.add('hidden');
        signOutButtons.forEach(btn => btn.classList.add('hidden'));
    }
}

// Handle sign out
async function handleSignOut(e) {
    if (e) e.preventDefault();
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        updateAuthUI(false);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// Get user initials for avatar
function getInitials(name) {
    if (!name) return 'UN';
    const parts = name.split(/[\s.-_@]+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0][0] + (parts[0][1] || 'N')).toUpperCase();
}

// Handle protected links
function setupProtectedLinks() {
    const protectedLinks = document.querySelectorAll('a[href="publish.html"], a[href="create-campaign.html"], a[href="direct-publish.html"]');
    
    protectedLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const targetHref = link.getAttribute('href');
            
            const authenticated = await isAuthenticated();
            if (authenticated) {
                window.location.href = targetHref;
            } else {
                localStorage.setItem('redirectUrl', targetHref);
                window.location.href = 'login.html';
            }
        });
    });
}

// Check authentication on protected pages
async function checkAuthOnProtectedPage() {
    const protectedPages = ['publish.html', 'create-campaign.html', 'direct-publish.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const authenticated = await isAuthenticated();
        if (!authenticated) {
            localStorage.setItem('redirectUrl', currentPage);
            window.location.href = 'login.html';
            return false;
        }
    }
    return true;
}

// Initialize auth checks when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Check if we're on a protected page
    await checkAuthOnProtectedPage();
    
    // Setup protected links
    setupProtectedLinks();
    
    // Check initial auth state
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (user && !error) {
        updateAuthUI(true, user);
    } else {
        updateAuthUI(false);
    }
    
    // Listen for auth state changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            updateAuthUI(true, session.user);
        } else if (event === 'SIGNED_OUT') {
            updateAuthUI(false);
        }
    });
}); 