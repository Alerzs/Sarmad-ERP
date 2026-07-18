function toggleOperations(materialId) {
        const row = document.getElementById(`operations-${materialId}`);
        if (row.style.display === 'none') {
            row.style.display = 'table-row';
        } else {
            row.style.display = 'none';
        }
    }
        function openModal(materialId) {
            document.getElementById('operationModal').style.display = 'block';
            document.getElementById('materialIdInput').value = materialId;
        }

        function closeModal() {
            document.getElementById('operationModal').style.display = 'none';
        }

        window.onclick = function(event) {
            var modal = document.getElementById('operationModal');
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }