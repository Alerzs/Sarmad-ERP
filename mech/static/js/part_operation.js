function confirmSubmit(){
            confirm('are you sure you want to send the part to the assembly?')
        }
        function toggleOperations(partId) {
        const row = document.getElementById(`operations-${partId}`);
        if (row.style.display === 'none') {
            row.style.display = 'table-row';
        } else {
            row.style.display = 'none';
        }
    }
        function openModal(partId) {
            document.getElementById('operationModal').style.display = 'block';
            document.getElementById('partIdInput').value = partId;
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
        function validateAndSubmit(input, requiredExtension) {
        const file = input.files[0];

        if (!file) {
            alert("No file selected.");
            return;
        }

        const fileName = file.name.toLowerCase();
        const isValid = fileName.endsWith(requiredExtension);

        if (!isValid) {
            alert(`Invalid file type. Only ${requiredExtension} files are allowed.`);
            input.value = "";
            return;
        }
        alert("File type is valid. Uploading...");
        input.form.submit();
    }