// Supabase client configuration
const supabaseUrl = 'https://qcnqdwylsxgpnoogcuhm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbnFkd3lsc3hncG5vb2djdWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDY4NTEsImV4cCI6MjA2MDgyMjg1MX0.4z2ZSBfJLSSReG5KLZXrEUVN8n2HU1EuSvsy98sPEgY'

// Initialize the Supabase client
let supabaseClient;

// Setup supabase once it's loaded
function initSupabase() {
    if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
        console.log('Initializing Supabase client');
        supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
        window.supabaseClient = supabaseClient; // Make it globally available
    } else {
        console.error('Supabase client not loaded');
    }
}

// Wait for document to be ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
} 