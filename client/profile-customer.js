const customerProfileForm = document.getElementById("customerProfileForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const bioInput = document.getElementById("bio");
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");

const message = document.getElementById("message");

// Change this if your backend runs somewhere other than localhost:5000
const API_BASE = "http://localhost:5000";


// ==========================================
// PHOTO PREVIEW (before upload)
// ==========================================

photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        photoPreview.innerHTML = `<img src="${e.target.result}" alt="Profile photo preview">`;
    };
    reader.readAsDataURL(file);
});


// ==========================================
// LOAD PROFILE
// ==========================================

async function loadProfile() {

    try {

        const response = await fetch(`${API_BASE}/api/profile`, {
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
            bioInput.value = data.user.bio || "";

            if (data.user.photo) {
                photoPreview.innerHTML = `<img src="${API_BASE}${data.user.photo}" alt="Profile photo">`;
            }
        }

    } catch (error) {

        console.log(error);

        message.textContent = "Server connection error";
    }
}


// ==========================================
// SAVE PROFILE
// Uses FormData (not JSON) because a photo file may be attached.
// ==========================================

customerProfileForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const formData = new FormData();
    formData.append("name", nameInput.value.trim());
    formData.append("email", emailInput.value.trim());
    formData.append("bio", bioInput.value.trim());

    if (photoInput.files[0]) {
        formData.append("photo", photoInput.files[0]);
    }

    try {

        const response = await fetch(`${API_BASE}/api/profile`, {
            method: "PUT",

            // NOTE: don't set Content-Type manually here — the browser sets
            // the correct multipart/form-data boundary automatically when
            // the body is a FormData object.
            credentials: "include",

            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "Profile update failed";
            return;
        }

        message.textContent = "Profile updated successfully!";

        if (data.user && data.user.photo) {
            photoPreview.innerHTML = `<img src="${API_BASE}${data.user.photo}" alt="Profile photo">`;
        }

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
