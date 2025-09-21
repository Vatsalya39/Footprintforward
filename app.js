// ============== SUPABASE SETUP ==============
const SUPABASE_URL = 'https://aabkrtyffcvctqdplgls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYmtydHlmZmN2Y3RxZHBsZ2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NjA2ODMsImV4cCI6MjA3MzQzNjY4M30.vRRfXWIbe2FpNdgZ4Qg4o12_QDSQyIy2lxJaamHn_lc';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('Supabase Initialized');

// Global state
let currentUser = null;

// Carbon Calculator
// Carbon Calculator
// Carbon Calculator
const EMISSION_FACTORS = {
    // Emission factors (simplified, global averages for demonstration)
    // Source: Figures are illustrative approximations based on data from EPA, DEFRA & other sources.
    
    // Electricity: kg CO2e per kWh (global average mix)
    electricity_kwh: 0.35, 
    // Fuel (Petrol/Gasoline): kg CO2e per liter
    fuel_liter: 2.31, 
    // Flights: kg CO2e per hour (simplified for single input)
    flight_per_hour: 80,
    // Trains: kg CO2e per kilometer
    train_per_km: 0.05
};

const GLOBAL_AVERAGE_TONNES = 6.11; // Global average per person

// ============== AUTHENTICATION ==============
_supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        console.log('User signed in:', currentUser);

        const { data: profile, error } = await _supabase
            .from('profiles')
            .select('username')
            .eq('id', currentUser.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
        }

        if (!profile || !profile.username) {
            console.log('Profile incomplete. Forcing user to create a profile.');
            showSection('create-profile');
            document.getElementById('profile-form-name').value = currentUser.user_metadata.full_name || '';
        } else {
            updateUIForAuthenticatedUser();
            showSection('home');
        }
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        console.log('User signed out');
        updateUIForGuestUser();
        showSection('home');
    }
});

async function signInWithGoogle() {
    const { error } = await _supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
        console.error('Error signing in with Google:', error);
    }
}

async function signOut() {
    const { error } = await _supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
    }
}

// ============== UI UPDATES ==============
function updateUIForAuthenticatedUser() {
    document.getElementById('login-li').style.display = 'none';
    document.getElementById('user-profile-li').style.display = 'block';
    document.getElementById('user-avatar').src = currentUser.user_metadata.avatar_url || 'https://placehold.co/40x40/B6CEB4/000000?text=U';
    document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
}

function updateUIForGuestUser() {
    document.getElementById('login-li').style.display = 'block';
    document.getElementById('user-profile-li').style.display = 'none';
    document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
}
// ============== DATA FETCHING & RENDERING ==============
async function fetchAndRenderCampaigns() {
    const campaignsGrid = document.getElementById('campaigns-grid');
    campaignsGrid.innerHTML = '<p>Loading campaigns...</p>';

    const { data, error } = await _supabase
        .from('campaigns')
        .select(`*, profiles:organizer_id (full_name, avatar_url), participants (user_id), likes (user_id)`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching campaigns:', error);
        campaignsGrid.innerHTML = '<p>Could not load campaigns. Check RLS policies in Supabase.</p>';
        return;
    }

    campaignsGrid.innerHTML = '';
    if (data.length === 0) {
        campaignsGrid.innerHTML = '<p>No campaigns found. Why not start one?</p>';
        return;
    }

    data.forEach(campaign => {
        const campaignCard = createCampaignCard(campaign);
        campaignsGrid.appendChild(campaignCard);
    });
}

