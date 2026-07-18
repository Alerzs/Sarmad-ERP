const statusDisplay = {
            'AC':'Accepted',
            'RJ': 'Rejected',
            'CN': 'Conditional',
            'ND':'Not Determined',
            'NA':'Not Available',
        }

        function expand(){
            const table = document.querySelector('table')
            const data = JSON.parse("{{ palets|escapejs }}")
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Index</th>
                        <th>Part Number</th>
                        <th>Project</th>
                        <th>Board</th>
                        <th>Status</th>
                        <th>Quantity</th>
                    </tr>
                </thead>
                <tbody>
            `
            data.forEach((plt, index) => {
                table.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${plt.part_number}</td>
                        <td>${plt.req__board__project_name__name}</td>
                        <td>${plt.req__board__title}V-${plt.req__board__version}</td>
                        <td>${statusDisplay[plt.status]}</td>
                        <td>${plt.quantity || 0}</td>
                    </tr>
                `
            })
            if (data.length === 0) {
                table.innerHTML += `
                    <tr>
                        <td colspan="6">No parts available.</td>
                    </tr>
                `
            }
            table.innerHTML += `
                </tbody>
                <tfoot>
                    <tr style="cursor: pointer;" onclick="window.location.reload()">
                        <td class="footer" colspan="6"><b>ᐱ</b> Less Details <b>ᐱ</b></td>
                    </tr>
                </tfoot>
            `
        }