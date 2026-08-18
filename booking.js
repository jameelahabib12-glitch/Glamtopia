[1mdiff --git a/models/booking.js b/models/booking.js[m
[1mindex a1d5233..d35de0c 100644[m
[1m--- a/models/booking.js[m
[1m+++ b/models/booking.js[m
[36m@@ -1,5 +1,10 @@[m
 const mongoose = require("mongoose");[m
 [m
[32m+[m[32m// PLACEHOLDER — Booking is Jameela's Week 2 deliverable (booking creation +[m
[32m+[m[32m// conflict prevention, per the WBS critical path). This minimal version[m
[32m+[m[32m// exists only so Review can be tested locally right now (reviews require[m
[32m+[m[32m// a completed booking to exist). Replace/reconcile this with Jameela's[m
[32m+[m[32m// real Booking model as soon as she has it — do not treat this as final.[m
 const bookingSchema = new mongoose.Schema([m
     {[m
         customer: {[m
[36m@@ -33,12 +38,7 @@[m [mconst bookingSchema = new mongoose.Schema([m
 [m
         status: {[m
             type: String,[m
[31m-            enum: [[m
[31m-                "pending",[m
[31m-                "confirmed",[m
[31m-                "completed",[m
[31m-                "cancelled"[m
[31m-            ],[m
[32m+[m[32m            enum: ["pending", "confirmed", "completed", "cancelled"],[m
             default: "pending"[m
         }[m
     },[m
[36m@@ -47,6 +47,4 @@[m [mconst bookingSchema = new mongoose.Schema([m
     }[m
 );[m
 [m
[31m-module.exports =[m
[31m-    mongoose.models.Booking ||[m
[31m-    mongoose.model("Booking", bookingSchema);[m
\ No newline at end of file[m
[32m+[m[32mmodule.exports = mongoose.model("Booking", bookingSchema);[m