// PASTE THIS NEW FUNCTION in app.js
async function fetchAndRenderProfile() {
    if (!currentUser) {
        // This should not happen if the UI is correct, but it's a good safeguard
        showSection('home');
        return;
    }

    // Fetch the user's full profile from the 'profiles' table
    const { data: profile, error } = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (error || !profile) {
        console.error('Error fetching profile data:', error);
        // Optionally, show an error message on the profile page
        return;
    }

    // Populate the HTML elements with the fetched data
    document.getElementById('profile-greeting').innerText = `Welcome, ${profile.full_name || 'User'}!`;
    document.getElementById('profile-avatar-display').src = profile.avatar_url || currentUser.user_metadata.avatar_url;
    document.getElementById('profile-name').innerText = profile.full_name || 'No name set';
    document.getElementById('profile-username').innerText = profile.username || 'No username set';
    document.getElementById('profile-location').innerText = profile.location || 'No location set';
    document.getElementById('profile-bio').innerText = profile.bio || 'No bio has been added yet.';

    const joinDate = new Date(currentUser.created_at).toLocaleDateString();
    document.getElementById('profile-joined-date').innerText = `Member since ${joinDate}`;
}

function createCampaignCard(campaign) {
    const card = document.createElement('div');
    card.className = 'campaign-card';
    card.dataset.campaignId = campaign.id;

    const categoryIcons = {
        'Beach Cleanup': '🏖️', 'Park Cleanup': '🌳', 'River Cleanup': '🌊',
        'Forest Cleanup': '🌲', 'Street Cleanup': '🛣️', 'Community Garden': '🌻',
        'Recycling Drive': '♻️', 'Tree Planting': '🪴', 'Other': '🌍'
    };

    const isLiked = currentUser ? campaign.likes.some(like => like.user_id === currentUser.id) : false;
    const isJoined = currentUser ? campaign.participants.some(p => p.user_id === currentUser.id) : false;
    const imageUrl = campaign.image_url;

    const imageContent = imageUrl
        ? `<div class="campaign-image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"></div>`
        : `<div class="campaign-image">${categoryIcons[campaign.category] || '🌍'}</div>`;

    card.innerHTML = imageContent + `
        <div class="campaign-content">
            <h3 class="campaign-title">${campaign.title}</h3>
            <p class="campaign-description">${campaign.description}</p>
            <div class="campaign-meta">
                <div><strong>📅 Date:</strong> ${new Date(campaign.date).toLocaleDateString()}</div>
                <div><strong>📍 Location:</strong> ${campaign.location}</div>
            </div>
            <div class="campaign-stats">
                <div class="volunteers-count">${campaign.volunteers_count || 0} Volunteers</div>
                <div class="campaign-actions">
                    <button class="like-btn ${isLiked ? 'liked' : ''}" ${!currentUser ? 'disabled' : ''}>
                        ${isLiked ? '❤️' : '🤍'} ${campaign.likes_count || 0}
                    </button>
                    <button class="btn btn--primary join-btn" ${!currentUser ? 'disabled' : ''}>
                        ${isJoined ? 'Leave' : 'Join'}
                    </button>
                </div>
            </div>
        </div>`;

    card.addEventListener('click', (e) => {
        if (!e.target.closest('.campaign-actions')) {
            openCampaignDetail(campaign.id);
        }
    });

    card.querySelector('.like-btn').addEventListener('click', () => toggleLike(campaign.id, isLiked, campaign.likes_count || 0));
    card.querySelector('.join-btn').addEventListener('click', () => toggleJoin(campaign.id, isJoined, campaign.volunteers_count || 0));

    return card;
}

// ============== DATA MODIFICATION ==============


// In app.js, REPLACE your old calculateFootprint function with this one

// Listener for the new form
document.addEventListener('DOMContentLoaded', () => {
    const carbonCalculatorFormNew = document.getElementById('carbon-calculator-form-new');
    if (carbonCalculatorFormNew) {
        carbonCalculatorFormNew.addEventListener('submit', calculateFootprint);
    }
});


