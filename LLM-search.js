        const csvUrl = 'LLM-descr.csv';
        let allData = [];
        
        Papa.parse(csvUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                allData = results.data;
                createSearchForm(allData);
                displayData(allData);
            },
            error: function(error) {
                document.getElementById('container').innerHTML = 
                    '<div class="error">Error loading CSV: ' + error.message + '</div>';
            }
        });

        function createSearchForm(data) {
            const formContainer = document.getElementById('search-form-container');
            
            // Extract unique values from 'Семейство' category (first column)
            const familyValues = new Set();
            data.forEach(entry => {
                const value = entry['Семейство'];
                if (value && value.trim() !== '') {
                    familyValues.add(value.trim());
                }
            });

            // Extract unique values from 'Тип лиценз' category
            const licenseValues = new Set();
            data.forEach(entry => {
                const value = entry['Тип лиценз'];
                if (value && value.trim() !== '') {
                    licenseValues.add(value.trim());
                }
            });

            // Extract unique values from 'Модалност' category (may contain comma-separated values)
            const modalityValues = new Set();
            data.forEach(entry => {
                const value = entry['Модалност'];
                if (value && value.trim() !== '') {
                    // Split by comma and add each value separately
                    const values = value.split(',').map(v => v.trim()).filter(v => v !== '');
                    values.forEach(v => modalityValues.add(v));
                }
            });

            // Sort values alphabetically
            const sortedFamilyValues = Array.from(familyValues).sort();
            const sortedLicenseValues = Array.from(licenseValues).sort();
            const sortedModalityValues = Array.from(modalityValues).sort();

            const formHTML = `
                <div class="search-form">
                    <h3>Семейство</h3>
                    <div class="checkbox-container" id="checkbox-container">
                        ${sortedFamilyValues.map(value => `
                            <div class="checkbox-item">
                                <label>
                                    <input type="checkbox" name="family" value="${value}">
                                    ${value}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    <h3>Име на модел</h3>
                    <div class="text-field-container">
                        <input type="text" id="name-search" placeholder="Въведете текст за търсене...">
                    </div>
                    <h3>Тип лиценз</h3>
                    <div class="checkbox-container" id="license-checkbox-container">
                        ${sortedLicenseValues.map(value => `
                            <div class="checkbox-item">
                                <label>
                                    <input type="checkbox" name="license" value="${value}">
                                    ${value}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    <h3>Видове достъп</h3>
                    <div class="checkbox-container" id="access-checkbox-container">
                        <div class="checkbox-item">
                            <label>
                                <input type="checkbox" name="access" value="chat">
                                Достъп с чат интерфейс
                            </label>
                        </div>
                        <div class="checkbox-item">
                            <label>
                                <input type="checkbox" name="access" value="api">
                                Достъп с API
                            </label>
                        </div>
                        <div class="checkbox-item">
                            <label>
                                <input type="checkbox" name="access" value="download">
                                Достъп за изтегляне
                            </label>
                        </div>
                    </div>
                    <h3>Година на публикуване</h3>
                    <div class="year-range-container">
                        <input type="text" id="year-start" placeholder="От година">
                        <span>-</span>
                        <input type="text" id="year-end" placeholder="До година">
                    </div>
                    <h3>Размер на модела (в брой параметри)</h3>
                    <div class="checkbox-container" id="size-checkbox-container">
                        <div class="checkbox-item">
                            <label>
                                <input type="checkbox" name="size" value="very-small">
                                Много малки (p&lt;1B)
                            </label>
                        </div>
                        <div class="checkbox-item">
                            <label>
                                <input type="checkbox" name="size" value="small">
                                Малки (1B&lt;=p&lt;7B)
                            </label>
                        </div>
                        <div class="checkbox-item">
                            <label>
                                <input type="checkbox" name="size" value="medium">
                                Средни (7B&lt;=p&lt;70B)
                            </label>
                        </div>
                        <div class="checkbox-item">
                            <label>
                                <input type="checkbox" name="size" value="large">
                                Големи (70B&lt;=p&lt;400B)
                            </label>
                        </div>
                        <div class="checkbox-item">
                            <label>
                                <input type="checkbox" name="size" value="very-large">
                                Много големи (400B&lt;=p)
                            </label>
                        </div>
                    </div>
                    <h3>Модалност</h3>
                    <div class="checkbox-container" id="modality-checkbox-container">
                        ${sortedModalityValues.map(value => `
                            <div class="checkbox-item">
                                <label>
                                    <input type="checkbox" name="modality" value="${value}">
                                    ${value}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    <button class="search-button" onclick="filterData()">Търси</button>
                </div>
            `;

            formContainer.innerHTML = formHTML;
        }

        function filterData() {
            const familyCheckboxes = document.querySelectorAll('input[name="family"]:checked');
            const selectedFamilyValues = Array.from(familyCheckboxes).map(cb => cb.value);
            
            const licenseCheckboxes = document.querySelectorAll('input[name="license"]:checked');
            const selectedLicenseValues = Array.from(licenseCheckboxes).map(cb => cb.value);
            
            const accessCheckboxes = document.querySelectorAll('input[name="access"]:checked');
            const selectedAccessValues = Array.from(accessCheckboxes).map(cb => cb.value);
            
            const sizeCheckboxes = document.querySelectorAll('input[name="size"]:checked');
            const selectedSizeValues = Array.from(sizeCheckboxes).map(cb => cb.value);
            
            const modalityCheckboxes = document.querySelectorAll('input[name="modality"]:checked');
            const selectedModalityValues = Array.from(modalityCheckboxes).map(cb => cb.value);
            
            const nameSearch = document.getElementById('name-search').value.trim().toLowerCase();
            const yearStart = document.getElementById('year-start').value.trim();
            const yearEnd = document.getElementById('year-end').value.trim();

            let filteredData = allData;

            // Filter by family checkboxes if any are selected
            if (selectedFamilyValues.length > 0) {
                filteredData = filteredData.filter(entry => {
                    const familyValue = entry['Семейство'];
                    return familyValue && selectedFamilyValues.includes(familyValue.trim());
                });
            }

            // Filter by license checkboxes if any are selected
            if (selectedLicenseValues.length > 0) {
                filteredData = filteredData.filter(entry => {
                    const licenseValue = entry['Тип лиценз'];
                    return licenseValue && selectedLicenseValues.includes(licenseValue.trim());
                });
            }

            // Filter by access checkboxes if any are selected
            if (selectedAccessValues.length > 0) {
                filteredData = filteredData.filter(entry => {
                    return selectedAccessValues.some(accessType => {
                        if (accessType === 'chat') {
                            return entry['Достъп с чат интерфейс'] && entry['Достъп с чат интерфейс'].toLowerCase().includes('да');
                        } else if (accessType === 'api') {
                            return entry['Достъп с API'] && entry['Достъп с API'].toLowerCase().includes('да');
                        } else if (accessType === 'download') {
                            return entry['Достъп за изтегляне'] && entry['Достъп за изтегляне'].toLowerCase().includes('да');
                        }
                        return false;
                    });
                });
            }

            // Filter by year range if either start or end year is provided
            if (yearStart !== '' || yearEnd !== '') {
                filteredData = filteredData.filter(entry => {
                    const dateValue = entry['Дата на публикуване'];
                    if (!dateValue) return false;
                    
                    // Extract 4-digit year starting with 20
                    const yearMatch = dateValue.match(/20\d{2}/);
                    if (!yearMatch) return false;
                    
                    const publicationYear = parseInt(yearMatch[0]);
                    
                    // Check start year if provided
                    if (yearStart !== '') {
                        const startYear = parseInt(yearStart);
                        if (publicationYear < startYear) return false;
                    }
                    
                    // Check end year if provided
                    if (yearEnd !== '') {
                        const endYear = parseInt(yearEnd);
                        if (publicationYear > endYear) return false;
                    }
                    
                    return true;
                });
            }

            // Filter by checkboxes if any are selected
            if (selectedSizeValues.length > 0) {
                filteredData = filteredData.filter(entry => {
                    const sizeValue = entry['Размер в брой параметри'];
                    if (!sizeValue) return false;
                    
                    // Exclude entries with 'неизвестно'
                    if (sizeValue.toString().toLowerCase().includes('неизвестно')) {
                        return false;
                    }
                    
                    // Extract number and convert to billions
                    const sizeStr = sizeValue.toString().toLowerCase();
                    let sizeInBillions = 0;
                    
                    // Parse different formats: "7B", "1.5B", "500M", etc.
                    const match = sizeStr.match(/([\d.]+)\s*([bmk])?/i);
                    if (match) {
                        const num = parseFloat(match[1]);
                        const unit = match[2] ? match[2].toLowerCase() : '';
                        
                        if (unit === 'b') {
                            sizeInBillions = num;
                        } else if (unit === 'm') {
                            sizeInBillions = num / 1000;
                        } else if (unit === 'k') {
                            sizeInBillions = num / 1000000;
                        } else {
                            // Assume billions if no unit
                            sizeInBillions = num;
                        }
                    }
                    
                    // Check if size matches any selected category
                    return selectedSizeValues.some(sizeCategory => {
                        if (sizeCategory === 'very-small') {
                            return sizeInBillions < 1;
                        } else if (sizeCategory === 'small') {
                            return sizeInBillions >= 1 && sizeInBillions < 7;
                        } else if (sizeCategory === 'medium') {
                            return sizeInBillions >= 7 && sizeInBillions < 70;
                        } else if (sizeCategory === 'large') {
                            return sizeInBillions >= 70 && sizeInBillions < 400;
                        } else if (sizeCategory === 'very-large') {
                            return sizeInBillions >= 400;
                        }
                        return false;
                    });
                });
            }

            // Filter by modality checkboxes if any are selected
            if (selectedModalityValues.length > 0) {
                filteredData = filteredData.filter(entry => {
                    const modalityValue = entry['Модалност'];
                    if (!modalityValue) return false;
                    
                    // Check if any selected modality is contained in the entry's modality field
                    return selectedModalityValues.some(selectedModality => {
                        return modalityValue.toLowerCase().includes(selectedModality.toLowerCase());
                    });
                });
            }

            // Filter by name text if not empty
            if (nameSearch !== '') {
                filteredData = filteredData.filter(entry => {
                    const nameValue = entry['Име'];
                    return nameValue && nameValue.toLowerCase().includes(nameSearch);
                });
            }

            displayData(filteredData);
        }

        function displayData(data) {
            const container = document.getElementById('container');
            container.innerHTML = '';

            if (data.length === 0) {
                container.innerHTML = '<div class="error">No data found in CSV</div>';
                return;
            }

            data.forEach((entry, index) => {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'entry';

                // Create header with title and toggle button
                const headerDiv = document.createElement('div');
                headerDiv.className = 'entry-header';
                
                const titleDiv = document.createElement('div');
                const name = entry['Име'] || 'Без име';
                const size = entry['Размер в брой параметри'] || '';
                titleDiv.innerHTML = `<span class="entry-title">${name}</span>${size ? `<span class="entry-size">(${size})</span>` : ''}`;
                
                const toggleButton = document.createElement('div');
                toggleButton.className = 'toggle-button';
                toggleButton.textContent = '+';
                
                headerDiv.appendChild(titleDiv);
                headerDiv.appendChild(toggleButton);

                // Create content div with table
                const contentDiv = document.createElement('div');
                contentDiv.className = 'entry-content-s';

                const table = document.createElement('table');
                table.className = 'entry-table';

                // Get all keys (categories) from the entry
                const categories = Object.keys(entry);

                categories.forEach(category => {
                    const value = entry[category];
                    
                    // Skip the **Абревиатура** category
                    if (category === '**Абревиатура**') {
                        return;
                    }
                    
                    // Only display if value is non-empty
                    if (value && value.toString().trim() !== '') {
                        const row = document.createElement('tr');
                        
                        const categoryCell = document.createElement('td');
                        categoryCell.className = 'category-name';
                        categoryCell.textContent = category;
                        
                        const valueCell = document.createElement('td');
                        valueCell.className = 'category-value';
                        valueCell.innerHTML = value;
                        
                        row.appendChild(categoryCell);
                        row.appendChild(valueCell);
                        table.appendChild(row);
                    }
                });

                contentDiv.appendChild(table);

                // Add click handler to toggle visibility
                headerDiv.addEventListener('click', function() {
                    contentDiv.classList.toggle('visible');
                    toggleButton.textContent = contentDiv.classList.contains('visible') ? '-' : '+';
                });

                entryDiv.appendChild(headerDiv);
                entryDiv.appendChild(contentDiv);
                container.appendChild(entryDiv);
            });
        }
