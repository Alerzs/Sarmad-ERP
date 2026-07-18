(function () {
          const summaryRows = document.querySelectorAll('.summary-row');
          const detailsRows = document.querySelectorAll('.details-row');
          let openId = null;
          function closeAll() {
            detailsRows.forEach(d => d.style.display = 'none');
            summaryRows.forEach(r => r.setAttribute('aria-expanded', 'false'));
          }
          closeAll();
          summaryRows.forEach(row => {
            const id = row.getAttribute('data-detail-id');
            row.setAttribute('aria-controls', id);
            function handleToggle() {
              if (openId === id) {
                closeAll();
                openId = null;
                return;
              }
              closeAll();
              const details = document.getElementById(id);
              if (details) {
                details.style.display = '';
                row.setAttribute('aria-expanded', 'true');
                openId = id;
              }
            }
            row.addEventListener('click', handleToggle);
            row.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle();
              }
            });
          });
        })();
        document.addEventListener("DOMContentLoaded", function() {
            document.querySelectorAll(".serial-checkbox").forEach(function(checkbox) {
                checkbox.addEventListener('change', function() {
                    let row = this.closest("tr");
                    let serialCell = row.querySelector(".serial-cell");
                    let itemId = this.dataset.itemId;

                    if (this.checked) {
                        if (!serialCell.querySelector("input")){
                            let wrapper = document.createElement("div");
                            wrapper.style.display = "flex";
                            wrapper.style.alignItems = "center";
                            wrapper.style.justifyContent = "center";

                            let prefix = document.createElement("span");
                            prefix.textContent = "S";
                            prefix.style.marginRight = "4px";

                            let input = document.createElement("input");
                            input.type = "text";
                            input.name = "serial_" + itemId;
                            input.placeholder = "Enter Serial";

                            wrapper.appendChild(prefix);
                            wrapper.appendChild(input);
                            serialCell.appendChild(wrapper);
                        }
                    } else {
                        serialCell.innerHTML = "";
                    }
                });
            });
        });