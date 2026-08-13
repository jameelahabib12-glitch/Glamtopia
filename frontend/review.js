const reviewForm =
    document.getElementById("reviewForm");

const message =
    document.getElementById("message");


reviewForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const bookingId =
            document.getElementById("bookingId")
                .value.trim();


        const rating =
            Number(
                document.getElementById("rating")
                    .value
            );


        const comment =
            document.getElementById("comment")
                .value.trim();


        if (!bookingId) {

            message.textContent =
                "Booking ID is required";

            return;
        }


        if (!rating) {

            message.textContent =
                "Please select a rating";

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/reviews",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body: JSON.stringify({

                            bookingId,

                            rating,

                            comment

                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                message.textContent =
                    data.message ||
                    "Review submission failed";

                return;
            }


            message.textContent =
                "Review submitted successfully! ⭐";


            reviewForm.reset();


            console.log(data);


        } catch (error) {

            console.error(error);

            message.textContent =
                "Server connection error";

        }

    }
);