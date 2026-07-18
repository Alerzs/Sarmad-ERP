document.getElementById('part-form').addEventListener('submit', function(event) {
            const form = event.target;
            const rows = form.querySelectorAll('tbody tr');
            let hasValidInput = false;
    
            rows.forEach(row => {
                const quantityInput = row.querySelector('input[name="quantity[]"]');
                const partIdInput = row.querySelector('input[name="part_id[]"]');
    
                if (!quantityInput.value || quantityInput.value <= 0) {
                    quantityInput.disabled = true;
                    partIdInput.disabled = true;
                } else {
                    hasValidInput = true;
                }
            });
    
            if (!hasValidInput) {
                event.preventDefault();
                alert("Please enter a quantity for at least one part.");
            }
        });