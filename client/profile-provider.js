// Change this if your backend runs somewhere other than localhost:5000
const API_BASE = "http://localhost:5000";

const profileForm = document.getElementById("profileForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const bioInput = document.getElementById("bio");
const availabilityInput = document.getElementById("availability");

const servicesContainer =
    document.getElementById("servicesContainer");

const addServiceBtn =
    document.getElementById("addServiceBtn");

const message =
    document.getElementById("message");


// ==========================================
// ADD SERVICE INPUT
// ==========================================

function addService(name = "", price = "") {

    const serviceDiv = document.createElement("div");

    serviceDiv.className = "service";

    serviceDiv.innerHTML = `
        <input
            type="text"
            class="service-name"
            placeholder="Service name"
            value="${name}"
        >

        <input
            type="number"
            class="service-price"
            placeholder="Price"
            value="${price}"
            min="0"
        >

        <button
            type="button"
            class="remove-btn"
        >
            Remove
        </button>
    `;

    const removeButton =
        serviceDiv.querySelector(".remove-btn");

    removeButton.addEventListener("click", () => {
        serviceDiv.remove();
    });

    servicesContainer.appendChild(serviceDiv);
}


// ==========================================
// ADD SERVICE BUTTON
// ==========================================

addServiceBtn.addEventListener("click", () => {
    addService();
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


        // User information
        if (data.user) {

            nameInput.value =
                data.user.name || "";

            emailInput.value =
                data.user.email || "";
        }


        // Provider profile
        if (data.profile) {

            bioInput.value =
                data.profile.bio || "";

            availabilityInput.value =
                data.profile.availability || "";


            servicesContainer.innerHTML = "";


            if (
                data.profile.services &&
                data.profile.services.length > 0
            ) {

                data.profile.services.forEach(service => {

                    addService(
                        service.name,
                        service.price
                    );

                });

            } else {

                addService();

            }

        } else {

            addService();

        }

    } catch (error) {

        console.log(error);

        message.textContent =
            "Server connection error";
    }
}


// ==========================================
// SAVE PROFILE
// ==========================================

profileForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const serviceInputs =
        document.querySelectorAll(".service");


    const services = [];


    serviceInputs.forEach(service => {

        const serviceName =
            service.querySelector(".service-name").value.trim();

        const servicePrice =
            Number(
                service.querySelector(".service-price").value
            );


        if (serviceName && servicePrice >= 0) {

            services.push({
                name: serviceName,
                price: servicePrice
            });

        }

    });


    const profileData = {

        name: nameInput.value.trim(),

        email: emailInput.value.trim(),

        bio: bioInput.value.trim(),

        services: services,

        availability:
            availabilityInput.value.trim()
    };


    try {

        const response = await fetch(
            `${API_BASE}/api/profile`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify(profileData)
            }
        );


        const data = await response.json();


        if (!response.ok) {

            message.textContent =
                data.message || "Profile update failed";

            return;
        }


        message.textContent =
            "Profile updated successfully!";


        console.log(data);


    } catch (error) {

        console.log(error);

        message.textContent =
            "Server connection error";
    }

});


// ==========================================
// LOAD PROFILE WHEN PAGE OPENS
// ==========================================

loadProfile();