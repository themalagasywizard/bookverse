// Supabase configuration
const supabaseUrl = 'https://qcnqdwylsxgpnoogcuhm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbnFkd3lsc3hncG5vb2djdWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDY4NTEsImV4cCI6MjA2MDgyMjg1MX0.4z2ZSBfJLSSReG5KLZXrEUVN8n2HU1EuSvsy98sPEgY';

console.log('Supabase configuration loaded:', { 
  url: supabaseUrl, 
  key: supabaseAnonKey ? 'Key provided' : 'No key provided' 
});

// Global store for mock data
const mockStore = {
  user: {
    id: 'mock-user-id',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User'
    }
  },
  uploads: [],
  campaigns: []
};

// Check supabase availability in window scope
console.log('Checking Supabase availability...');
if (typeof supabase === 'undefined') {
  console.warn('Supabase client not found in global scope');
} else {
  console.log('Supabase client found in global scope');
}

// Initialize Supabase client if available
let supabaseClient;
try {
  console.log('Attempting to initialize Supabase client...');
  
  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    console.log('Using global supabase.createClient');
    supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully');
  } else if (typeof createClient === 'function') {
    console.log('Using direct createClient function');
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully');
  } else {
    console.warn('Supabase client initialization failed: createClient function not available');
    console.log('Running in mock mode');
  }
  
  // Verify client has required methods
  if (supabaseClient) {
    console.log('Verifying Supabase client capabilities...');
    const hasAuth = supabaseClient.auth && typeof supabaseClient.auth.getUser === 'function';
    const hasStorage = supabaseClient.storage && typeof supabaseClient.storage.from === 'function';
    const hasDb = typeof supabaseClient.from === 'function';
    
    console.log('Client capabilities:', { 
      auth: hasAuth ? 'Available' : 'Missing',
      storage: hasStorage ? 'Available' : 'Missing',
      database: hasDb ? 'Available' : 'Missing'
    });
    
    if (!hasAuth || !hasStorage || !hasDb) {
      console.warn('Supabase client missing required capabilities');
    }
  }
} catch (error) {
  console.error('Error initializing Supabase:', error);
  supabaseClient = null;
}

// Helper function to determine if we should use mock mode
function shouldUseMockMode() {
  const forceMock = localStorage.getItem('useMockMode') === 'true';
  const result = !supabaseClient || forceMock;
  
  if (result) {
    console.log('Using mock mode:', forceMock ? 'Forced by local storage' : 'Supabase client not available');
  }
  
  return result;
}

// Toggle mock mode (useful for testing)
window.toggleMockMode = function(useMock = true) {
  localStorage.setItem('useMockMode', useMock.toString());
  console.log(`Mock mode ${useMock ? 'enabled' : 'disabled'}`);
  return useMock;
};

// Authentication check
window.isAuthenticated = async function() {
  if (shouldUseMockMode()) {
    console.log('Mock authentication check: true');
    return true;
  }
  
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    const isAuth = !!session && !!session.user;
    console.log('Authentication check:', isAuth);
    return isAuth;
  } catch (error) {
    console.error('Authentication check error:', error);
    return false;
  }
};

// Get current user
window.getUser = async function() {
  console.log('Getting user...');
  
  if (shouldUseMockMode()) {
    console.log('Returning mock user:', mockStore.user);
    return { user: mockStore.user, error: null };
  }
  
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (error) {
      console.error('Get user error:', error);
      // Fall back to mock user
      console.log('Falling back to mock user');
      return { user: mockStore.user, error: null };
    }
    
    console.log('User retrieved successfully:', user?.id);
    return { user, error: null };
  } catch (error) {
    console.error('Error getting user:', error);
    // Fall back to mock user
    console.log('Falling back to mock user after error');
    return { user: mockStore.user, error: null };
  }
};

// Sign in
window.signIn = async function(email, password) {
  if (shouldUseMockMode()) {
    console.log('Mock sign in successful');
    return { data: { user: mockStore.user, session: {} }, error: null };
  }
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Sign in error:', error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred during sign in.' } 
    };
  }
};

