document.getElementById("file-upload").addEventListener("change", function () {
                const fileName = this.files[0] ? this.files[0].name : "No file chosen"
                document.getElementById("file-name").textContent = fileName
            });
            function enforcePrefixWithDigits(input, prefix) {
                input.addEventListener('input', function () {
                    let current = this.value;
                    if (current.startsWith(prefix)) {
                        current = current.slice(prefix.length)
                    }
                    current = current.replace(/\D/g, '')
                    this.value = prefix + current
                });
        
                input.addEventListener('keydown', function (e) {
                    if (this.selectionStart <= prefix.length && (e.key === 'Backspace' || e.key === 'Delete')) {
                        e.preventDefault()
                    }
                });
        
                if (!input.value.startsWith(prefix)) {
                    input.value = prefix;
                }
            }
            
            const boardToProjectMap = {{ board_map_json|safe }}
            console.log(boardToProjectMap)
            const projectInput = document.querySelector('select')
            const boardInput = document.querySelector('input[name="boardname"]')
            const idInput = document.getElementById('idInput')

            function updateBoardId() {
                const projectName = projectInput.value.trim()
                const boardName = boardInput.value.trim()
                const key = `${projectName}::${boardName}`

                if (boardToProjectMap[key]) {
                    idInput.value = 'E' + boardToProjectMap[key]
                    idInput.setAttribute('readonly', true)
                    idInput.style.color = 'gray'
                } else {
                    idInput.value = 'E';
                    idInput.removeAttribute('readonly')
                    idInput.style.color = ''
                }
            }

            projectInput.addEventListener('input', updateBoardId)
            boardInput.addEventListener('input', updateBoardId)

            enforcePrefixWithDigits(idInput, 'E')
            enforcePrefixWithDigits(versionInput, 'V')

            document.getElementById('upload-form').addEventListener('submit', function () {
                if (idInput.value.startsWith('E')) {
                    idInput.value = idInput.value.slice(1)
                }
                if (versionInput.value.startsWith('V')) {
                    versionInput.value = versionInput.value.slice(1)
                }
            })