function calculateFootprint(event) {
    event.preventDefault(); // Stop the page from reloading
    console.log('calculateFootprint called'); // Debug log

    // 1. Get user inputs from the new form
    const electricityKWH = parseFloat(document.getElementById('electricity-kwh').value) || 0;
    const fuelLiters = parseFloat(document.getElementById('fuel-liters').value) || 0;
    const householdMembers = parseInt(document.getElementById('household-members').value) || 1; // Default to 1 if invalid

    // Get conditional travel inputs
    let flightHours = 0;
    let trainKm = 0;

    const travelCheckbox = document.getElementById('travel-checkbox');
    if (travelCheckbox && travelCheckbox.checked) {
        flightHours = parseFloat(document.getElementById('flight-hours').value) || 0;
        trainKm = parseFloat(document.getElementById('train-km').value) || 0;
    }

    // 2. Perform Calculations (convert everything to an annual footprint in kg CO2e)
    // Assuming monthly consumption, converting to annual
    const annualElectricityFootprintKg = electricityKWH * EMISSION_FACTORS.electricity_kwh * 12;
    const annualFuelFootprintKg = fuelLiters * EMISSION_FACTORS.fuel_liter * 12;
    // Monthly travel * 12 to get annual
    const annualFlightFootprintKg = flightHours * EMISSION_FACTORS.flight_per_hour * 12;
    const annualTrainFootprintKg = trainKm * EMISSION_FACTORS.train_per_km * 12;

    const totalAnnualFootprintKg = annualElectricityFootprintKg + annualFuelFootprintKg + annualFlightFootprintKg + annualTrainFootprintKg;
    const totalAnnualFootprintTonnes = totalAnnualFootprintKg / 1000;

    const individualAnnualFootprintTonnes = totalAnnualFootprintTonnes / householdMembers;

    // 3. Prepare the results and display them
    displayFootprintResult(totalAnnualFootprintTonnes, individualAnnualFootprintTonnes);

    // DO NOT call showSection('home') here!
}