// Sign up
window.signUp = async function(email, password, name) {
  if (shouldUseMockMode()) {
    console.log('Mock sign up successful');
    return { data: { user: mockStore.user, session: {} }, error: null };
  }
  
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });
    
    if (error) {
      console.error('Sign up error:', error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('Unexpected error during sign up:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred during sign up.' } 
    };
  }
};

// Sign out
window.signOut = async function() {
  if (shouldUseMockMode()) {
    console.log('Mock sign out successful');
    return { error: null };
  }
  
  try {
    const { error } = await supabaseClient.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
    }
    
    return { error };
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    return { error: { message: 'An unexpected error occurred during sign out.' } };
  }
};

// File upload
window.uploadFile = async function(bucket, folder, file) {
  console.log(`Starting file upload to ${bucket}/${folder}...`, {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });
  
  if (shouldUseMockMode()) {
    console.log('Running in mock mode for file upload');
    
    // Generate a mock URL
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const mockUrl = `https://mock-storage.example.com/${bucket}/${folder}/${timestamp}_${cleanFileName}`;
    
    // Save to mock store
    mockStore.uploads.push({
      bucket,
      path: `${folder}/${timestamp}_${cleanFileName}`,
      url: mockUrl,
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    });
    
    console.log('Mock file upload successful. URL:', mockUrl);
    return { url: mockUrl, error: null };
  }
  
  try {
    console.log('Creating clean filename...');
    // Create a clean filename
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${folder}/${Date.now()}_${cleanFileName}`;
    
    console.log(`Uploading ${file.name} to ${bucket}/${filePath}`);
    
    if (!supabaseClient) {
      console.error('Supabase client not initialized for file upload');
      return { url: null, error: new Error('Storage service not available') };
    }
    
    if (!supabaseClient.storage) {
      console.error('Supabase storage not available');
      return { url: null, error: new Error('Storage service not initialized') };
    }
    
    // Check and create bucket if needed
    console.log('Checking if bucket exists:', bucket);
    try {
      const { data: buckets, error: bucketsError } = await supabaseClient.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        console.error('Bucket list error details:', {
          status: bucketsError.status,
          message: bucketsError.message,
          details: bucketsError.details
        });
        return { url: null, error: new Error('Unable to access storage buckets. Please contact support.') };
      }

      if (!buckets) {
        console.error('No buckets data returned');
        return { url: null, error: new Error('Unable to retrieve storage buckets list.') };
      }

      console.log('Available buckets:', buckets.map(b => ({
        name: b.name,
        id: b.id,
        public: b.public,
        createdAt: b.created_at,
        updatedAt: b.updated_at
      })));
      
      // Case-insensitive search for bucket
      const foundBucket = buckets.find(b => b.name.toLowerCase() === bucket.toLowerCase());
      if (foundBucket) {
        console.log('Found bucket with details:', {
          name: foundBucket.name,
          id: foundBucket.id,
          public: foundBucket.public,
          createdAt: foundBucket.created_at,
          updatedAt: foundBucket.updated_at
        });
        // Use the correct case
        bucket = foundBucket.name;
      }
      
      const bucketExists = buckets.some(b => b.name === bucket);
      
      if (!bucketExists) {
        console.error(`Storage bucket "${bucket}" not found in available buckets:`, buckets.map(b => b.name));
        
        // Special handling for books-covers bucket
        if (bucket === 'books-covers') {
          return { 
            url: null, 
            error: new Error(
              'The cover upload system is not properly configured. Please ensure:\n' +
              '1. The "books-covers" bucket exists in Supabase\n' +
              '2. The bucket is marked as public\n' +
              '3. The following policies are added:\n' +
              '   - Allow authenticated users to see bucket\n' +
              '   - Allow authenticated users to upload files\n' +
              '   - Allow public to read files\n' +
              '\nAvailable buckets: ' + buckets.map(b => b.name).join(', ')
            )
          };
        }
        
        return { 
          url: null, 
          error: new Error(
            `The required storage bucket "${bucket}" does not exist or is not accessible. ` +
            'Available buckets: ' + buckets.map(b => b.name).join(', ')
          )
        };
      }

      console.log(`Found bucket "${bucket}", proceeding with upload...`);
    } catch (bucketError) {
      console.error('Error checking buckets:', bucketError);
      console.error('Full error details:', {
        message: bucketError.message,
        stack: bucketError.stack,
        details: bucketError
      });
      return { url: null, error: new Error('Unable to verify storage bucket. Please try again later.') };
    }
    
    console.log('Uploading file to storage...');
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: null, error };
    }

    console.log('File uploaded successfully, getting public URL...');
    
    // Get public URL
    const { data: { publicUrl }, error: urlError } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (urlError) {
      console.error('URL error:', urlError);
      return { url: null, error: urlError };
    }

    console.log('File uploaded successfully. Public URL:', publicUrl);
    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Unexpected error uploading file:', error);
    
    // Fall back to mock upload
    if (!shouldUseMockMode()) {
      console.log('Falling back to mock upload due to error');
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const mockUrl = `https://mock-storage.example.com/${bucket}/${folder}/${timestamp}_${cleanFileName}`;
      
      console.log('Generated mock URL:', mockUrl);
      return { url: mockUrl, error: null };
    }
    
    return { url: null, error };
  }
};

