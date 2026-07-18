const productForm = document.querySelector('#send_product')
    const mechSelect = document.querySelector('.mech_select')
    
    function sendData(data){
        const inpt = document.createElement('input')
        inpt.type = 'hidden'
        inpt.name = 'data'
        inpt.value = data
        const inpt2 = document.createElement('input')
        inpt2.type = 'hidden'
        inpt2.name = 'product'
        inpt2.value = mechSelect.value
        
        productForm.appendChild(inpt)
        productForm.appendChild(inpt2)
        productForm.submit()
    }

    const sendButton = document.querySelector('#create-product')
    const sel = document.getElementById('projectSelect')
    const form = document.querySelector('form')
    sel.addEventListener("change", (e) => {
        form.submit()
    })

    document.addEventListener('DOMContentLoaded', function() {

    const rows = [...document.querySelectorAll('#resizable-table tbody tr')]
    const totalQuantities = [...rows].reduce((sum, row) => sum + +row.children[1].textContent, 0)

    sendButton.addEventListener('click', () => {
        if (mechSelect.value === 'Select Mech Product'){
            return alert('Please select a Mech Product')
        } 
        if (tree.length < totalQuantities){
            return alert('Fill all required parts before creating a product!!!')
        }else{
            sendData(tree)
        }
    })

    const selects = document.querySelectorAll('.part_select');
    const tree = []

    selects.forEach(select => {
        select.addEventListener('input', function() {
            const selectedPart = this.value;
            if (!selectedPart) return

            const selectedCell = this.closest('tr').querySelector('.selected-parts')
            const quantityLimit = this.closest('tr').querySelector('.quantity-limit')

            if (+quantityLimit.textContent === selectedCell.children.length) return alert('you have reached the maximum part limit')

            const contentWrapper = document.createElement("div")
            contentWrapper.classList.add('content-wrapper')
            const partNumber = document.createElement("p")
            partNumber.textContent = selectedPart
            const closeButton = document.createElement("button")
            closeButton.classList.add('close-button')
            closeButton.type = 'button'
            closeButton.textContent = 'X'
            contentWrapper.append(partNumber, closeButton)
            selectedCell.appendChild(contentWrapper)

            const option = this.querySelector(`option[value="${selectedPart}"]`)
            if (option) option.hidden = true

            tree.push(selectedPart)
            // console.log('tree:', tree)

            this.value = "Select Part to add"
            closeButton.addEventListener('click', () => {
                contentWrapper.remove()
                if (option) option.hidden = false
                this.value = "Select Part to add"

                const index = tree.indexOf(selectedPart)
                if (index > -1) tree.splice(index, 1)
            });
        });
    });
});