
 document.addEventListener('DOMContentLoaded', function() {
            const productForm = document.querySelector('#send_product');
            const mechSelect = document.querySelector('.mech_select');
            const sendButton = document.querySelector('#create-product');

            const tree = []
        
            const rows = [...document.querySelectorAll('#resizable-table tbody tr')];
            const totalQuantities = rows.reduce((sum, row) => sum + Number(row.children[1].textContent || 0), 0);
        
            function sendData(data) {
                const inpt = document.createElement('input');
                inpt.type = 'hidden';
                inpt.name = 'data';
                inpt.value = JSON.stringify(data); 
                const inpt2 = document.createElement('input');
                inpt2.type = 'hidden';
                inpt2.name = 'product';
                inpt2.value = mechSelect.value;
        
                productForm.appendChild(inpt);
                productForm.appendChild(inpt2);
                productForm.submit();
            }

            sendButton.addEventListener('click', () => {
                if (!mechSelect.value) {
                    return alert('Please select a Mech Product');
                }
        
                if (tree.length < totalQuantities) {
                    return alert('Fill all required parts before creating a product!!!');
                } else {
                    sendData(tree);
                }
            });

            function createContentWrapper(partText) {
                const contentWrapper = document.createElement("div");
                contentWrapper.classList.add('content-wrapper');
        
                const partNumber = document.createElement("p");
                partNumber.textContent = partText;
        
                const closeButton = document.createElement("button");
                closeButton.classList.add('close-button');
                closeButton.type = 'button';
                closeButton.textContent = 'X';
        
                contentWrapper.append(partNumber, closeButton);
                return { contentWrapper, closeButton, partNumber };
            }

            function addAndRemove() {
    const selects = document.querySelectorAll('.part_select');

    selects.forEach(select => {
        const row = select.closest('tr');
        const selectedCell = row.querySelector('.selected-parts');
        const quantityLimitEl = row.querySelector('.quantity-limit');
        const quantityLimit = Number(quantityLimitEl.textContent || 0);

        // Hide options for current_parts
        const existingWrappers = selectedCell.querySelectorAll('.content-wrapper');
        existingWrappers.forEach(wrapper => {
            const partText = wrapper.querySelector('p').textContent;
            const option = select.querySelector(`option[value="${CSS.escape(partText)}"]`);
            if (option) option.hidden = true;
            tree.push(partText);

            wrapper.querySelector('.close-button').addEventListener('click', () => {
                wrapper.remove();
                if (option) option.hidden = false; // unhide option
                const idx = tree.indexOf(partText);
                if (idx > -1) tree.splice(idx, 1);
            });
        });

        // Listen for user adding parts
        select.addEventListener('input', function() {
            const selectedPart = this.value;
            if (!selectedPart) return;

            if (selectedCell.children.length >= quantityLimit) {
                this.value = "Select Part to add";
                return alert('You have reached the maximum part limit');
            }

            const contentWrapper = document.createElement('div');
            contentWrapper.classList.add('content-wrapper');
            const partNumber = document.createElement('p');
            partNumber.textContent = selectedPart;
            const closeButton = document.createElement('button');
            closeButton.classList.add('close-button');
            closeButton.type = 'button';
            closeButton.textContent = 'X';
            contentWrapper.append(partNumber, closeButton);
            selectedCell.appendChild(contentWrapper);

            // Hide the selected option
            const option = select.querySelector(`option[value="${CSS.escape(selectedPart)}"]`);
            if (option) option.hidden = true;

            tree.push(selectedPart);
            this.value = "Select Part to add";

            closeButton.addEventListener('click', () => {
                contentWrapper.remove();
                if (option) option.hidden = false; // re-add to select
                const idx = tree.indexOf(selectedPart);
                if (idx > -1) tree.splice(idx, 1);
            });
        });
    });
}
 
            addAndRemove();
        
        });