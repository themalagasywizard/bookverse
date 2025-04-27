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