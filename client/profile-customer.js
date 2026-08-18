const API_BASE = "http://localhost:5000/api";

const customerProfileForm = document.getElementById("customerProfileForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");

const message = document.getElementById("message");


// ==========================================
// LOAD PROFILE
// ==========================================

async function loadProfile() {

    try {

        const response = await fetch(`${API_BASE}/profile`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "Unable to load profile";
            return;
        }

        if (data.user) {
            nameInput.value = data.user.name || "";
            emailInput.value = data.user.email || "";
        }

    } catch (error) {

        console.log(error);

        message.textContent = "Server connection error";
    }
}


// ==========================================
// SAVE PROFILE
// (bio/photo are collected in the form already so the UI is ready, but
//  only name/email are sent for now — bio+photo need the customer
//  profile schema decided in Week 2, same as the WBS scopes it)
// ==========================================

customerProfileForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const profileData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim()
    };

    try {

        const response = await fetch(`${API_BASE}/profile`, {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            credentials: "include",

            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "Profile update failed";
            return;
        }

        message.textContent = "Profile updated successfully!";

        console.log(data);

    } catch (error) {

        console.log(error);

        message.textContent = "Server connection error";
    }

});


// ==========================================
// LOAD PROFILE WHEN PAGE OPENS
// ==========================================

loadProfile();
