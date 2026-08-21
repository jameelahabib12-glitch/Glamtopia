const API_BASE = "http://localhost:5000/api";

const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const businessNameInput = document.getElementById("business_name");
const locationInput = document.getElementById("location");
const categoryInput = document.getElementById("category");
const contactInfoInput = document.getElementById("contact_info");
const bioInput = document.getElementById("bio");
const message = document.getElementById("message");
const saveBtn = document.getElementById("saveBtn");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

// Whether the logged-in provider already has a ProviderProfile.
// null profile = brand new provider = create mode = POST /api/providers.
// existing profile = edit mode = PATCH /api/providers/me.
let hasExistingProfile = false;

// ==========================================
// LOAD PROFILE (also doubles as the auth/role check)
// ==========================================

async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            window.location.href = "../login.html";
            return;
        }

        const authData = await response.json();
        if (authData.user.role !== "provider") {
            window.location.href = "../customer-dashboard.html";
            return;
        }

        nameInput.value = authData.user.name || "";
        emailInput.value = authData.user.email || "";

        const profileRes = await fetch(`${API_BASE}/profile`, {
            method: "GET",
            credentials: "include",
        });
        const profileData = await profileRes.json();

        if (profileData.profile) {
            hasExistingProfile = true;
            pageTitle.textContent = "Edit Your Provider Profile";
            pageSubtitle.textContent = "Update your public business profile below.";
            saveBtn.textContent = "Save Changes";

            businessNameInput.value = profileData.profile.business_name || "";
            locationInput.value = profileData.profile.location || "";
            categoryInput.value = profileData.profile.category || "";
            contactInfoInput.value = profileData.profile.contact_info || "";
            bioInput.value = profileData.profile.bio || "";
        }
        // else: stay in create mode, form starts blank — this is the
        // brand-new-provider path that was broken before.

    } catch (error) {
        console.error(error);
        message.textContent = "Server connection error";
    }
}

// ==========================================
// SAVE PROFILE (create OR update, depending on mode)
// ==========================================

profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";
    saveBtn.disabled = true;
    saveBtn.textContent = hasExistingProfile ? "Saving…" : "Creating profile…";

    const profileData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        business_name: businessNameInput.value.trim(),
        location: locationInput.value.trim(),
        category: categoryInput.value,
        contact_info: contactInfoInput.value.trim(),
        bio: bioInput.value.trim(),
    };

    try {
        let response;

        if (hasExistingProfile) {
            // Editing an existing profile — business fields go through
            // /api/providers/me.
            response = await fetch(`${API_BASE}/providers/me`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(profileData),
            });
        } else {
            // First-time setup — this is the actual fix: brand-new providers
            // must POST to /api/providers to create their profile, not PUT
            // to /api/profile (which has nothing to update yet).
            response = await fetch(`${API_BASE}/providers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(profileData),
            });
        }

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "Could not save your profile.";
            saveBtn.disabled = false;
            saveBtn.textContent = hasExistingProfile ? "Save Changes" : "Save Profile";
            return;
        }

        message.textContent = "Profile saved! Taking you to your dashboard…";
        setTimeout(() => {
            window.location.href = "provider-dashboard.html";
        }, 600);

    } catch (error) {
        console.error(error);
        message.textContent = "Server connection error";
        saveBtn.disabled = false;
        saveBtn.textContent = hasExistingProfile ? "Save Changes" : "Save Profile";
    }
});

// ==========================================
// LOAD PROFILE WHEN PAGE OPENS
// ==========================================

loadProfile();