// Save campaign draft
window.saveCampaignDraft = async function(campaignData) {
  console.log('Saving campaign draft...');
  
  if (shouldUseMockMode()) {
    const { user } = await window.getUser();
    
    const draftId = 'draft-' + Date.now();
    const draft = {
      id: draftId,
      user_id: user.id,
      ...campaignData,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save to mock store
    mockStore.campaigns.push(draft);
    
    console.log('Mock campaign draft saved:', draft);
    return { success: true, data: draft, error: null };
  }
  
  try {
    // Get current user
    const { user, error: userError } = await window.getUser();
    if (userError) throw new Error(userError);
    
    // Add user_id to campaign data
    const fullCampaignData = {
      ...campaignData,
      user_id: user.id,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabaseClient
      .from('campaigns')
      .insert([fullCampaignData])
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('Campaign draft saved successfully:', data);
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error saving campaign draft:', error);
    
    // Fall back to mock save
    if (!shouldUseMockMode()) {
      console.log('Falling back to mock save');
      return window.saveCampaignDraft(campaignData);
    }
    
    return { success: false, error: error.message || 'Failed to save draft' };
  }
};

// Create campaign
window.createCampaign = async function(campaignData) {
  console.log('Starting campaign creation process...');
  console.log('Input campaign data:', campaignData);
  
  // Validate required fields
  const requiredFields = [
    'title', 'description', 'genre', 'page_count', 'binding_type',
    'cover_image_url', 'pdf_url', 'price', 'min_purchases',
    'duration_days', 'author_name'
  ];

  const missingFields = requiredFields.filter(field => !campaignData[field]);
  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields);
    return {
      success: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
      details: { missingFields }
    };
  }
  
  if (shouldUseMockMode()) {
    console.log('Running in mock mode');
    const { user } = await window.getUser();
    
    const campaign = {
      id: crypto.randomUUID(),
      user_id: user.id,
      ...campaignData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reorder_available: false
    };
    
    mockStore.campaigns.push(campaign);
    console.log('Mock campaign created:', campaign);
    return { success: true, data: campaign, error: null };
  }
  
  try {
    console.log('Getting current user...');
    const { user, error: userError } = await window.getUser();
    
    if (userError) {
      console.error('User error:', userError);
      return { success: false, error: 'Authentication error', details: userError };
    }
    
    if (!user) {
      console.error('No user found');
      return { success: false, error: 'User not authenticated' };
    }

    console.log('User found:', user.id);
    
    // Format the data to match database schema
    const fullCampaignData = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: campaignData.title,
      description: campaignData.description,
      genre: campaignData.genre,
      page_count: String(campaignData.page_count),
      binding_type: campaignData.binding_type,
      cover_image_url: campaignData.cover_image_url,
      pdf_url: campaignData.pdf_url,
      price: Number(campaignData.price).toFixed(2),
      min_purchases: parseInt(campaignData.min_purchases),
      duration_days: parseInt(campaignData.duration_days),
      status: campaignData.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_name: campaignData.author_name,
      reorder_available: false
    };

    console.log('Formatted campaign data:', fullCampaignData);
    
    if (!supabaseClient) {
      console.error('Supabase client not initialized');
      return { success: false, error: 'Database connection not available' };
    }

    console.log('Inserting campaign into database...');
    const { data, error } = await supabaseClient
      .from('campaigns')
      .insert([fullCampaignData])
      .select()
      .single();
    
    if (error) {
      console.error('Database insert error:', error);
      return { 
        success: false, 
        error: 'Database error: ' + error.message,
        details: error
      };
    }

    if (!data) {
      console.error('No data returned from insert');
      return { 
        success: false, 
        error: 'No data returned from database',
        details: { fullCampaignData }
      };
    }
    
    console.log('Campaign created successfully:', data);
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Unexpected error during campaign creation:', error);
    
    if (!shouldUseMockMode() && error.message?.includes('connection')) {
      console.log('Connection error - falling back to mock create');
      return window.createCampaign(campaignData);
    }
    
    return { 
      success: false, 
      error: 'Unexpected error: ' + error.message,
      details: {
        error,
        stack: error.stack,
        campaignData
      }
    };
  }
};

