        function confirmSubmit(e) {
            const currentRow = e.target.closest('tr')
            if (currentRow.children[3].textContent === 'Partial Assemble'){
                alert('Board must be Compeleted before sending to QC!!!')
                return false
            }
            return confirm("Are you sure you want to send the selected boards to QC?");
        }
        function toggleOperations(boardId) {
        const row = document.getElementById(`operations-${boardId}`);
        if (row.style.display === 'none') {
            row.style.display = 'table-row';
        } else {
            row.style.display = 'none';
        }
        }
        function openModal(boardId) {
            document.getElementById('operationModal').style.display = 'block';
            document.getElementById('boardIdInput').value = boardId;
        }
        function closeModal() {
            document.getElementById('operationModal').style.display = 'none';
        }
        window.onclick = function(event) {
            let modal = document.getElementById('operationModal');
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }