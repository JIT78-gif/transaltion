/**
 * =========================================================================
 * CONTACT SELECTION VISUAL FEEDBACK
 * =========================================================================
 * This script updates the visual confirmation display when a contact is selected
 */

document.addEventListener('DOMContentLoaded', function () {
    const contactSelect = document.getElementById('contact-select');
    const selectedContactDisplay = document.getElementById('selected-contact-display');

    // Update display when contact changes
    contactSelect.addEventListener('change', function () {
        const selectedOption = this.options[this.selectedIndex];
        const contactName = selectedOption.text;
        const contactNumber = selectedOption.value;

        // Update the confirmation display with both name and phone number
        selectedContactDisplay.textContent = `${contactName} — ${contactNumber}`;

        // Enhanced logging for debugging
        console.log("═══════════════════════════════════════════════");
        console.log("🔄 DEBUGGING: Contato alterado");
        console.log("═══════════════════════════════════════════════");
        console.log("Novo Contato Selecionado:", contactName);
        console.log("Novo Número:", contactNumber);
        console.log("═══════════════════════════════════════════════");

        // Visual feedback: brief highlight animation
        const confirmationBox = document.getElementById('contact-confirmation');
        confirmationBox.style.transition = 'all 0.3s ease';
        confirmationBox.style.transform = 'scale(1.02)';
        confirmationBox.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';

        setTimeout(() => {
            confirmationBox.style.transform = 'scale(1)';
            confirmationBox.style.boxShadow = 'none';
        }, 300);
    });
});
