import { supabase, signIn, signOut, getCurrentUser } from './supabase.js';

// Check if user is logged in
export async function checkAuth() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Auth error:', error.message);
            return false;
        }
        
        if (!user) {
            return false;
        }
        
        // User is logged in, update UI
        updateAuthUI(true, user);
        return true;
    } catch (error) {
        console.error('Auth check failed:', error.message);
        return false;
    }
}

// Update UI based on authentication state
export function updateAuthUI(isLoggedIn, user = null) {
    const profileButton = document.getElementById('profileButton');
    const profileButtonMobile = document.getElementById('profileButtonMobile');
    const signOutButtons = document.querySelectorAll('.signOutBtn');
    const loginButtons = document.querySelectorAll('.loginBtn');
    
    if (isLoggedIn && user) {
        // Store minimal user data in localStorage for quick reference
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', user.email);
        
        // Show profile buttons
        if (profileButton) profileButton.classList.remove('hidden');
        if (profileButtonMobile) profileButtonMobile.classList.remove('hidden');
        
        // Update login/logout buttons
        signOutButtons.forEach(btn => {
            btn.classList.remove('hidden');
            btn.addEventListener('click', handleSignOut);
        });
        
        loginButtons.forEach(btn => {
            btn.classList.add('hidden');
        });
    } else {
        // Clear user data from localStorage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        
        // Hide profile buttons
        if (profileButton) profileButton.classList.add('hidden');
        if (profileButtonMobile) profileButtonMobile.classList.add('hidden');
        
        // Update login/logout buttons
        signOutButtons.forEach(btn => {
            btn.classList.add('hidden');
        });
        
        loginButtons.forEach(btn => {
            btn.classList.remove('hidden');
        });
    }
}

// Handle sign out
export async function handleSignOut(e) {
    if (e) e.preventDefault();
    
    try {
        const { error } = await signOut();
        
        if (error) {
            console.error('Sign out error:', error.message);
            return;
        }
        
        // Update UI
        updateAuthUI(false);
        
        // Redirect to homepage if on profile or protected page
        const currentPath = window.location.pathname;
        if (currentPath.includes('profile.html') || currentPath.includes('create-campaign.html')) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Sign out failed:', error.message);
    }
}

// Redirect to login if not authenticated (for protected pages)
export async function requireAuth() {
    const isLoggedIn = await checkAuth();
    
    if (!isLoggedIn) {
        // Store the intended destination
        const currentPath = window.location.pathname;
        if (currentPath !== '/login.html' && currentPath !== '/index.html') {
            localStorage.setItem('redirectUrl', currentPath);
        }
        
        // Redirect to login
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Initialize authentication on page load
export function initAuth() {
    document.addEventListener('DOMContentLoaded', async () => {
        await checkAuth();
        
        // Handle campaign buttons click for auth check
        const campaignButtons = document.querySelectorAll('a[href="create-campaign.html"]');
        campaignButtons.forEach(button => {
            button.addEventListener('click', handleCampaignClick);
        });
        
        // Setup auth state change listener
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                updateAuthUI(true, session.user);
            } else if (event === 'SIGNED_OUT') {
                updateAuthUI(false);
            }
        });
    });
}

// Handle campaign button clicks
async function handleCampaignClick(e) {
    const isLoggedIn = await checkAuth();
    
    if (!isLoggedIn) {
        e.preventDefault();
        // Store the intended destination
        localStorage.setItem('redirectUrl', 'create-campaign.html');
        // Redirect to login
        window.location.href = 'login.html';
    }
}

// Initialize on import
initAuth();

// Authentication utility functions

// Check if user is authenticated
async function isAuthenticated() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        return !!user;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Redirect to login if not authenticated
async function requireAuth() {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        // Store the current page URL to redirect back after login
        const currentPage = window.location.pathname;
        localStorage.setItem('redirectUrl', currentPage);
        window.location.href = '/login.html';
        return false;
    }
    return true;
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
    const { data: { user }, error } = await supabase.auth.getUser();
    if (user && !error) {
        updateAuthUI(true, user);
    } else {
        updateAuthUI(false);
    }
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            updateAuthUI(true, session.user);
        } else if (event === 'SIGNED_OUT') {
            updateAuthUI(false);
        }
    });
});

// Get user initials for avatar
function getInitials(name) {
    if (!name) return 'UN';
    const parts = name.split(/[\s.-_@]+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0][0] + (parts[0][1] || 'N')).toUpperCase();
} 