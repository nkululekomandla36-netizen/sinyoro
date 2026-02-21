// app.js - Sinyoro App JS

document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ Sinyoro App loaded");

    // Select the button (ONLY if it exists)
    const greetBtn = document.getElementById('greetBtn');
    
    if (greetBtn) {
        greetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert("Welcome to Sinyoro!");
        });
    } else {
        console.log("ℹ️ greetBtn not found - skipping greeting button setup");
    }
});