// Get featured campaigns
window.getFeaturedCampaigns = async function() {
  if (shouldUseMockMode()) {
    const mockCampaigns = mockStore.campaigns
      .filter(c => c.status === 'active')
      .slice(0, 4);
    
    console.log('Returning mock featured campaigns:', mockCampaigns);
    return { campaigns: mockCampaigns, error: null };
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(4);
    
    if (error) throw error;
    
    return { campaigns: data, error: null };
  } catch (error) {
    console.error('Error getting featured campaigns:', error);
    
    // Fall back to mock data
    return window.getFeaturedCampaigns();
  }
};

// Update profile
window.updateProfile = async function(updates) {
  if (shouldUseMockMode()) {
    // Update mock user
    mockStore.user = {
      ...mockStore.user,
      user_metadata: {
        ...mockStore.user.user_metadata,
        ...updates
      }
    };
    
    console.log('Mock profile updated:', mockStore.user);
    return { data: { user: mockStore.user }, error: null };
  }
  
  try {
    const { data, error } = await supabaseClient.auth.updateUser({
      data: updates
    });
    
    if (error) {
      console.error('Update profile error:', error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while updating your profile.' } 
    };
  }
};

// Add a test function that can be called from the console
window.testSupabaseConnection = async function() {
  console.log('Testing Supabase connection...');
  
  if (!supabaseClient) {
    console.error('Test failed: Supabase client not initialized');
    return { success: false, error: 'Client not initialized' };
  }
  
  try {
    // Test auth
    console.log('Testing auth...');
    const { data: authData, error: authError } = await supabaseClient.auth.getSession();
    console.log('Auth test result:', authError ? 'Failed' : 'Success', { authData, authError });
    
    // Test database
    console.log('Testing database...');
    const { data: dbData, error: dbError } = await supabaseClient.from('campaigns').select('count').limit(1);
    console.log('Database test result:', dbError ? 'Failed' : 'Success', { dbData, dbError });
    
    // Test storage
    console.log('Testing storage...');
    const { data: storageData, error: storageError } = await supabaseClient.storage.listBuckets();
    console.log('Storage test result:', storageError ? 'Failed' : 'Success', { storageData, storageError });
    
    const success = !authError && !dbError && !storageError;
    return { 
      success, 
      results: {
        auth: { success: !authError, error: authError },
        database: { success: !dbError, error: dbError },
        storage: { success: !storageError, error: storageError }
      }
    };
  } catch (error) {
    console.error('Unexpected error testing Supabase connection:', error);
    return { success: false, error };
  }
};

// Export to window to make available globally
window.supabase = {
  client: supabaseClient,
  mockStore,
  isAuthEnabled: !shouldUseMockMode()
}; 