function displayFootprintResult(totalTonnes, individualTonnes) {
    const resultDiv = document.getElementById('footprint-result');
    
    let rating = '';
    let ratingDescription = '';
    let textColor = 'var(--color-primary-green-dark)'; // Default text color is a dark green
    const globalAverage = 6.11;

    // The logic to determine the rating remains the same
    if (individualTonnes <= 3.0) {
        rating = "Excellent! ✨";
        ratingDescription = "Your individual footprint is significantly below the global target. You are a true environmental champion!";
    } else if (individualTonnes > 3.0 && individualTonnes <= 5.0) {
        rating = "Good! ✅";
        ratingDescription = "Your individual footprint is well below the global average. You are making a very positive impact.";
    } else if (individualTonnes > 5.0 && individualTonnes <= 7.0) {
        rating = "Fine";
        ratingDescription = "Your individual footprint is close to the global average. You are doing okay, but there's room for improvement.";
        textColor = 'var(--color-orange-400)'; // Change text color to yellow/orange
    } else if (individualTonnes > 7.0 && individualTonnes <= 10.0) {
        rating = "Poor ⚠️";
        ratingDescription = "Your individual footprint is above the global average. Let's explore ways to reduce your environmental impact!";
        textColor = 'var(--color-orange-400)'; // Change text color to yellow/orange
    } else {
        rating = "Very Poor 💀";
        ratingDescription = "Your individual footprint is significantly higher than the global average. We urgently need to explore ways to reduce your consumption and environmental impact.";
        textColor = 'var(--color-red-400)'; // Change text color to red
    }

    const individualDifference = (individualTonnes - globalAverage);

    // Apply the fixed background color and the dynamic text color
    resultDiv.style.backgroundColor = 'var(--color-tertiary-green)';
    resultDiv.style.color = textColor;

    resultDiv.innerHTML = `
        <div class="footprint-rating" style="color: ${textColor};">${rating}</div>
        <h4>Total Annual Household Footprint: <strong style="color: ${textColor};">${totalTonnes.toFixed(2)} tonnes of CO₂e</strong></h4>
        <h4>Your Individual Annual Footprint: <strong style="color: ${textColor};">${individualTonnes.toFixed(2)} tonnes of CO₂e</strong></h4>
        <p>${ratingDescription}</p>
        <hr style="margin: 24px 0; border-color: ${textColor}; opacity: 0.5;">
        <p>The global average carbon footprint **per person** is **${globalAverage.toFixed(2)} tonnes per year**.</p>
        <p>Your individual footprint is **${Math.abs(individualDifference).toFixed(2)} tonnes ${individualDifference > 0 ? 'higher' : 'lower'}** than the global average.</p>
    `;
    resultDiv.classList.remove('hidden');
}
async function createCampaign(event) {
    event.preventDefault();
    if (!currentUser) {
        alert("You must be logged in to create a campaign.");
        return;
    }

    const form = event.target;
    const editingId = form.dataset.editingId;
    const formData = new FormData(form);
    const imageFile = document.getElementById('campaign-image-upload').files[0];

    const campaignData = {
        title: formData.get('campaign-title'),
        description: formData.get('campaign-description'),
        date: formData.get('campaign-date'),
        time: formData.get('campaign-time'),
        location: formData.get('campaign-location'),
        category: formData.get('campaign-category'),
        duration: formData.get('campaign-duration'),
        organizer_id: currentUser.id
    };

    if (imageFile) {
        const filePath = `public/${currentUser.id}-${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await _supabase.storage.from('campaign-photos').upload(filePath, imageFile);
        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            alert('Failed to upload image.');
            return;
        }
        const { data: urlData } = _supabase.storage.from('campaign-photos').getPublicUrl(filePath);
        campaignData.image_url = urlData.publicUrl;
    }

    let error;
    if (editingId) {
        const { error: updateError } = await _supabase.from('campaigns').update(campaignData).eq('id', editingId);
        error = updateError;
    } else {
        const { data, error: insertError } = await _supabase.from('campaigns').insert(campaignData).select().single();
        error = insertError;
        if (data) {
            await _supabase.from('participants').insert({ campaign_id: data.id, user_id: currentUser.id });
        }
    }

    if (error) {
        console.error('Error saving campaign:', error);
        alert('Failed to save campaign.');
    } else {
        alert(`Campaign ${editingId ? 'updated' : 'created'} successfully!`);
        form.reset();
        delete form.dataset.editingId;
        document.querySelector('#create-campaign-modal h3').innerText = 'Start a New Campaign';
        document.querySelector('#campaign-form button[type="submit"]').innerText = 'Create Campaign';
        closeCreateCampaignModal();
        fetchAndRenderCampaigns();
    }
}

async function saveProfile(event) {
    event.preventDefault();
    if (!currentUser) {
        alert('You are not logged in.');
        return;
    }
    const username = document.getElementById('profile-form-username').value.trim();
    const fullName = document.getElementById('profile-form-name').value.trim();
    const bio = document.getElementById('profile-form-bio').value.trim();
    const location = document.getElementById('profile-form-location').value.trim();

    // Try to upsert (insert or update) the profile
    const { error } = await _supabase.from('profiles').upsert({
        id: currentUser.id,
        username: username,
        full_name: fullName,
        bio: bio,
        location: location,
        updated_at: new Date()
    });

    if (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile. The username might already be taken.');
    } else {
        alert('Profile saved successfully!');
        updateUIForAuthenticatedUser();
        showSection('home');
    }
}

async function toggleLike(campaignId, isLiked, currentLikes) {
    if (!currentUser) {
        alert("Please log in to like campaigns.");
        return;
    }

    if (isLiked) {
        await _supabase.from('likes').delete().match({ campaign_id: campaignId, user_id: currentUser.id });
        await _supabase.from('campaigns').update({ likes_count: currentLikes - 1 }).eq('id', campaignId);
    } else {
        await _supabase.from('likes').insert({ campaign_id: campaignId, user_id: currentUser.id });
        await _supabase.from('campaigns').update({ likes_count: currentLikes + 1 }).eq('id', campaignId);
    }
    fetchAndRenderCampaigns();
}

async function toggleJoin(campaignId, isJoined, currentVolunteers) {
    if (!currentUser) {
        alert("Please log in to join campaigns.");
        return;
    }

    if (isJoined) {
        await _supabase.from('participants').delete().match({ campaign_id: campaignId, user_id: currentUser.id });
        await _supabase.from('campaigns').update({ volunteers_count: currentVolunteers - 1 }).eq('id', campaignId);
    } else {
        await _supabase.from('participants').insert({ campaign_id: campaignId, user_id: currentUser.id });
        await _supabase.from('campaigns').update({ volunteers_count: currentVolunteers + 1 }).eq('id', campaignId);
    }
    fetchAndRenderCampaigns();
}

async function deleteCampaign(campaignId) {
    const isConfirmed = confirm('Are you sure you want to permanently delete this campaign? This action cannot be undone.');
    if (isConfirmed && currentUser) {
        const { error } = await _supabase.from('campaigns').delete().eq('id', campaignId).eq('organizer_id', currentUser.id);
        if (error) {
            console.error('Error deleting campaign:', error);
            alert('Failed to delete campaign.');
        } else {
            alert('Campaign deleted successfully.');
            closeCampaignDetailModal();
            fetchAndRenderCampaigns();
        }
    }
}

function openEditCampaignModal(campaign) {
    closeCampaignDetailModal();
    document.getElementById('campaign-title').value = campaign.title;
    document.getElementById('campaign-description').value = campaign.description;
    document.getElementById('campaign-date').value = campaign.date;
    document.getElementById('campaign-time').value = campaign.time;
    document.getElementById('campaign-location').value = campaign.location;
    document.getElementById('campaign-category').value = campaign.category;
    document.getElementById('campaign-duration').value = campaign.duration;

    const form = document.getElementById('campaign-form');
    form.dataset.editingId = campaign.id;
    document.querySelector('#create-campaign-modal h3').innerText = 'Edit Your Campaign';
    document.querySelector('#campaign-form button[type="submit"]').innerText = 'Save Changes';
    openCreateCampaignModal();
}

// ============== NAVIGATION & MODALS ==============


// REPLACE your old showSection function in app.js with this one
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');

    const activeLink = document.querySelector(`.nav-link[onclick*="'${sectionId}'"]`);
    if (activeLink) activeLink.classList.add('active');

    // Load data for the shown section
    if (sectionId === 'campaigns') {
        fetchAndRenderCampaigns();
    }
    // --- NEW LOGIC ADDED HERE ---
    if (sectionId === 'profile') {
        fetchAndRenderProfile();
    }
}
function openCreateCampaignModal() {
    document.getElementById('create-campaign-modal').classList.remove('hidden');
}

function closeCreateCampaignModal() {
    const form = document.getElementById('campaign-form');
    form.reset();
    delete form.dataset.editingId;
    document.querySelector('#create-campaign-modal h3').innerText = 'Start a New Campaign';
    document.querySelector('#campaign-form button[type="submit"]').innerText = 'Create Campaign';
    document.getElementById('create-campaign-modal').classList.add('hidden');
}

async function openCampaignDetail(campaignId) {
    const modal = document.getElementById('campaign-detail-modal');
    const content = document.getElementById('campaign-detail-content');
    modal.classList.remove('hidden');
    content.innerHTML = '<p>Loading campaign details...</p>';

    const { data: campaign, error } = await _supabase.from('campaigns').select(`*, profiles:organizer_id (full_name, avatar_url), participants ( profiles (id, full_name) )`).eq('id', campaignId).single();
    if (error || !campaign) {
        console.error('Error fetching campaign details:', error);
        content.innerHTML = '<p>Could not load campaign details. Please try again.</p>';
        return;
    }

    const imageUrl = campaign.image_url ? `<img src="${campaign.image_url}" alt="${campaign.title}" class="detail-image">` : '';
    content.innerHTML = `
        ${imageUrl}
        <div class="detail-content-padded">
            <div class="detail-header">
                <h3 id="detail-title-main">${campaign.title}</h3>
                <p>Organized by <strong id="detail-organizer">${campaign.profiles ? campaign.profiles.full_name : 'An unknown user'}</strong></p>
            </div>
            <div id="organizer-actions" class="form-actions" style="display: none; justify-content: flex-start; margin-bottom: 20px;">
                <button id="edit-campaign-btn" class="btn btn--secondary">Edit Campaign</button>
                <button id="delete-campaign-btn" class="btn btn--danger">Delete Campaign</button>
            </div>
            <div class="detail-meta">
                <div class="detail-meta-item">
                    <div class="detail-meta-label">📅 Date & Time</div>
                    <div class="detail-meta-value">${new Date(campaign.date).toLocaleDateString()}, ${campaign.time}</div>
                </div>
                <div class="detail-meta-item">
                    <div class="detail-meta-label">📍 Location</div>
                    <div class="detail-meta-value">${campaign.location}</div>
                </div>
                <div class="detail-meta-item">
                    <div class="detail-meta-label">⏳ Duration</div>
                    <div class="detail-meta-value">${campaign.duration}</div>
                </div>
            </div>
            <div class="detail-description">
                <p>${campaign.description}</p>
            </div>
            <div class="volunteers-section">
                <h4 class="section-title">Volunteers Joined</h4>
                <div id="detail-volunteers-list" class="volunteers-list"></div>
            </div>
        </div>
    `;

    const organizerActions = document.getElementById('organizer-actions');
    if (currentUser && currentUser.id === campaign.organizer_id) {
        organizerActions.style.display = 'flex';
        document.getElementById('delete-campaign-btn').onclick = () => deleteCampaign(campaign.id);
        document.getElementById('edit-campaign-btn').onclick = () => openEditCampaignModal(campaign);
    }
    const volunteersList = document.getElementById('detail-volunteers-list');
    if (campaign.participants && campaign.participants.length > 0) {
        volunteersList.innerHTML = '';
        campaign.participants.forEach(p => {
            if (p.profiles) {
                const volunteerBadge = document.createElement('div');
                volunteerBadge.className = 'volunteer-badge';
                volunteerBadge.innerText = p.profiles.full_name;
                volunteersList.appendChild(volunteerBadge);
            }
        });
    } else {
        volunteersList.innerHTML = '<p>No volunteers have joined yet. Be the first!</p>';
    }
}

function closeCampaignDetailModal() {
    document.getElementById('campaign-detail-modal').classList.add('hidden');
}

// ============== INITIALIZATION ==============
// ============== INITIALIZATION ==============
function populateCategoryFilters() {
    const categories = ["Beach Cleanup", "Park Cleanup", "Street Cleanup", "River Cleanup", "Forest Cleanup", "Community Garden", "Recycling Drive", "Tree Planting", "Other"];
    const filterSelect = document.getElementById('category-filter');
    const formSelect = document.getElementById('campaign-category');
    categories.forEach(cat => {
        filterSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        formSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

// Add this listener for the new calculator form
document.addEventListener('DOMContentLoaded', () => {
    // Other event listeners and initializations...
    
    // Listen for form submissions on the new calculator form
    const carbonCalculatorFormNew = document.getElementById('carbon-calculator-form-new');
    if (carbonCalculatorFormNew) {
        carbonCalculatorFormNew.addEventListener('submit', calculateFootprint);
    }
    
    populateCategoryFilters();
    document.getElementById('login-btn').addEventListener('click', signInWithGoogle);
    document.getElementById('profile-logout-btn').addEventListener('click', signOut);
    document.getElementById('campaign-form').addEventListener('submit', createCampaign);
    document.getElementById('create-profile-form').addEventListener('submit', saveProfile);
    
    // --- THIS IS THE FIX ---
    // Check the session and render the initial view only after the session is known
    _supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            currentUser = session.user;
            updateUIForAuthenticatedUser();
        } else {
            currentUser = null;
            updateUIForGuestUser();
        }
        showSection('home');
    });
    // Event listener for the new travel checkbox
    const travelCheckbox = document.getElementById('travel-checkbox');
    if (travelCheckbox) {
        travelCheckbox.addEventListener('change', (event) => {
            const travelContainer = document.getElementById('travel-inputs-container');
            if (event.target.checked) {
                travelContainer.classList.remove('hidden');
            } else {
                travelContainer.classList.add('hidden');
            }
        });
    }
});