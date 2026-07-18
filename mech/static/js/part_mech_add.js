const partToProjectMap = {{ part_map_json|safe }};
            const versionMap = {{ version_map_json|safe }};
        
            const projectInput = document.querySelector('input[name="projectname"]');
            const partInput = document.querySelector('input[name="partname"]');
            const idInput = document.getElementById('idInput');
            const versionInput = document.getElementById('versionInput');
        
            function enforcePrefixWithDigits(input, prefix) {
                input.addEventListener('input', function () {
                    let current = this.value;
                    if (current.startsWith(prefix)) {
                        current = current.slice(prefix.length);
                    }
                    current = current.replace(/\D/g, '');
                    this.value = prefix + current;
                });
        
                input.addEventListener('keydown', function (e) {
                    if (this.selectionStart <= prefix.length && (e.key === 'Backspace' || e.key === 'Delete')) {
                        e.preventDefault();
                    }
                });
        
                if (!input.value.startsWith(prefix)) {
                    input.value = prefix;
                }
            }
        
            function updatePartIdAndVersion() {
                const projectName = projectInput.value.trim();
                const partName = partInput.value.trim();
                const key = `${projectName}::${partName}`;
        
                if (partToProjectMap[key]) {
                    idInput.value = 'M' + partToProjectMap[key];
                    idInput.setAttribute('readonly', true);
                    idInput.style.color = 'gray';
                } else {
                    idInput.removeAttribute('readonly');
                    idInput.style.color = '';
                    idInput.value = 'M';
                }
        
                if (versionMap[key] && versionMap[key].length > 0) {
                    const maxVersion = Math.max(...versionMap[key].map(v => parseInt(v)));
                    const nextVersion = String(maxVersion + 1).padStart(2, '0');
                    versionInput.value = 'V' + nextVersion;
                    versionInput.style.color = 'gray';
                } else {
                    versionInput.style.color = '';
                    versionInput.value = 'V';
                }
            }
        
            projectInput.addEventListener('input', updatePartIdAndVersion);
            partInput.addEventListener('input', updatePartIdAndVersion);
        
            enforcePrefixWithDigits(idInput, 'M');
            enforcePrefixWithDigits(versionInput, 'V');
        
            document.getElementById('upload-form').addEventListener('submit', function () {
                if (idInput.value.startsWith('M')) {
                    idInput.value = idInput.value.slice(1);
                }
                if (versionInput.value.startsWith('V')) {
                    versionInput.value = versionInput.value.slice(1);
                }
            });